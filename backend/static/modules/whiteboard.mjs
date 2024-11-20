const whiteboard_template = `
<style>
@import '/static/common.css';
:host {
    display: block;
    > :not(canvas) {
        width: 100%;
        height: 100%;
    }
    > * {
        position: absolute;
    }
}
#code {
    filter: url(/static/filters.svg#black);
}
#annotations {
    filter: url(/static/filters.svg#blue);
}
#ui {
    .clickable {
        /* Move clickable UI elements above the touch input layer. */
        z-index: 2;
    }
    /* Immediate children of #ui are "floating" UI elements */
    > * {
        /* Enable manual positioning with top and left CSS properties. */
        position: absolute;
    }
}
</style>
<canvas id="background"></canvas>
<canvas id="code"></canvas>
<canvas id="annotations"></canvas>
<div id="ui"></div>
<div id="input"></div>
`;

class Whiteboard extends HTMLElement {
    static observedAttributes = ["line-width", "width", "height", "background"];

    #background;
    #code;
    #annotations;
    #ui;
    #input;
    #canvas_layers;
    #width;
    #height;
    #lineWidth;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.innerHTML = whiteboard_template;
        this.#background = shadowRoot.getElementById("background");
        this.#code = shadowRoot.getElementById("code");
        this.#annotations = shadowRoot.getElementById("annotations");
        this.#ui = shadowRoot.getElementById("ui");
        this.#input = shadowRoot.getElementById("input");
        this.#canvas_layers = [this.#background, this.#code, this.#annotations];
        this.#width = 0;
        this.#height = 0;
        this.#lineWidth = 1;
    }

    get width() {
        return this.#width;
    }
    set width(value) {
        this.#resize(parseInt(value), this.height);
    }

    get height() {
        return this.#height;
    }
    set height(value) {
        this.#resize(this.width, parseInt(value));
    }

    get background() {
        return this.getAttribute("background");
    }
    set background(value) {
        // TODO: Draw a background pattern: plain/squares/lines
    }

    get lineWidth() {
        return this.#lineWidth;
    }
    set lineWidth(value) {
        this.#lineWidth = parseInt(value);
        for (const c of this.#canvas_layers) {
            this.#configureCanvasLayer(c);
        }
    }

    /**
     * Configures a canvas layer for drawing according to our needs.
     * This includes:
     *   line style settings,
     *   a white pen colour, which we can then apply SVG filters to,
     *   the attribute ctx for convenient access to its 2D drawing context.
     */
    #configureCanvasLayer(canvas) {
        let ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = ctx.strokeStyle = "#ffffff";
        canvas.ctx = ctx;
    }

    /**
     * Resize a canvas layer, ideally while retaining its contents.
     * Updates the size of 'canvas' to match 'this'.
     * Refreshes the configuration, which is lost upon resizing.
     */
    #resizeCanvasLayer(canvas) {
        // TODO: Retain contents
        canvas.width = this.width;
        canvas.height = this.height;
        this.#configureCanvasLayer(canvas);
    }

    #resize(newWidth, newHeight) {
        this.#height = newHeight;
        this.#width = newWidth;
        this.style["width"] = newWidth + "px";
        this.style["height"] = newHeight + "px";
        for (const c of this.#canvas_layers) {
            this.#resizeCanvasLayer(c);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        switch (name) {
        case "line-width":
            this.lineWidth = newValue;
            break;
        case "width":
            this.width = newValue;
            break;
        case "height":
            this.height = newValue;
            break;
        case "background":
            this.background = newValue;
            break;
        }
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard };
