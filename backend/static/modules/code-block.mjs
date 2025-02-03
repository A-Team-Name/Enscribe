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
  <button id="close" class="material-symbols-outlined">close</button>
</div>
</div>
<div id="output-column">
  <textarea id="text" class="ui-window clickable">Program text</textarea>
  <textarea id="output" class="ui-window clickable">Output</textarea>
</div>
`;

class CodeBlock extends HTMLElement {
    static observedAttributes = [
        "data-x",
        "data-y",
        "data-width",
        "data-height",
        "disabled",
        "state",
    ];

    /** The region of the whiteboard that is selected for evaluation. */
    #selection;
    /** X coordinate where selection started. */
    #anchor_x;
    /** Y coordinate where selection started. */
    #anchor_y;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = code_block_template;

        this.#selection = shadowRoot.getElementById("selection");

        let programText = shadowRoot.getElementById("text");
        onEvent("change", shadowRoot.getElementById("show-text"),
            (show) => programText.style["display"] = show.checked ? "block" : "none");

        let programOutput = shadowRoot.getElementById("output");
        onEvent("change", shadowRoot.getElementById("show-output"),
            (show) => programOutput.style["display"] = show.checked ? "block" : "none");

        shadowRoot.getElementById("close")
            .addEventListener("click", () => this.#close());

        // Stop pointer events from "leaking" to the whiteboard when we don't want them to.
        this.addEventListener("pointerdown",
            (event) => event.stopPropagation());
        this.addEventListener("pointermove",
            (event) => event.stopPropagation());

        this.#anchor_x = this.#anchor_y = 0;
    }

    connectedCallback() {
        this.#anchor_x = this.dataset.x;
        this.#anchor_y = this.dataset.y;

        // Hide the UI initially so it doesn't flash up before the first pointermove event
        this.setAttribute("state", "stale");
    }

    /**
     * Resize the block in response to a pointer movement event
     */
    resize(event) {
        this.setAttribute("state", "resizing");
        console.log(this.getAttribute("state"));
        this.dataset.x = Math.min(event.offsetX, this.#anchor_x);
        this.dataset.y = Math.min(event.offsetY, this.#anchor_y);
        this.dataset.width = Math.abs(event.offsetX - this.#anchor_x);
        this.dataset.height = Math.abs(event.offsetY - this.#anchor_y);
    }

    /**
     * Get the bounding client rect of the selection (viewport coordinates)
     */
    getBoundingSelectionRect() {
        return this.#selection.getBoundingClientRect();
    }

    /**
     * Lock in the current size of the selection and make interactible.
     */
    confirm() {
        this.setAttribute("state", "stale");
        // This cleans up a selection if the user just clicked without dragging.
        if (this.dataset.width == 0 || this.dataset.height == 0) {
            this.#close();
        }
    }

    /**
     * Notify the code block of an update in the given rectangular region of the whiteboard/page.
     * The region is in whiteboard space
     */
    notifyUpdate(region) {
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
