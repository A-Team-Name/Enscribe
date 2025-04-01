const panel_template = `
<link rel="stylesheet" href="/static/radio_panel.css">
<fieldset class="spaced-bar">
<slot></slot>
</fieldset>
`;

class RadioPanel extends HTMLElement {
    static observedAttributes = [
        "name",
    ];

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.innerHTML = panel_template;

    }

    connectedCallback() {
        this.selected = this.querySelector('button[disabled]');
        this.value = this.selected?.value;

        for (const button of this.querySelectorAll('button')) {
            button.addEventListener(
                "click",
                (event) => {
                    // Re-enable the selected button if there is one.
                    if (this.selected !== null) {
                        this.selected.disabled = false;
                    }

                    this.value = button.value;
                    button.disabled = true;
                    this.selected = button;

                    // Prevent bubbling and dispatch a change event
                    event.stopPropagation();
                    this.dispatchEvent(new Event("change"));
                }
            )
        }
    }
};

customElements.define("radio-panel", RadioPanel);
export { RadioPanel };
