import { CodeBlock } from '/static/modules/code-block.mjs';

const whiteboard_template = `
<style>
@import '/static/common.css';
#container {
    touch-action: none;
    overflow: scroll;
    width: 100%;
    height: 100%;
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
:host([data-show-annotations="off"]) #annotations {
    display: none;
}
#ui {
    /* Immediate children of #ui are "floating" UI elements */
    > * {
        /* Enable manual positioning with top and left CSS properties. */
        position: absolute;
        cursor: auto;
    }
}

/* Cursors */
:host([data-tool="select"]) {
    cursor: crosshair;
}

:host([data-tool="pan"]) {
    cursor: grab;
}

/* TODO: Hide cursor when we add pen and eraser previews */
</style>
<div id="container">
  <div id="surface">
    <canvas id="background"></canvas>
    <canvas id="code"></canvas>
    <canvas id="annotations"></canvas>
    <div id="ui"></div>
  </div>
</div>
`;

class Whiteboard extends HTMLElement {
    static observedAttributes = [
        "data-line-width",
        "data-eraser-width",
        "data-pen",
        "data-tool",
        "data-width",
        "data-height",
        "data-background",
        "data-show-annotations",
        "data-touch-action",
    ];

    // DOM elements
    #container;
    #surface;
    #background;
    #code;
    #annotations;
    #ui;
    #canvas_layers;

    // Drawing state
    #code_ctx;
    #annotations_ctx;
    /** Starting X coordinate of most recent panning event */
    #start_x;
    /** Starting Y coordinate of most recent panning event */
    #start_y;
    #background_ctx;
    #pointer_active;
    #last_selection;
    #writing;

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.innerHTML = whiteboard_template;
        this.#container = shadowRoot.getElementById("container");
        this.#surface = shadowRoot.getElementById("surface");
        this.#background = shadowRoot.getElementById("background");
        this.#background.color = "#888888";
        this.#code = shadowRoot.getElementById("code");
        this.#code.color = "#000000";
        this.#annotations = shadowRoot.getElementById("annotations");
        this.#annotations.color = "#0000ff";
        this.#ui = shadowRoot.getElementById("ui");
        this.#canvas_layers = [this.#background, this.#code, this.#annotations];

        this.#start_x = 0;
        this.#start_y = 0;
        this.#code_ctx = this.#code.getContext("2d");
        this.#annotations_ctx = this.#annotations.getContext("2d");
        this.#background_ctx = this.#background.getContext("2d");
        this.#writing = false;
        this.#last_selection = null;

        this.#ui.addEventListener("pointerdown",
            (event) => this.#handlePointerDown(event));

        this.#ui.addEventListener("pointercancel",
            (event) => this.#handlePointerUp(event));
        this.#ui.addEventListener("pointerup",
            (event) => this.#handlePointerUp(event));

        this.#ui.addEventListener("pointermove",
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
     * Determine the type of action a pointer event should cause.
     * Takes this.dataset.tool, this.dataset.touchAction and event.pointerType into account.
     */
    #eventAction(event) {
        if (!event.isPrimary)
            return "none";
        switch (event.pointerType) {
        case "touch":
            if (this.dataset.touchAction === "pan") {
                return "pan";
            } else {
                return this.dataset.tool;
            }
        default:
            return this.dataset.tool;
        }
    }

    #handlePointerDown(event) {
        switch (this.#eventAction(event)) {
        case "erase":
            let ctx = this.#activeDrawingContext();
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = this.dataset.eraserWidth;
            this.#penDown(ctx, event.offsetX, event.offsetY);
        case "write":
            this.#penDown(this.#activeDrawingContext(), event.offsetX, event.offsetY);
            break;
        case "select":
            this.#createSelection(event.offsetX, event.offsetY);
            break;
        case "pan":
            this.#start_x = event.offsetX;
            this.#start_y = event.offsetY;
            break;
        }

    }

    /**
     * Decides what type of action to perform based on the PointerEvent received,
     * and the state of the whiteboard.
     */
    #handlePointerMove(event) {
        if (event.buttons === 0) {
            // The input is not active: do nothing.
            return;
        }

        switch (this.#eventAction(event)) {
        case "pan":
            this.#container.scrollBy(this.#start_x - event.offsetX, this.#start_y - event.offsetY);
            break;
        case "write":
            this.#draw(event, this.#activeDrawingContext());
            break;
        case "erase":
            let ctx = this.#activeDrawingContext();
            this.#draw(event, ctx);
            break;
        case "select":
            if (this.#last_selection !== null)
                this.#last_selection.resize(event);
            break;
        }
    }

    #handlePointerUp(event) {
        switch (this.#eventAction(event)) {
        case "erase":
            let ctx = this.#activeDrawingContext();
            ctx.globalCompositeOperation = "source-over";
            ctx.lineWidth = this.dataset.lineWidth;
            this.#penUp();
            break;
        case "write":
            this.#penUp();
            break;
        case "select":
            if (this.#last_selection !== null) {
                this.#last_selection.confirm();
                this.#last_selection = null;
                this.#enableAllBlocks();
            }
            break;
        }
    }

    #createSelection(x, y) {
        this.#disableAllBlocks();
        this.#last_selection = document.createElement("code-block");
        this.#last_selection.dataset.x = x;
        this.#last_selection.dataset.y = y;
        this.#last_selection.dataset.width = 0;
        this.#last_selection.dataset.height = 0;
        this.#ui.appendChild(this.#last_selection);
    }

    /**
     * Draw with PointerEvent event on 2D context ctx.
     */
    #draw(event, ctx) {
        if (!this.#writing)
            return;

        // Safari only has support for getCoalescedEvents as of 18.2
        if ("getCoalescedEvents" in event) {
            for (const e of event.getCoalescedEvents()) {
                // TODO: This has a performance hitch in firefox for large whiteboards (e.g. 5000x5000)
                ctx.lineTo(e.offsetX, e.offsetY);
            }
        } else {
            ctx.lineTo(event.offsetX, event.offsetY);
        }
        ctx.stroke();
    }

    /**
     * Start a new drawn line at (x, y) on ctx.
     * Draw a dot at that point, which will appear even if the pointer doesn't move.
     */
    #penDown(ctx, x, y) {
        this.#writing = true;
        this.#disableAllBlocks();
        this.#drawPoint(ctx, x, y);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    #penUp() {
        this.#writing = false;
        this.#enableAllBlocks();
    }

    #enableAllBlocks() {
        for (const block of this.#ui.querySelectorAll("code-block")) {
            block.removeAttribute("disabled");
        }
    }

    #disableAllBlocks() {
        for (const block of this.#ui.querySelectorAll("code-block")) {
            block.setAttribute("disabled", "");
        }
    }

    /** Draw a circle, diameter ctx.lineWidth at (x, y). */
    #drawPoint(ctx, x, y) {
        const circle = new Path2D();
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
        ctx.fillStyle = ctx.strokeStyle = canvas.color;
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
customElements.define("white-board", Whiteboard);

export { Whiteboard };
