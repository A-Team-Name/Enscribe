import { CodeBlock } from '/static/modules/code-block.mjs';
import { onEvent } from '/static/modules/reactivity.mjs';

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
  <canvas id="contents">A canvas drawing context could not be created. This application requires canvas drawing to function.</canvas>
  <div id="surface">
    <div id="ui"></div>
  </div>
</div>
`;

function rectanglesOverlapping(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
}

/// Computes a rectangle that perfectly fits a and b
function rectangleUnion(a, b) {
    return {
        right: Math.max(a.right, b.right),
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        bottom: Math.max(a.bottom, b.bottom),
    };
}

/// Compute the bounding rectangle of a circle {y, x}, with the supplied radius
function pointBoundingRect(point, radius) {
    return {
        right: point.y - radius,
        left: point.y + radius,
        top: point.x - radius,
        bottom: point.x + radius,
    };
}

class Line {
    constructor(color, lineWidth, start) {
        this.color = color;
        this.lineWidth = lineWidth;
        this.points = [start];
        this.boundingRect = pointBoundingRect(start, lineWidth/2);
    }

    addPoint(point) {
        this.points.push(point);
        this.boundingRect = rectangleUnion(this.boundingRect,
            pointBoundingRect(point, lineWidth/2));
    }

    /// Draw this line in the given context, mapped within the given clip rectangle
    draw(ctx, clip) {
        if (!rectanglesOverlapping(this.boundingRect, clip)) {
            // The line lies outside the clip rectangle, so don't draw it.
            return;
        }
        if (points.length == 1) {
            // Render a single-point "line" as a point.
            ctx.fillStyle = this.color;
            const circle = new Path2D();
            circle.arc(points[0].x - clip.left, points[0].y - clip.top, this.lineWidth / 2, 0, 2 * Math.PI);
            ctx.fill(circle);
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(points[0].x - clip.left, points[0].y - clip.top);
            for (var i = 1; i < points.length; i += 1) {
                ctx.lineTo(points[i].x - clip.left, points[i].y - clip.top, points[i].y + offset.y);
            }
            ctx.stroke();
        }
    }
}

class Layer {
    constructor(name, color, is_code) {
        this.name = name;
        /// Contents of the layer
        this.lines = [];
        /// Color for new lines
        this.color = color;
        /// Thickness for new lines
        this.lineWidth = 3;
        this.is_code = is_code;
    }

    // Draw the contents of this layer in the given context, bounded to the given clip rectangle
    draw(ctx, clip) {
        // lines is a sparse array, so we must use "in" rather than "of"
        // TODO: in doesn't work, very sad
        for (const line in this.lines) {
            console.log(line);
            line.draw(ctx, clip);
        }
    }

    // Add a new line starting at point start
    newLine(start) {
        debugger;
        this.lines.push(new Line(this.color, this.lineWidth, start));
    }

    // Extend the last line on the Layer to point
    extendLine(point) {
        this.lines[this.lines.length - 1].addPoint(point);
    }
}

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
    #ui;

    // Drawing state
    #ctx;
    /** Starting X coordinate of most recent panning event */
    #start_x;
    /** Starting Y coordinate of most recent panning event */
    #start_y;
    #pointer_active;
    #last_selection;
    #writing;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: 'closed'});
        shadowRoot.innerHTML = whiteboard_template;
        this.#container = shadowRoot.getElementById("container");
        this.#surface = shadowRoot.getElementById("surface");
        this.#ui = shadowRoot.getElementById("ui");
        this.#ctx = shadowRoot.getElementById("contents").getContext("2d");
        this.#ctx.lineCap = "round";
        this.#ctx.lineJoin = "round";


        this.layers = [
            new Layer("Code", "light-dark(black, white)", true),
            new Layer("Annotations", "blue", false)
        ];
        this.active_layer = 0;

        this.#start_x = 0;
        this.#start_y = 0;
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

        this.#ui.addEventListener("dblclick",
            (event) => event.preventDefault());
    }

    /**
     * Get the "active" canvas drawing context, based on the data-pen attribute.
     */
    #activeDrawingContext() {
        return this.#ctx;
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
        case "mouse":
            if (event.buttons & 4)
                // Middle-click to scroll
                return "pan";
            else if (event.buttons & 2)
                // Ignore right click to prevent the application from starting a line when it shouldn't.
                return "none";
            else
                return this.dataset.tool;
        default:
            return this.dataset.tool;
        }
    }

    #handlePointerDown(event) {
        if (event.isPrimary)
            event.target.setPointerCapture(event.pointerId);
        switch (this.#eventAction(event)) {
        case "erase":
            let ctx = this.#activeDrawingContext();
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = this.dataset.eraserWidth;
            this.#penDown(event.offsetX, event.offsetY);
        case "write":
            this.#penDown(event.offsetX, event.offsetY);
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
            this.#draw(event);
            break;
        case "erase":
            let ctx = this.#activeDrawingContext();
            this.#draw(event);
            break;
        case "select":
            if (this.#last_selection !== null)
                this.#last_selection.resize(event);
            break;
        }
    }

    #handlePointerUp(event) {
        if (event.isPrimary)
            event.target.releasePointerCapture(event.pointerId);
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
    #draw(event) {
        if (!this.#writing)
            return;
        let point = {x: 0, y: 0};
        // Safari only has support for getCoalescedEvents as of 18.2
        if ("getCoalescedEvents" in event) {
            for (const e of event.getCoalescedEvents()) {
                // TODO: This has a performance hitch in firefox for large whiteboards (e.g. 5000x5000)
                point.x = e.offsetX;
                point.y = e.offsetY;
                this.layers[this.active_layer].extendLine(point);
            }
        } else {
            point.x = event.offsetX;
            point.y = event.offsetY;
            this.layers[this.active_layer].extendLine(point);
        }
        this.render();
    }

    /**
     * Start a new drawn line at (x, y) on ctx.
     * Draw a dot at that point, which will appear even if the pointer doesn't move.
     */
    #penDown(x, y) {
        this.#writing = true;
        this.#disableAllBlocks();
        this.layers[this.active_layer].newLine({y: y, x: x});
        this.render();
    }

    #penUp() {
        this.#writing = false;
        this.#enableAllBlocks();
        this.render();
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

    }

    /// Handle a change in the size of the visible region of the whiteboard.
    #resizeCanvas() {
        let container_bounds = this.#container.getBoundingClientRect();
        this.#ctx.canvas.width = container_bounds.width;
        this.#ctx.canvas.height = container_bounds.height;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        switch (name) {
        case "data-line-width":
            for (var l of this.layers) {
                l.lineWidth = this.dataset.lineWidth;
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

    /// Compute the region of the whiteboard surface that intersects the canvas
    clipRegion() {
        let surface_bounds = this.#surface.getBoundingClientRect();
        let canvas_bounds = this.#ctx.canvas.getBoundingClientRect();
        let clip = {
            top: canvas_bounds.top - surface_bounds.top,
            left: canvas_bounds.left - surface_bounds.left,
        };
        clip.bottom = clip.top + this.#ctx.canvas.height;
        clip.right = clip.left + this.#ctx.canvas.width;
        return clip;
    }

    /// Re-draw the entire whiteboard contents (minimise calls to this)
    render() {
        this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);
        let clip = this.clipRegion();

        for (const layer of this.layers) {
            layer.draw(this.#ctx, clip);
        }
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard, Layer };
