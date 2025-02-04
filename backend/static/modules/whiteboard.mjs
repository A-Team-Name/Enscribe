import { CodeBlock } from '/static/modules/code-block.mjs';
import { rectanglesOverlapping, rectangleUnion, circleBoundingRect, circlesOverlapping } from '/static/modules/shapeUtils.mjs';

const whiteboard_template = `
<style>
@import '/static/common.css';
#container {
    overflow: scroll;
    width: 100%;
    height: 100%;
}
#drawing {
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

:host([data-tool="write"]), :host([data-tool="erase"]) {
    cursor: none;
}

/* TODO: Hide cursor when we add pen and eraser previews */
</style>
<canvas id="drawing">A canvas drawing context could not be created. This application requires canvas drawing to function.</canvas>
<div id="container">
  <div id="surface">
    <div id="ui"></div>
  </div>
</div>
`;

function fillCircle(ctx, x, y, radius) {
    const circle = new Path2D();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill(circle);
}

function strokeCircle(ctx, x, y, radius) {
    const circle = new Path2D();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke(circle);
}

function interpretColor(color) {
    if (color === "auto") {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? "white" : "black";
    } else {
        return color;
    }
}

class Line {
    constructor(color, lineWidth, start) {
        this.color = color;
        this.lineWidth = lineWidth;
        this.points = [start];
        this.boundingRect = circleBoundingRect(start, lineWidth/2);
    }

    addPoint(point) {
        this.points.push(point);
    }

    recomputeBoundingRect() {
        let lineWidth2 = this.lineWidth/2;
        this.boundingRect = circleBoundingRect(this.points[0], lineWidth2);
        for (var i = 1; i < this.points.length; i += 1) {
            this.boundingRect = rectangleUnion(this.boundingRect, circleBoundingRect(this.points[i], lineWidth2));
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
            ctx.fillStyle = interpretColor(this.color);
            fillCircle(ctx, this.points[0].x - clip.left, this.points[0].y - clip.top, this.lineWidth/2);
        } else {
            ctx.strokeStyle = interpretColor(this.color);
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

    /// Add a new line starting at point start
    newLine(start) {
        this.lines.push(new Line(this.color, this.lineWidth, start));
    }

    /// Extend the last line on the Layer to point
    extendLine(point) {
        this.lines[this.lines.length - 1].addPoint(point);
    }

    /// Mark the last line as complete and return a reference to it.
    completeLine() {
        this.lines[this.lines.length -1].recomputeBoundingRect();
        return this.lines[this.lines.length -1];
    }

    /**
     * Erase lines with vertices intersecting circle centre (x, y), of given radius.
     * @returns Array<Line> - the lines that were erased
     */
    erase(x, y, radius) {
        let erased = [];
        let eraserPoint = new DOMPoint(x, y);
        let eraserBoundingRect = circleBoundingRect(eraserPoint, radius);
        for (const i in this.lines) {
            // Do bounding box tests as a first pass for efficiency.
            if (rectanglesOverlapping(eraserBoundingRect, this.lines[i].boundingRect)) {
                let linePointRadius = (this.lines[i].lineWidth / 2);
                for (const point of this.lines[i].points) {
                    if (circlesOverlapping(eraserPoint, radius, point, linePointRadius)) {
                        erased.push(this.lines[i]);
                        delete this.lines[i];
                        break;
                    }
                }
            }
        }
        return erased;
    }
}

class Whiteboard extends HTMLElement {
    static observedAttributes = [
        "data-eraser-width",
        "data-layer",
        "data-tool",
        "data-width",
        "data-height",
        "data-background",
        "data-show-annotations",
        "data-default-language"
    ];

    // DOM elements
    #container;
    #surface;
    #ui;

    // Drawing state
    #drawing;
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
        this.#drawing = shadowRoot.getElementById("drawing").getContext("2d");
        this.#drawing.lineCap = "round";
        this.#drawing.lineJoin = "round";
        // Default default language (used on hard reload)
        this.dataset.defaultLanguage = "python3";

        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener("change", () => setTimeout(() => { this.render() }));

        this.layers = [
            new Layer("code", "auto", true),
            new Layer("annotations", "blue", false)
        ];
        this.active_layer = this.layers[0];

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

        this.#ui.addEventListener("touchstart",
            (event) => {
                if (this.#writing)
                    event.preventDefault();
            });

        this.#ui.addEventListener("dblclick",
            (event) => event.preventDefault());

        // Clear the "preview" cursor
        this.#ui.addEventListener("pointerleave",
            () => this.render());

        this.#container.addEventListener("scroll", () => this.render());
    }

    connectedCallback() {
        this.#resizeCanvas();
        window.addEventListener("resize",
            () => this.#resizeCanvas());
    }

    /**
     * Determine the type of action a pointer event should cause.
     * Takes this.dataset.tool and event.pointerType into account.
     */
    #eventAction(event) {
        if (!event.isPrimary)
            return "none";
        switch (event.pointerType) {
        case "touch":
            // We no longer attempt to handle touch events ourselves, at all
            return "none";
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
        event.preventDefault();
        if (event.isPrimary)
            event.target.setPointerCapture(event.pointerId);
        if (event.pointerType !== "touch")
            this.#writing = true;
        switch (this.#eventAction(event)) {
        case "erase":
            this.#erase(event.offsetX, event.offsetY);
            this.render();
            break;
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
        this.#drawCursor(event);
    }

    #drawCursor(event) {
        // Show a preview of the cursor position
        if (event.isPrimary) {
            let clip = this.#clipRegion();
            switch (this.dataset.tool) {
            case "write":
                this.#drawing.fillStyle = interpretColor(this.active_layer.color);
                fillCircle(this.#drawing, event.offsetX - clip.left, event.offsetY - clip.top,
                    this.active_layer.lineWidth/2);
                break;
            case "erase":
                this.#drawing.strokeStyle = interpretColor(this.active_layer.color);
                this.#drawing.lineWidth = 1;
                strokeCircle(this.#drawing, event.offsetX - clip.left, event.offsetY - clip.top,
                    this.dataset.eraserWidth/2);
            }
        }
    }

    /**
     * Decides what type of action to perform based on the PointerEvent received,
     * and the state of the whiteboard.
     */
    #handlePointerMove(event) {
        if (event.buttons !== 0) {
            // A button is pressed, so some action must be taken
            let action = this.#eventAction(event);
            // if (event.pointerType !== "touch")
            switch (action) {
            case "pan":
                this.#container.scrollBy(this.#start_x - event.offsetX, this.#start_y - event.offsetY);
                break;
            case "write":
                this.#draw(event);
                break;
            case "erase":
                this.#erase(event.offsetX, event.offsetY);
                break;
            case "select":
                if (this.#last_selection !== null)
                    this.#last_selection.resize(event);
                break;
            }
        }

        this.render();
        this.#drawCursor(event);
    }

    #handlePointerUp(event) {
        if (event.isPrimary)
            event.target.releasePointerCapture(event.pointerId);
        switch (this.#eventAction(event)) {
        case "erase":
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
        this.#writing = false;
    }

    #createSelection(x, y) {
        this.#disableAllBlocks();
        this.#last_selection = document.createElement("code-block");
        this.#last_selection.dataset.x = x;
        this.#last_selection.dataset.y = y;
        this.#last_selection.dataset.width = 0;
        this.#last_selection.dataset.height = 0;
        this.#last_selection.setAttribute("language", this.dataset.defaultLanguage);

        this.#ui.appendChild(this.#last_selection);
    }

    /**
     * Draw with PointerEvent event on 2D context ctx.
     */
    #draw(event) {
        if (!this.#writing)
            return;
        // Safari only has support for getCoalescedEvents as of 18.2
        if ("getCoalescedEvents" in event) {
            let coa = event.getCoalescedEvents();
            for (const e of coa) {
                this.active_layer.extendLine({x: e.offsetX, y: e.offsetY});
            }
        } else {
            this.active_layer.extendLine({x: event.offsetX, y: event.offsetY});
        }
    }

    /**
     * Start a new drawn line at (x, y) on ctx.
     * Draw a dot at that point, which will appear even if the pointer doesn't move.
     */
    #penDown(x, y) {
        this.#disableAllBlocks();
        this.active_layer.newLine({y: y, x: x});
        this.render();
    }

    #penUp() {
        if (this.#writing) {
            let line = this.active_layer.completeLine();

            // Update any blocks the line intersected.
            for (const block of this.#ui.querySelectorAll("code-block")) {
                block.notifyUpdate(line.boundingRect);
            }
            this.#enableAllBlocks();
        }
    }

    #erase(x, y) {
        console.log("erasing")
        let erased = this.active_layer.erase(x, y, parseInt(this.dataset.eraserWidth)/2);

        // Update any blocks that contained erased lines.
        if (this.active_layer.is_code) {
            for (const line of erased) {
                for (const block of this.#ui.querySelectorAll("code-block")) {
                    block.notifyUpdate(line.boundingRect);
                }
            }
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
        this.#drawing.canvas.width = container_bounds.width;
        this.#drawing.canvas.height = container_bounds.height;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        switch (name) {
        case "data-width":
        case "data-height":
            this.#resizeSurface();
            break;
        case "data-background":
            // TODO: Draw a background pattern
            break;
        case "data-layer":
            for (var i = 0; i < this.layers.length; i += 1) {
                if (newValue === this.layers[i].name) {
                    this.active_layer = this.layers[i];
                    break;
                }
            }
            break;
        case "data-show-annotations":
            this.render();
            break;
        }
    }

    /// Compute the region of the whiteboard surface that intersects the canvas
    #clipRegion() {
        let ui_bounds = this.#ui.getBoundingClientRect();
        let canvas_bounds = this.#drawing.canvas.getBoundingClientRect();
        let clip = {
            top: canvas_bounds.top - ui_bounds.top,
            left: canvas_bounds.left - ui_bounds.left,
        };
        clip.bottom = clip.top + this.#drawing.canvas.height;
        clip.right = clip.left + this.#drawing.canvas.width;
        return clip;
    }

    /// Re-draw the entire whiteboard contents (minimise calls to this)
    render() {
        this.#drawing.clearRect(0, 0, this.#drawing.canvas.width, this.#drawing.canvas.height);
        this.#drawing.lineCap = "round";
        this.#drawing.lineJoin = "round";
        let clip = this.#clipRegion();

        for (const layer of this.layers) {
            if (layer.is_code || this.dataset.showAnnotations === "on")
                layer.draw(this.#drawing, clip);
        }
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard, Layer };
