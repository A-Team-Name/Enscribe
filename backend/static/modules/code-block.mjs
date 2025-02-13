import { onEvent } from '/static/modules/reactivity.mjs';
import { rectanglesOverlapping } from '/static/modules/shapeUtils.mjs';

const code_block_template = `
<link rel="stylesheet" href="/static/code_block.css">
<div style="display: flex; flex-direction: column; align-items: right; width: max-content">
<div id="selection" class="selection"></div>
<div id="controls" class="ui-window clickable">
  <button id="run" class="material-symbols-outlined">play_arrow</button>
  <label class="material-symbols-outlined"><input id="show-output" name="show-output" type="checkbox"/>output</label>
  <label class="material-symbols-outlined"><input id="show-text" name="show-text" type="checkbox"/>text_fields</label>
  <button id="language-switch">
    <img height="24" src="/static/logos/apl.svg" alt="APL"/>
  </button>
  <button id="close" class="material-symbols-outlined">close</button>
  <dialog id="select-language" class="clickable"></dialog>
</div>
</div>
<div id="output-column">
  <textarea id="text" class="ui-window clickable"></textarea>
  <textarea id="output" class="ui-window clickable"></textarea>
</div>
`;

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

class CodeBlock extends HTMLElement {
    static languages = {
        "python3": {
            "logo": "/static/logos/python.svg",
            "name": "Python 3",
        },
        "dyalog_apl": {
            "logo": "/static/logos/apl.svg",
            "name": "APL",
        },
        "lambda-calculus": {
            "logo": "/static/logos/lambda.svg",
            "name": "λ Calculus",
        }
    };

    static observedAttributes = [
        "data-x",
        "data-y",
        "data-width",
        "data-height",
        "disabled",
        "state",
        "language",
        "predicted_text",
        "predictions"
    ];

    /** The region of the whiteboard that is selected for evaluation. */
    #selection;
    /** X coordinate where selection started. */
    #anchor_x;
    /** Y coordinate where selection started. */
    #anchor_y;
    /** Predicted text representation of code. */
    #text;
    /* Code evaluation result from server. */
    #output;
    /** The run button. */
    #run;
    /** The controls block. */
    #controls;

    /** Icon showing the logo for this block's language. */
    #language_logo;
    #language_button;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = code_block_template;

        this.#selection = shadowRoot.getElementById("selection");
        this.#text = shadowRoot.getElementById("text");
        this.#output = shadowRoot.getElementById("output");
        this.#controls = shadowRoot.getElementById("controls");

        // Set up text and output display toggle checkboxes.
        let programText = shadowRoot.getElementById("text");
        onEvent("change", shadowRoot.getElementById("show-text"),
            (show) => programText.style["display"] = show.checked ? "block" : "none");

        let programOutput = shadowRoot.getElementById("output");
        onEvent("change", shadowRoot.getElementById("show-output"),
            (show) => programOutput.style["display"] = show.checked ? "block" : "none");

        // Set up language switching UI.
        this.#language_logo = shadowRoot.querySelector("#language-switch > img");

        let select_language = shadowRoot.getElementById("select-language");
        this.#language_button = shadowRoot.querySelector("#language-switch");
        this.#language_button.addEventListener("click",
            () => select_language.show());
        // Generate buttons for each language.
        for (const language in CodeBlock.languages) {
            let lang_props = CodeBlock.languages[language];
            let language_label = document.createElement('button');
            language_label.title = lang_props.name;
            language_label.popoverTargetAction = "hide";
            language_label.popoverTargetElement = select_language;
            language_label.innerHTML = `
            <img height="24" src="${lang_props.logo}" alt="${lang_props.name}"/>`;
            select_language.appendChild(language_label);
            language_label.addEventListener("click",
                () => {
                    this.setAttribute("language", language);
                    select_language.close();
                });
        }

        // Delete selection when close button is clicked.
        shadowRoot.getElementById("close")
            .addEventListener("click", () => this.#close());

        this.#run = shadowRoot.getElementById("run");
        // Post screen capture image to '/image_to_text' when run button is clicked
        this.#run.addEventListener("click", async () => {
            // Disable the run button until we finish executing to prevent double-clicks.
            this.#run.disabled = true;
            await this.transcribeCodeBlockImage();
            // On run, we perform text recognition, so the block is no longer stale.
            this.setAttribute("state", "executed");
            this.executeTranscribedCode();

            // Re-enable the run button now code has executed.
            this.#run.disabled = false;

            var code_block_list = localStorage.getItem("code_block_list")
            // Convert HTML elements attributes to dict
            var attrbutes_dict = Array.from(this.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {});
            // If no existing code blocks then create list in local storage
            if (code_block_list == null){
                localStorage.setItem("code_block_list", JSON.stringify([attrbutes_dict]))
            }
            else{
                code_block_list = JSON.parse(code_block_list)
                var existing = false;
                // Loop through each code block in local storage 
                for (const code_block of code_block_list){
                    // If code block is already in list
                    if ((code_block["data-x"] == attrbutes_dict["data-x"]) && (code_block["data-y"] == attrbutes_dict["data-y"])){
                        // Update with new attributes
                        var removed_code_block_list = code_block_list.filter(item => item !== code_block);
                        var updated_code_block_list = code_block_list.concat(removed_code_block_list)
                        localStorage.setItem("code_block_list", JSON.stringify(updated_code_block_list))
                        existing = true;
                        break;

                    }
                }
                // If code block is not in list then add to list in local storage
                if (!existing){
                    var new_code_block_list = code_block_list.concat(attrbutes_dict)
                    localStorage.setItem("code_block_list", JSON.stringify(new_code_block_list))
                }
                
            }
        });

        // Stop pointer events from "leaking" to the whiteboard when we don't want them to.
        this.addEventListener("pointerdown",
            (event) => event.stopPropagation());
        this.addEventListener("pointermove",
            (event) => event.stopPropagation());

        this.#anchor_x = this.#anchor_y = 0;
        /// A reference to the whiteboard this selection is on, used for image extraction.
        this.whiteboard = null;
    }

    async transcribeCodeBlockImage() {
        let selectionContents = await this.whiteboard.extractCode(DOMRect.fromRect(this.dataset));

        // Put the screen capture image into FormData object
        const imageFormData = new FormData();
        imageFormData.append("img", selectionContents); // Add the image file to the form data
        imageFormData.append("name", "image_unique_id");

        return fetch("/image_to_text/", {
            method: "POST",
            body: imageFormData,
            headers: {
                "X-CSRFTOKEN" : csrftoken
            }
        })
            .then((rsp) => rsp.json())
            .then((json) => {
                this.setAttribute("predicted_text", json.predicted_text);
                this.setAttribute("predictions", JSON.stringify(json.predictions));
                this.#text.value = json.predicted_text;
            })
            .catch((error) => console.error("Error:", error));
    }

    executeTranscribedCode() {
        // Put the execution language and code to be executed into FormData object
        const executeFormData = new FormData();
        executeFormData.append("language", this.getAttribute("language"));
        executeFormData.append("code", this.#text.value);

        fetch("/execute/", {
            method: "POST",
            body: executeFormData,
            credentials: 'include',
            headers: {
                "X-CSRFTOKEN" : csrftoken
            }
        })
            .then((rsp) => rsp.json())
            .then((json) => {
                var output = "";
                // Loop through each line of output from /execute response
                for (const line of json.output_stream) {
                    // success = line.success
                    // content_type = line.type
                    output += line.content
                }
                this.#output.value = output;
            })
            .catch((error) => console.error("Error:", error));
    }

    connectedCallback() {
        // Hide the UI initially so it doesn't flash up before the first pointermove event
        this.setAttribute("state", "resizing");
        if (!this.hasAttribute("language")) {
            // TODO: Implement a better language selection policy.
            this.setAttribute("language", "python3");
        }
        this.#anchor_x = this.dataset.x;
        this.#anchor_y = this.dataset.y;
    }

    /**
     * Resize the block in response to a pointer movement event
     */
    resize(event) {
        // Move back into resizing state if it wasn't there already.
        this.setAttribute("state", "resizing");
        console.log(this.getAttribute("state"));
        this.dataset.x = Math.min(event.offsetX, this.#anchor_x);
        this.dataset.y = Math.min(event.offsetY, this.#anchor_y);
        this.dataset.width = Math.abs(event.offsetX - this.#anchor_x);
        this.dataset.height = Math.abs(event.offsetY - this.#anchor_y);
    }

    /**
     * Get the bounding client rect of the selection (viewport coordinates).
     * This includes the border of the selection.
     * @returns DOMRect - viewport bounds of selection
     */
    getBoundingSelectionRect() {
        return this.#selection.getBoundingClientRect();
    }

    /**
     * Lock in the current size of the selection and make interactible.
     */
    confirm() {
        // We haven't run text recognition yet: stale.
        this.setAttribute("state", "stale");
        // This cleans up a selection if the user just clicked without dragging.
        if (this.dataset.width == 0 || this.dataset.height == 0) {
            this.#close();
        }
    }

    /**
     * Notify the code block of an update in the given rectangular region of the whiteboard/page.
     * @param {DOMRect} region - The updated region in whiteboard space
     */
    notifyUpdate(region) {
        // Make the block stale if the update intersects it.
        let my_region = {
            left: parseInt(this.dataset.x), top: parseInt(this.dataset.y),
            right: parseInt(this.dataset.x) + parseInt(this.dataset.width),
            bottom: parseInt(this.dataset.y) + parseInt(this.dataset.height)
        };
        if (rectanglesOverlapping(region, my_region)) {
            this.setAttribute("state", "stale");
        }
    }

    #close() {
        this.remove();
    }


    setStyle() {
        console.log("resizing");
        switch (this.getAttribute("state")) {
        case "resizing":
            // loop through all the children of the shadow root
            this.#controls.style["display"] = "none";
            this.#selection.classList.remove("tentative");
            break;
        case "stale":
            this.#controls.style["display"] = "flex";
            this.#selection.classList.add("tentative");
            break;
        case "running":
            this.#controls.style["display"] = "flex";
            this.#selection.classList.remove("tentative");
            break;
        case "executed":
            this.#controls.style["display"] = "flex";
            this.#selection.classList.remove("tentative");
            break;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute changed: ${name} ${oldValue} -> ${newValue}`);
        switch (name) {
        case "data-x":
            this.style["left"] = newValue + "px";
            break;
        case "data-y":
            this.style["top"] = newValue + "px";
            break;
        case "data-width":
            this.#selection.style["width"] = newValue + "px";
            break;
        case "data-height":
            this.#selection.style["height"] = newValue + "px";
            break;
        case "language":
            // Display language in controls box.
            let newLanguage = CodeBlock.languages[newValue];
            this.#language_logo.src = newLanguage.logo;
            this.#language_logo.alt = newLanguage.name;
            break;
        case "state":
            this.setStyle();
            break;
        }
    }
}

customElements.define("code-block", CodeBlock);
export { CodeBlock };
