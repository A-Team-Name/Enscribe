const code_block_template = `
<link rel="stylesheet" href="/static/code_block.css">
<div style="display: flex; flex-direction: column; align-items: right; width: max-content">
<div id="selection" class="selection"></div>
<div id="controls" class="ui-window clickable">
  <button id="run" class="icon run"></button>
  <label><input name="show-output" type="checkbox" checked/> Output</label>
  <label><input name="show-text" type="checkbox" checked/> Text</label>
  <button id="close" class="icon close"></button>
</div>
</div>
<div id="output-column">
  <div id="text"   class="ui-window clickable"></div>
  <div id="output" class="ui-window clickable"></div>
</div>
`;

let csrfToken = null;
{
    // see https://docs.djangoproject.com/en/5.1/howto/csrf/
    let name = "csrftoken";
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                csrfToken = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    console.log("csrfToken:", csrfToken);
}

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

        const text   = shadowRoot.getElementById("text");
        const output = shadowRoot.getElementById("output");

        shadowRoot.getElementById("close").addEventListener("click",       () => this.#close());
        shadowRoot.getElementById("run")  .addEventListener("click", async () => {
            /* REAL CODE
            const response = await fetch("/execute/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken':  csrfToken,
                },
                body: JSON.stringify({
                    // TODO: send the image innit
                    code:     "{(+⌿⍵)÷≢⍵}3 1 4 1 5 9",
                    language: "dyalog_apl",
                    // code:     "print('Hello, world!')\n1+2+3\n",
                    // language: "python3",
                }),
            });
            const body = await response.json();
            console.log(body);
            text  .innerHTML = "<pre>" + body.code + "</pre>";
            output.innerHTML = body.output
                .map(({ success, type, content }) => {
                    if (!success) return "<pre>ERROR</pre>";
                    switch (type) {
                        case "text": return "<pre>" + content + "</pre>";
                        case "html": return           content           ;
                        default:     return "<pre>UNHANDLED</pre>";
                    }
                })
                .join("\n")
            ;
            */
            // BOTCH FOR DEMO
            text  .innerHTML = "<pre>{(+⌿⍵)÷≢⍵}3 1 4 1 5 9</pre>";
            output.innerHTML = "<pre>3.833333333</pre>";
        });

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
