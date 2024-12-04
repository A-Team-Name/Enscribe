const code_block_template = `
<style>
@import '/static/common.css';
:host {
   /* Allow pointer events to pass through unless explicitly enabled */
    pointer-events: none;
    display: grid;
    /* Align controls to the bottom right of selection, and spread output down the right */
    grid-template:
        "selection selection output"
        ".         controls  output"
        ".         .         output"
        / 1fr auto auto;
}
#selection {
    grid-area: selection;
    resize:both;
}
#controls {
    grid-area: controls;
    width: max-content;
}

#output-column {
    grid-column: output;
    /* spanning 3 rows lets #output-column extend past the second row without #controls moving */
    grid-row: span 3;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

#controls:not(:has(input[name="show-output"]:checked)) ~ * > #output {
    display: none;
}

#controls:not(:has(input[name="show-text"]:checked)) ~ * > #text {
    display: none;
}

.clickable {
    pointer-events: auto;
}

:host([disabled]) {
    opacity: 50%;
    .clickable {
        pointer-events: none;
    }
}

:host([resizing]) {
    :not(#selection) {
        display: none;
    }
}
</style>
<div id="selection" class="selection"></div>
<div id="controls" class="ui-window clickable">
  <button id="run" class="icon run"></button>
  <label><input name="show-output" type="checkbox" checked/> Output</label>
  <label><input name="show-text" type="checkbox"/> Text</label>
  <button id="close" class="icon close"></button>
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
        "resizing",
    ];

    #selection;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = code_block_template;

        this.#selection = shadowRoot.getElementById("selection");

        shadowRoot.getElementById("close")
            .addEventListener("click", () => this.#close());

        // Stop pointer events from "leaking" to the whiteboard when we don't want them to.
        this.addEventListener("pointerdown",
            (event) => event.stopPropagation());
        this.addEventListener("pointermove",
            (event) => event.stopPropagation());
    }

    connectedCallback() {
        // Hide the UI initially so it doesn't flash up before the first pointermove event
        this.setAttribute("resizing", "");
    }

    /**
     * Resize the block in response to a pointer movement event
     */
    resize(event) {
        this.setAttribute("resizing", "");
        let rect = this.#selection.getBoundingClientRect();
        this.dataset.width = event.clientX - rect.x;
        this.dataset.height = event.clientY - rect.y;
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
