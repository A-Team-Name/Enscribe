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
#lower {
    position: absolute;
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
<canvas id="lower">A canvas drawing context could not be created. This application requires canvas drawing to function.</canvas>
<div id="container">
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
        right: point.x - radius,
        left: point.x + radius,
        top: point.y - radius,
        bottom: point.y + radius,
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
    }

    recomputeBoundingRect() {
        let lineWidth2 = this.lineWidth/2;
        this.boundingRect = pointBoundingRect(this.points[0], lineWidth2);
        for (var i = 1; i < this.points.length; i += 1) {
            this.boundingRect = rectangleUnion(this.boundingRect, pointBoundingRect(this.points[i], lineWidth2));
        }
    }

    /// Draw this line in the given context, mapped within the given clip rectangle
    draw(ctx, clip) {
        if (!rectanglesOverlapping(this.boundingRect, clip)) {
            // The line lies outside the clip rectangle, so don't draw it.
            return;
        }
        if (this.points.length == 1) {
            // Render a single-point "line" as a point.
            ctx.fillStyle = this.color;
            const circle = new Path2D();
            circle.arc(
                this.points[0].x - clip.left, this.points[0].y - clip.top,
                this.lineWidth / 2, 0, 2 * Math.PI);
            ctx.fill(circle);
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x - clip.left, this.points[0].y - clip.top);
            for (var i = 1; i < this.points.length; i += 1) {
                ctx.lineTo(this.points[i].x - clip.left, this.points[i].y - clip.top);
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

    /// Draw the contents of this layer in the given context, bounded to the given clip rectangle
    draw(ctx, clip) {
        // lines is a sparse array, so we must use "in" rather than "of"
        for (const i in this.lines) {
            this.lines[i].draw(ctx, clip);
        }
    }

    /// Add a new line starting at point start, ready to draw directly on ctx
    newLine(ctx, start) {
        this.lines.push(new Line(this.color, this.lineWidth, start));
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = ctx.fillStyle = this.color;
    }

    /// Extend the last line on the Layer to point
    extendLine(point) {
        this.lines[this.lines.length - 1].addPoint(point);
    }

    /// Mark the last line as complete
    completeLine() {
        this.lines[this.lines.length -1].recomputeBoundingRect();
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
    #lower;
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

        this.#container.addEventListener("scroll", () => this.render());
    }

    connectedCallback() {
        this.#resizeCanvas();
        window.addEventListener("resize",
            () => this.#resizeCanvas());
    }

    /**
     * Get the "active" canvas drawing context, based on the data-pen attribute.
     */
    #activeDrawingContext() {
        return this.#lower;
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
        let active = this.layers[this.active_layer];
        // Safari only has support for getCoalescedEvents as of 18.2
        if ("getCoalescedEvents" in event) {
            let coa = event.getCoalescedEvents();
            for (const e of coa) {
                active.extendLine({x: e.offsetX, y: e.offsetY});
            }
        } else {
            active.extendLine({x: e.offsetX, y: e.offsetY});
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
        this.layers[this.active_layer].newLine(this.#lower, {y: y, x: x});
        this.render();
    }

    #penUp() {
        if (this.#writing) {
            this.#writing = false;
            this.layers[this.active_layer].completeLine();
            this.#enableAllBlocks();
            this.render();
        }
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

    #resizeSurface() {
        this.#surface.style["width"] = this.dataset.width + "px";
        this.#surface.style["height"] = this.dataset.height + "px";
    }

    /// Handle a change in the size of the visible region of the whiteboard.
    #resizeCanvas() {
        let container_bounds = this.getBoundingClientRect();
        this.#lower.canvas.width = container_bounds.width;
        this.#lower.canvas.height = container_bounds.height;
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
            this.#resizeSurface();
            break;
        case "data-background":
            // TODO: Draw a background pattern
            break;
        }
    }

    /// Compute the region of the whiteboard surface that intersects the canvas
    #clipRegion() {
        let ui_bounds = this.#ui.getBoundingClientRect();
        let canvas_bounds = this.#lower.canvas.getBoundingClientRect();
        let clip = {
            top: canvas_bounds.top - ui_bounds.top,
            left: canvas_bounds.left - ui_bounds.left,
        };
        clip.bottom = clip.top + this.#lower.canvas.height;
        clip.right = clip.left + this.#lower.canvas.width;
        return clip;
    }

    /// Re-draw the entire whiteboard contents (minimise calls to this)
    render() {
        this.#lower.clearRect(0, 0, this.#lower.canvas.width, this.#lower.canvas.height);
        this.#lower.lineCap = "round";
        this.#lower.lineJoin = "round";
        let clip = this.#clipRegion();

        for (const layer of this.layers) {
            layer.draw(this.#lower, clip);
        }
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard, Layer };
