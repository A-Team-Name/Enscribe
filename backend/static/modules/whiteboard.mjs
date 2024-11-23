const whiteboard_template = `
<style>
@import '/static/common.css';
#container {
    touch-action: none;
    overflow: scroll;
    width: 100%;
    height: 100%;
}
:host([data-tool="pan"]) #container {
    touch-action: pan-x pan-y;
}
#surface {
    display: block;
    position: relative;
    border: var(--thick-border) dashed var(--ui-border-color);

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
:host([data-show-annotations="off"]) #annotations {
    display: none;
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
<div id="container">
  <div id="surface">
    <canvas id="background"></canvas>
    <canvas id="code"></canvas>
    <canvas id="annotations"></canvas>
    <div id="ui"></div>
    <div id="input"></div>
  </div>
</div>
`;

class Whiteboard extends HTMLElement {
    static observedAttributes = [
        "data-line-width",
        "data-pen",
        "data-tool",
        "data-width",
        "data-height",
        "data-background",
        "data-show-annotations",
    ];

    // DOM elements
    #container;
    #surface;
    #background;
    #code;
    #annotations;
    #ui;
    #input;
    #canvas_layers;

    // Drawing state
    #code_ctx;
    #annotations_ctx;
    #background_ctx;
    #pointer_active;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.innerHTML = whiteboard_template;
        this.#container = shadowRoot.getElementById("container");
        this.#surface = shadowRoot.getElementById("surface");
        this.#background = shadowRoot.getElementById("background");
        this.#code = shadowRoot.getElementById("code");
        this.#annotations = shadowRoot.getElementById("annotations");
        this.#ui = shadowRoot.getElementById("ui");
        this.#input = shadowRoot.getElementById("input");
        this.#canvas_layers = [this.#background, this.#code, this.#annotations];

        this.#code_ctx = this.#code.getContext("2d");
        this.#annotations_ctx = this.#annotations.getContext("2d");
        this.#background_ctx = this.#background.getContext("2d");

        this.#input.addEventListener("pointerdown",
            (event) => this.#handlePointerMove(event));

        this.#input.addEventListener("pointermove",
            (event) => this.#handlePointerMove(event));

    }

    /**
     * Get the "active" canvas drawing context, based on the data-pen attribute.
     */
    #activeDrawingContext() {
        if (this.dataset.pen === "code") {
            return this.#code_ctx;
        } else {
            return this.#annotations_ctx;
        }
    }

    /**
     * Decides what type of action to perform based on the PointerEvent received,
     * and the state of the whiteboard.
     */
    #handlePointerMove(event) {
        event.preventDefault();
        if (event.buttons === 0) {
            // The input is not active: do nothing.
            return;
        }

        switch (this.dataset.tool) {
        case "pan":
            // We can rely on default panning behaviour for touch.
            if (event.pointerType !== "touch") {
                this.#container.scrollBy(-event.movementX, -event.movementY);
            }
            break;
        case "write":
            this.#draw(event, this.#activeDrawingContext());
            break;
        case "erase":
            let ctx = this.#activeDrawingContext();
            ctx.globalCompositeOperation = "destination-out";
            this.#draw(event, ctx);
            ctx.globalCompositeOperation = "source-over";
            break;
        case "select":
            // TODO: Implement selection
            break;
        }
    }

    /**
     * Apply PointerEvent event to 2D context ctx.
     */
    #draw(event, ctx) {
        if (event.type === "pointerdown") {
            console.log("pointerdown");
            this.#penDown(ctx, event.offsetX, event.offsetY);
            return;
        }

        for (const e of event.getCoalescedEvents()) {
            // TODO: This has a performance hitch in firefox for large whiteboards (e.g. 5000x5000)
            ctx.lineTo(e.offsetX, e.offsetY);
        }
        ctx.stroke();
    }

    /**
     * Start a new drawn line at (x, y) on ctx.
     * Draw a dot at that point, which will appear even if the pointer doesn't move.
     */
    #penDown(ctx, x, y) {
        this.#drawPoint(ctx, x, y);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    /** Draw a circle, diameter ctx.lineWidth at (x, y). */
    #drawPoint(ctx, x, y) {
        const circle = new Path2D();
        // ctx.fillStyle = color;
        // Radius must be half ctx.lineWidth so diameter matches lines.
        circle.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
        ctx.fill(circle);
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
        ctx.lineWidth = this.dataset.lineWidth;
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
        canvas.width = this.dataset.width;
        canvas.height = this.dataset.height;
        this.#configureCanvasLayer(canvas);
    }

    #resize() {
        this.#surface.style["width"] = this.dataset.width + "px";
        this.#surface.style["height"] = this.dataset.height + "px";
        for (const c of this.#canvas_layers) {
            this.#resizeCanvasLayer(c);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        switch (name) {
        case "data-line-width":
            for (const c of this.#canvas_layers) {
                this.#configureCanvasLayer(c);
            }
            break;
        case "data-width":
        case "data-height":
            this.#resize();
            break;
        case "data-background":
            // TODO: Draw a background pattern
            break;
        }
    }
}

export { Whiteboard };
