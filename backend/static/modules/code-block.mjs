/**
 * @module code-block
 */

import { onEvent } from './reactivity.mjs';
import * as shapeUtils from './shapeUtils.mjs';

const code_block_template = `
<link rel="stylesheet" href="/static/code_block.css">
<div style="display: flex; flex-direction: column; align-items: right; width: max-content">
<div id="selection" class="selection"></div>
<div id="controls" class="ui-window clickable">
  <button id="run" class="material-symbols-outlined">play_arrow</button>
  <span id="loader"></span>
  <span id="tick"></span>
  <button id="language-switch">
    <img height="24" src="/static/logos/apl.svg" alt="APL"/>
  </button>
  <button id="close" class="material-symbols-outlined">close</button>
  <dialog id="select-language" class="clickable"></dialog>
</div>
</div>
<div id="output-column">
  <div class="toggle-box">
    <label class="material-symbols-outlined clickable"><input id="show-text" name="show-text" type="checkbox" class="toggle-button"/>text_fields</label>
    <div contenteditable="true" id="text" class="ui-window clickable resizeable"></div>
  </div>
  <dialog id="predictions" class="ui-window clickable"></dialog>
  <div class="toggle-box">
    <label class="material-symbols-outlined clickable"><input id="show-output" name="show-output" type="checkbox" class="toggle-button"/>output</label>
    <div contenteditable="true" id="output" class="ui-window clickable resizeable"></div>
  </div>
</div>
`;

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

/**
 * A code block element, that can be used to run handwritten code.
 */
export class CodeBlock extends HTMLElement {
    /**
     * The names and logos of the possible code block languages.
     */
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
        "state",
        "language",
        "predicted-text",
        "execution-output",
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
    /** Checkbox for toggling text representation visibility. */
    #text_toggle;
    /** Div for buttons for each character */
    #predictions;
    /** Code evaluation result from server. */
    #output;
    /** Checkbox for toggling output visibility. */
    #output_toggle;
    /** The run button. */
    #run;
    /** The controls block. */
    #controls;
    /** The tick icon */
    #tick;
    /** The container for the entire output column */
    #output_column;

    /** Icon showing the logo for this block's language. */
    #language_logo;
    /** Button to open code block language switching popup. */
    #language_button;

    /** Handwriting recognition model selected in settings */
    #selectedModel;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = code_block_template;

        this.#output_column = shadowRoot.getElementById("output-column");
        this.#selection = shadowRoot.getElementById("selection");
        this.#text = shadowRoot.getElementById("text");
        this.#output = shadowRoot.getElementById("output");
        this.#controls = shadowRoot.getElementById("controls");
        this.#tick = shadowRoot.getElementById("tick");
        this.#tick.style["display"] = "none";
        this.#selectedModel = document.getElementById("model");

        // Set up text and output display toggle checkboxes.
        this.#text_toggle = shadowRoot.getElementById("show-text")
        onEvent("change", this.#text_toggle,
            (toggle) => {
                if (toggle.checked)
                    this.#showText();
                else
                    this.#hideText();
            },
            false
        );

        this.#output_toggle = shadowRoot.getElementById("show-output");
        onEvent("change", this.#output_toggle,
            (toggle) => {
                if (toggle.checked)
                    this.#showOutput();
                else
                    this.#hideOutput();
            },
            false
        );

        // Set up language switching UI.
        this.#language_logo = shadowRoot.querySelector("#language-switch > img");

        let select_language = shadowRoot.getElementById("select-language");
        this.#language_button = shadowRoot.querySelector("#language-switch");

        // Open language selection menu if closed, close menu if already open
        this.#language_button.addEventListener("click", (e) => {
            if (select_language.open) {
                select_language.close();
            }
            else {
                select_language.show();
            }
            e.stopPropagation();
        });

        select_language.addEventListener("click", (e) => {
            select_language.show();
            e.stopPropagation();
        });

        // Generate buttons for switching to each language.
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
                (e) => {
                    this.setAttribute("language", language);
                    select_language.close();
                    e.stopPropagation()
                });
        }

        // Delete selection when close button is clicked.
        shadowRoot.getElementById("close")
            .addEventListener("click", () => {
                // Defer responsibility for deleting the block to the whiteboard, which can record
                // an associated CloseSelectionAction. The contents of a message must be pure JSON,
                // so we can't simply pass a reference to the code block. The index is sufficiently
                // unambiguous for the whiteboard to determine which block sent the notification.
                window.postMessage({
                    "deleteCodeBlock": Array.from(this.parentElement.childNodes).indexOf(this)
                });
            });

        this.#run = shadowRoot.getElementById("run");
        // Post screen capture image to '/image_to_text' when run button is clicked
        this.#run.addEventListener("click", () => this.execute());

        // Stop pointer events from "leaking" to the whiteboard when we don't want them to.
        this.addEventListener("pointerdown", (event) => event.stopPropagation());
        this.addEventListener("pointermove", (event) => event.stopPropagation());

        this.#anchor_x = this.#anchor_y = 0;
        /// A reference to the whiteboard this selection is on, used for image extraction.
        this.whiteboard = null;

        this.#predictions = shadowRoot.getElementById("predictions");
        this.#predictions.close();

        this.#text.addEventListener("input", () => {
            this.predicted_text = this.#text.textContent;
            this.setAttribute("predicted-text", this.#text.textContent);
        })

        // Close menus on click anywhere outside the element
        document.addEventListener("click", () => {
            this.#predictions.close()
            select_language.close()
        });

        // Ensure menus are not closed when their element is clicked on
        this.#predictions.addEventListener("click", (e) => {
            this.#predictions.show()
            e.stopPropagation()
        });

    }

    /**
     * Execute the code block. Perform handwriting recognition ("transcribe") first if necessary.
     */
    async execute() {
        // Disable the run button until we finish executing to prevent double-clicks.
        this.#run.disabled = true;

        // Only transcribe when user has made changes to code block
        if (this.getAttribute("state") == "stale") {
            await this.transcribeCodeBlockImage();
        }

        // On run, we perform text recognition, so the block is no longer stale.
        this.setAttribute("state", "executed");

        await this.executeTranscribedCode();

        // Re-enable the run button now code has executed.
        this.#run.disabled = false;
    }
    async transcribeCodeBlockImage() {
        let selectionContents = await this.whiteboard.extractCode(DOMRect.fromRect(this.dataset));

        let language = this.getAttribute("language");
        let complete_model = this.#selectedModel.value + "-" + language;

        // Put the screen capture image into FormData object
        const imageFormData = new FormData();
        imageFormData.append("img", selectionContents); // Add the image file to the form data
        imageFormData.append("name", "image_unique_id");
        imageFormData.append("model_name", complete_model);

        return fetch("/image_to_text/", {
            method: "POST",
            body: imageFormData,
            headers: {
                "X-CSRFTOKEN": csrftoken
            }
        })
            .then((rsp) => rsp.json())
            .then((json) => {
                // Set the predicted text attribute to transcribed text and display in text box
                this.setAttribute("predicted-text", json.predicted_text);
                this.#text.textContent = json.predicted_text;
                this.setAttribute("predictions", JSON.stringify(json.predictions["predictions"]));

                // Update the change character predictions UI
                this.#predictions.value = JSON.stringify(json.predictions["predictions"]);
                try {
                    this.predictions_dict = json.predictions["predictions"]
                }
                catch (error) {
                    console.log("Error loading predictions dictionary: " + error)
                }
                this.refreshClickableCharacters();
            })
            .catch((error) => console.error("Error:", error));
    }

    /**
     * Add event listeners to display the corrections UI for each character in the predicted text
     */
    refreshClickableCharacters() {

        var text = this.#text.textContent;

        // Clear previous buttons
        this.#text.innerHTML = "";

        // Insert zero width space so text can be inserted
        const empty_span = document.createElement("span");
        empty_span.textContent = "​";
        empty_span.className = "char predicted-text-span";
        this.#text.appendChild(empty_span);

        // Loop through each character in predicted text field
        this.predictions_dict.forEach((preds, index) => {
            var char = preds[0]["character"];
            // Create a span element and insert the character
            const span = document.createElement("span");
            span.textContent = char || " ";
            span.className = "char predicted-text-span";
            span.contentEditable = "false";

            // Add event listener to display the top 3 predictions for that character's position
            span.onclick = (e) => {
                e.stopPropagation();
                // Unhide the predictions box
                this.#predictions.show()
                this.#predictions.focus()

                // Get the predictions for this position in the predicted text
                var character_predictions = this.predictions_dict[index];

                // Clear predictions field
                this.#predictions.innerHTML = "";

                // Loop through each prediction
                for (const character_prediction of character_predictions) {
                    // Create a button
                    const character_button = document.createElement("button");

                    character_button.className = "char-button character-button";

                    // Set text content to predicted character and its probability
                    character_button.textContent = character_prediction["character"] +
                        "        -       " + parseFloat(character_prediction["probability"]).toFixed(2);

                    // Add event listener to replace selected character with the new chosen character
                    character_button.onclick = (e) => {
                        e.stopPropagation();
                        span.textContent = character_prediction["character"] || " ";

                        this.predicted_text = this.#text.textContent;
                        this.setAttribute("predicted-text", this.#text.textContent);

                        // Close predictions menu when user has clicked on a character
                        this.#predictions.close()
                        e.stopPropagation();
                    }

                    this.#predictions.appendChild(character_button);
                }
            }
            // Insert zero width spaces so text can be inserted
            this.#text.appendChild(span);
            const empty_span = document.createElement("span");
            empty_span.textContent = "​";
            empty_span.className = "char predicted-text-span";
            this.#text.appendChild(empty_span);
        });

    }

    /**
     * Pass the current text representation of the block to the backend to execute.
     */
    async executeTranscribedCode() {
        // Put the execution language and code to be executed into FormData object
        const executeFormData = new FormData();
        const cleaned_text = this.#text.textContent.replace(/\u200B/g, ''); // Remove zero width spaces
        executeFormData.append("language", this.getAttribute("language"));
        executeFormData.append("code", cleaned_text);

        return fetch("/execute/", {
            method: "POST",
            body: executeFormData,
            credentials: 'include',
            headers: {
                "X-CSRFTOKEN": csrftoken
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
                var cleaned_output = output.replace(/\x1b\[[0-9;]*m/g, '');
                this.setAttribute("execution-output", cleaned_output);
            })
            .catch((error) => console.error("Error:", error));
    }

    connectedCallback() {
        // Hide the UI initially so it doesn't flash up before the first pointermove event
        // The attribute value (String) "false" is truthy, so manually compare to it.
        if (this.hasAttribute("restored") && this.getAttribute("restored") !== "false") {
            this.setAttribute("state", "executed");
        }
        else {
            this.setAttribute("state", "resizing");
        }
        if (!this.hasAttribute("language")) {
            // Use python as the default language if no other is selected
            this.setAttribute("language", "python3");
        }
        this.#anchor_x = this.dataset.x;
        this.#anchor_y = this.dataset.y;
    }

    /**
     * Resize the block in response to a pointer movement event.
     */
    resize(event) {
        // Move back into resizing state if it wasn't there already.
        this.setAttribute("state", "resizing");
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
     * Lock in the current size of the selection, and display its UI.
     */
    confirm() {
        // We haven't run text recognition yet: stale.
        this.setAttribute("state", "stale");
        // This cleans up a selection if the user just clicked without dragging.
        if (this.dataset.width == 0 || this.dataset.height == 0) {
            this.close();
        }
    }

    /**
     * Notify the code block of an update in the given rectangular region of the whiteboard/page.
     * @param {shapeUtils.Rectangle} region - The updated region in whiteboard space
     */
    notifyUpdate(region) {
        // Make the block stale if the update intersects it.
        let my_region = {
            left: parseInt(this.dataset.x), top: parseInt(this.dataset.y),
            right: parseInt(this.dataset.x) + parseInt(this.dataset.width),
            bottom: parseInt(this.dataset.y) + parseInt(this.dataset.height)
        };
        if (shapeUtils.rectanglesOverlapping(region, my_region)) {
            this.setAttribute("state", "stale");
        }
    }

    /**
     * Close the code block
     */
    close() {
        this.remove();
    }

    #showControls() {
        // We can't just set visibility to "visible" here because this would override hiding
        // inactive tabs/pages, which also relies on visibility.
        this.#controls.style.removeProperty("visibility");
        this.#output_column.style.removeProperty("visibility");
    }

    #hideControls() {
        this.#controls.style.visibility = "hidden";
        this.#output_column.style.visibility = "hidden";
    }

    #showOutput() {
        // We have to use display rather than visibility for text and output because Safari doesn't
        // handle visibility="collapse" properly. We would have to use visibility="hidden", which
        // would leave the output floating part-way down the selection height if it was the only one
        // visible.
        this.#output.style.removeProperty("display");
        this.#output_toggle.checked = true;
    }

    #hideOutput() {
        this.#output.style.display = "none";
        this.#output_toggle.checked = false;
    }

    #showText() {
        this.#text.style.removeProperty("display");
        this.#text_toggle.checked = true;
    }

    #hideText() {
        this.#text.style.display = "none";
        this.#text_toggle.checked = false;
    }

    /**
     * Perform a state transition from oldState to newState.
     *
     * @param {"resizing" | "stale" | "running" | "executed" } oldState
     * @param {"resizing" | "stale" | "running" | "executed" } newState
     */
    updateState(oldState, newState) {
        // Update the code block's UI to match newState.
        //
        // By separating logic for leaving and entering states, the intention of the code is
        // clearer, and it's less repetitive.
        switch (oldState) {
            case "resizing":
                this.#showControls();
                break;
            case "stale":
                this.#selection.classList.remove("tentative");
                break;
        }

        switch (newState) {
            case "resizing":
                this.#hideControls();
                this.#hideOutput();
                this.#hideText();
                break;
            case "stale":
                this.#selection.classList.add("tentative");
                // The text representation is no longer valid, so hide it, and don't let user show it.
                // They might still want to see the output, so don't mess with that.
                this.#hideText();
                this.#text_toggle.disabled = true;
                this.#tick.style["display"] = "none";
                break;
            case "running":
                this.#controls.style["display"] = "block";
                this.#selection.classList.remove("tentative");
                this.#tick.style["display"] = "none";
                break;
            case "executed":
                this.#controls.style["display"] = "block";
                this.#selection.classList.remove("tentative");
                this.#tick.style["display"] = "inline-block";

                // enable displaying text representation
                this.#text_toggle.disabled = false;
                this.#showOutput();

                break;
        }
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
            case "language":
                // Display language in controls box.
                let newLanguage = CodeBlock.languages[newValue];
                this.#language_logo.src = newLanguage.logo;
                this.#language_logo.alt = newLanguage.name;
                if (oldValue !== newValue) {
                    // The current text representation is no longer valid, so the block becomes stale.
                    this.setAttribute("state", "stale");
                }
                // Update the application-level default language to match what we set here.
                window.postMessage({ "setting": "defaultLanguage", "value": newValue });
                break;
            case "state":
                this.updateState(oldValue, newValue);
                break;
            case "predictions":
                // Update the change character predictions UI
                this.#predictions.value = newValue;
                try {
                    this.predictions_dict = JSON.parse(newValue);
                }
                catch (error) {
                    console.log("Error loading predictions dictionary: " + error)
                }
                var predicted_text = this.getAttribute("predicted-text");
                this.#text.textContent = predicted_text;
                break;
            case "execution-output":
                this.#output.textContent = newValue;
                break;
        }
    }
}

customElements.define("code-block", CodeBlock);
