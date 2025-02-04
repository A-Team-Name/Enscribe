const code_block_template = `
<link rel="stylesheet" href="/static/code_block.css">
<div style="display: flex; flex-direction: column; align-items: right; width: max-content">
<div id="selection" class="selection"></div>
<div id="controls" class="ui-window clickable">
  <button id="run" class="material-symbols-outlined">play_arrow</button>
  <label class="material-symbols-outlined"><input name="show-output" type="checkbox" checked/>output</label>
  <label class="material-symbols-outlined"><input name="show-text" type="checkbox"/>text_fields</label>
  <button id="close" class="material-symbols-outlined">close</button>
</div>
</div>
<div id="output-column">
  <textarea id="text" class="ui-window clickable">print('hello world')\nx=1+2\nprint(x)</textarea>
  <textarea id="output" class="ui-window clickable">Output</textarea>
</div>
`;

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

class CodeBlock extends HTMLElement {
    static observedAttributes = [
        "data-x",
        "data-y",
        "data-width",
        "data-height",
        "disabled",
        "resizing",
        "language",
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

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = code_block_template;

        this.#selection = shadowRoot.getElementById("selection");
        this.#text = shadowRoot.getElementById("text");
        this.#output = shadowRoot.getElementById("output");

        shadowRoot.getElementById("close")
            .addEventListener("click", () => this.#close());

        // Post screen capture image to '/image_to_text' when run button is clicked
        shadowRoot.getElementById("run")
            .addEventListener("click", async () => {

                await this.transcribeCodeBlockImage();
                this.executeTranscribedCode();

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
        this.setAttribute("resizing", "");
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
        this.setAttribute("resizing", "");
        this.dataset.x = Math.min(event.offsetX, this.#anchor_x);
        this.dataset.y = Math.min(event.offsetY, this.#anchor_y);
        this.dataset.width = Math.abs(event.offsetX - this.#anchor_x);
        this.dataset.height = Math.abs(event.offsetY - this.#anchor_y);
    }

    /**
     * Lock in the current size of the selection and make interactible.
     */
    confirm() {
        this.removeAttribute("resizing");
        // This cleans up a selection if the user just clicked without dragging.
        if (this.dataset.width == 0 || this.dataset.height == 0) {
            this.#close();
        }
    }

    #close() {
        this.remove();
    }

    attributeChangedCallback(name, oldValue, newValue) {
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
        }
    }
}

customElements.define("code-block", CodeBlock);
export { CodeBlock };
