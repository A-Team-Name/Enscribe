import { CodeBlock } from '/static/modules/code-block.mjs';
import { rectanglesOverlapping, rectangleUnion, circleBoundingRect, circlesOverlapping } from '/static/modules/shapeUtils.mjs';

const whiteboard_template = `
<style>
@import '/static/common.css';
:host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: clip;
}

#container {
    overscroll-behavior: none;
    overflow: scroll;
    width: 100%;
    /* Fill remaining vertical space of whiteboard element */
    flex-grow: 1;
}
#drawing {
    position: absolute;
}
#surface {
    display: block;
    > :not(canvas) {
        width: 100%;
        height: 100%;
    }
}
#ui {
    position: relative;
    /* Immediate children of #ui are "floating" UI elements */
    > * {
        /* Enable manual positioning with top and left CSS properties. */
        position: absolute;
        cursor: auto;
    }
}

#tab-bar {
    /* TODO: Do firefox-style overflow: scroll tabs, and keep new tab button visible */
    /* Put tab bar above canvases etc */
    z-index: 1;
    cursor: auto;
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
    gap: 0.5rem;
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
/* Background patterns based on: https://phuoc.ng/collection/css-layout/grid-lines-background/ */
#surface {
    background-size: 3rem 3rem;
    background-position: left left;
}
#surface[data-background=squares] {
    background-image: linear-gradient(to right, var(--ui-border-color) 1px, transparent 1px),
                      linear-gradient(to bottom, var(--ui-border-color) 1px, transparent 1px);
}
#surface[data-background=lines] {
    background-image: linear-gradient(to bottom, var(--ui-border-color) 1px, transparent 1px);
}
#surface[data-background=dots] {
    background-image: radial-gradient(circle, var(--ui-border-color) 2px, transparent 2px);
    background-position: center center;
}
</style>
<div id="tab-bar" class="tool-bar">
  <button class="material-symbols-outlined" id="new-tab">add</button>
</div>
<div id="container">
  <div id="surface">
    <canvas id="drawing">A canvas drawing context could not be created. This application requires canvas drawing to function.</canvas>
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
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? "#ffffff" : "#000000";
    } else {
        return color;
    }
}

class Line {
    constructor(color, lineWidth, start, points=[]) {
        this.color = color;
        this.lineWidth = lineWidth;
        if (points.length == 0){
            this.points = [start];
            this.boundingRect = circleBoundingRect(start, lineWidth/2);
        }
        else{
            this.points = points;
            this.recomputeBoundingRect();
        }
            
        
    }

    addPoint(point) {
        this.points.push(point);
    }

    recomputeBoundingRect() {
        let lineWidth2 = this.lineWidth/2;
        this.boundingRect = circleBoundingRect(this.points[0], lineWidth2);
        console.log(this.boundingRect)
        for (var i = 1; i < this.points.length; i += 1) {
            this.boundingRect = rectangleUnion(this.boundingRect, circleBoundingRect(this.points[i], lineWidth2));
        }
        console.log(this.boundingRect)
        
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
    constructor(name, is_code) {
        this.name = name;
        /// Contents of the layer
        this.lines = [];
        this.is_code = is_code;
    }

    /// Draw the contents of this layer in the given context, bounded to the given clip rectangle
    draw(ctx, clip) {
        // lines is a sparse array, so we must use "in" rather than "of"
        for (const i in this.lines) {
            this.lines[i].draw(ctx, clip);
        }
    }

    /**
     * Add a new line
     *
     * @param {DOMPoint} start - Starting point of the the line.
     * @param {number} lineWidth - Width of the line.
     * @param color - A color hex code, or the string "auto".
     *
     * @returns {Line} A reference to the new line that was created.
     */
    newLine(start, lineWidth, color) {
        let line = new Line(color, lineWidth, start);
        this.lines.push(line);
        return line;
    }

    /// Extend the last line on the Layer to point
    extendLine(point) {
        this.lines[this.lines.length - 1].addPoint(point);
    }

    /**
     * Mark the last line as complete and return a reference to it.
     * @returns Line? - The line that was completed, if any.
     */
    completeLine() {
        // Last line could be undefined if it was erased
        if (this.lines.length === 0 || this.lines[this.lines.length - 1] === undefined) {
            return null;
        }
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

/**
 * A collection of layers, each containing lines.
 *
 * Code blocks are not stored with their associated Page object because they are part of the DOM,
 * whereas the Page is our abstract representation of drawn lines.
 */
class Page {
    constructor(id) {
        this.layers = [
            new Layer("code", true),
            new Layer("annotations", false),
        ];
        this.id = id;
        // Scroll position of page, updated when switching away from a given page.
        this.scrollLeft = 0;
        this.scrollTop = 0;
    }
}

class Whiteboard extends HTMLElement {
    static observedAttributes = [
        "data-touch-action",
        "data-eraser-width",
        "data-layer",
        "data-tool",
        "data-width",
        "data-height",
        "data-background",
        "data-show-annotations",
        "data-default-language",
        "data-auto-execute",
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

    // Tabs/Pages
    #active_page;
    #tab_bar;
    #new_tab;
    #pages;
    #line_colors;

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

        document.getElementById("save")
            .addEventListener("click", () => {
                // alert("saving");
                // let canvas = shadowRoot.getElementById('drawing'); // Get the canvas element
                // console.log(canvas)
                // let dataURL = canvas.toDataURL("image/png"); // Convert canvas to PNG data URL
                
                // let a = document.createElement('a');
                // a.href = dataURL;
                // a.download = 'canvas-drawing.png'; // Set the file name
                // document.body.appendChild(a);
                // a.click()
                // document.body.removeChild(a); // Clean up

                console.log(this.#active_page.layers[0].lines) // code lines
                const jsonString = JSON.stringify(this.#active_page.layers[0].lines, null, 2); // Convert array to JSON string (pretty formatted)
                const blob = new Blob([jsonString], { type: "application/json" }); // Create a Blob
                const link = document.createElement("a"); // Create a temporary link
                link.href = URL.createObjectURL(blob); // Create a URL for the Blob
                link.download = "code-lines.json"; // Set filename
                document.body.appendChild(link);
                link.click(); // Trigger download
                document.body.removeChild(link); // Cleanup
            
            });

        document.getElementById("open")
            .addEventListener("click", () => {
                document.getElementById('fileInput').click();
            
            });

        
        document.getElementById('fileInput').addEventListener('change', (event) =>  {
            let file = event.target.files[0]; // Get the selected file
            if (file) {
                alert(`Selected file: ${file.name}`);
                // You can process the file here (e.g., read it, upload it, etc.)
                const reader = new FileReader();
    
                reader.onload = (event) => {
                    try {
                        
                        const code_lines = JSON.parse(event.target.result); // Parse JSON string into an array
                        console.log("Array of objects:", code_lines); // Log or process the array
                        var line_objs = []
                        console.log(code_lines)
                        console.log(code_lines[0])
                        for (var code_line of code_lines){
                            console.log(code_line)
                            console.log(code_line.color)
                            console.log(code_line.lineWidth)
                            console.log(code_line.points)
                            console.log(code_line.points[0])
                            let line = new Line(code_line.color, code_line.lineWidth, code_line.points[0], code_line.points);
                            console.log(line)
                            line_objs.push(line)
                        }

                    
                        this.#active_page.layers[0].lines = line_objs
                        
                    } catch (error) {
                        console.error("Invalid JSON file:", error);
                    }
                };

                
                reader.readAsText(file);

                

                // const img = new Image();
                // img.src = URL.createObjectURL(file); // Convert file to URL

                // img.onload = () => {
                //     alert(img.src)
                //     // this.#drawing.clearRect(0, 0, this.#drawing.canvas.width, this.#drawing.canvas.height);
                //     let clip = this.#clipRegion();
                //     // this.#drawing.canvas.drawImage(img, 0, 0, 0, 0); 
                //     this.active_layer;
                // };
                        }
        });


        // Default default language (used on hard reload)
        this.dataset.defaultLanguage = "python3";

        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener("change", () => setTimeout(() => { this.render() }));

        /** Thickness for new lines */
        this.lineWidth = 3;

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

        // Pages State
        this.#tab_bar = shadowRoot.getElementById("tab-bar");
        this.#new_tab = shadowRoot.getElementById("new-tab");

        this.#new_tab.addEventListener(
            "click",
            () => this.#newPage());

        this.#pages = new Map();
        this.#line_colors = { "code": "auto", "annotations": "#0000ff" };
        // TODO: Add code to load page state from local storage here
        this.#newPage();
    }

    connectedCallback() {
        this.#resizeCanvas();
        window.addEventListener("resize",
            () => this.#resizeCanvas());
    }

    // This get/set API exposes hex color values even if the line color is auto.
    // The color input type requires hex colors, hence this song and dance
    set lineColor(color) {
        // Enable auto colour if switching to what it would currently render as.
        if (color === interpretColor("auto")) {
            this.#line_colors[this.active_layer.name] = "auto";
        } else {
            this.#line_colors[this.active_layer.name] = color;
        }
    }

    get lineColor() {
        return interpretColor(this.#line_colors[this.active_layer.name]);
    }

    /**
     * Create a new page, and add a tab for it.
     * Make it the active page.
     * @returns {string} The id of the new page
     */
    #newPage() {
        // Get an unused ID for the tab
        let id = 1;
        while (this.#pages.has(id)) {
            id += 1;
        }

        let tab = document.createElement("button");
        tab.dataset.id = id;
        tab.classList.add("spaced-bar");
        // Hide the border on inactive tabs by default
        tab.style["border"] = "none";
        // Large space between label and close button
        tab.style["column-gap"] = "1rem";

        tab.addEventListener(
            "click",
            () => this.#switchToPage(tab.dataset.id));

        let label = "Tab " + id;
        let label_element = document.createElement("span");
        label_element.innerHTML = label;

        // Enable label editing on double-click.
        tab.addEventListener(
            "dblclick",
            () => {
                label_element.setAttribute("contenteditable", "true");
                label_element.focus();
            });

        // Disable contenteditable when the label loses focus.
        label_element.addEventListener(
            "focusout",
            () => label_element.removeAttribute("contenteditable"));

        tab.appendChild(label_element);

        let close_button = document.createElement("button");
        close_button.classList.add("material-symbols-outlined");
        close_button.innerHTML = "close";
        close_button.addEventListener(
            "click",
            (event) => {
                // Don't count this as a click on the tab, which would switch to it.
                event.stopPropagation();
                this.#closePage(id);
            });

        tab.appendChild(close_button);

        // Add the new tab at the end of the list, before the new tab button.
        this.#tab_bar.insertBefore(tab, this.#new_tab);

        this.#pages.set(id, new Page(id));
        this.#switchToPage(id);

        return id;
    }

    /**
     * Switch to the page with the given id, and hide code blocks that aren't on that page.
     */
    #switchToPage(id) {
        id = parseInt(id);
        // Remove the border of the deselected tab, if it exists
        let active_tab = this.#tab_bar.querySelector(`button[data-id='${this.#active_page?.id??-1}']`);
        if (active_tab !== null) {
            active_tab.style["border-color"] = "#00000000";
            // Store the scroll position of the page so we can have each scrolled a different amount
            this.#active_page.scrollLeft = this.#container.scrollLeft;
            this.#active_page.scrollTop = this.#container.scrollTop;
        }

        // Enable the border on the selected tab
        this.#tab_bar.querySelector(`button[data-id='${id}']`).style.removeProperty("border");

        this.#active_page = this.#pages.get(id);

        // Show only code blocks on the current page
        for (const block of this.#ui.querySelectorAll("code-block")) {
            block.style["visibility"] = block.dataset.page == id ? "visible" : "hidden";
        }

        // Switch to the same layer on the new page
        this.#switchToLayer(this.active_layer?.name ?? "code");

        // Apply the stored scroll position of the selected tab.
        this.#container.scrollTo(this.#active_page.scrollLeft, this.#active_page.scrollTop);

        this.render();
    }

    /**
     * Remove the page with the given id, and switch to the next tab if there is one, or the last
     * tab otherwise.
     * Do nothing if this is the only page.
     */
    #closePage(id) {
        id = parseInt(id);
        if (this.#pages.size <= 1) {
            return;
        }

        let page_tab = this.#tab_bar.querySelector(`button[data-id='${id}']`);

        // Switch to a different page if the active one was closed
        if (id == this.#active_page.id) {
            let last_tab =
                Array.from(this.#tab_bar.querySelectorAll(`button[data-id]`)).reverse()[0];
            // Switch to tab after the current one, or the one before it if this is the last.
            let target_tab =
                page_tab == last_tab ? last_tab.previousSibling : page_tab.nextSibling;

            this.#switchToPage(target_tab.dataset.id);
        }

        // Delete the page and its associated tab
        this.#pages.delete(id);
        page_tab.remove();

        // Delete associated code blocks
        for (const block of this.#ui.querySelectorAll(`code-block[data-page='${id}']`)) {
            block.remove();
        }
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
            // Use native touch for scrolling
            if (this.dataset.touchAction === "pan" || this.dataset.tool === "pan")
                return "none";
            else
                return this.dataset.tool;
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
        let action = this.#eventAction(event);
        switch (action) {
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
        if (action !== "none") {
            this.#writing = true;
            this.#drawCursor(event);
        }
    }

    #drawCursor(event) {
        // Show a preview of the cursor position
        if (event.isPrimary) {
            let clip = this.#clipRegion();
            switch (this.dataset.tool) {
            case "write":
                this.#drawing.fillStyle = this.lineColor;
                fillCircle(this.#drawing, event.offsetX - clip.left, event.offsetY - clip.top,
                    this.lineWidth/2);
                break;
            case "erase":
                this.#drawing.strokeStyle = this.lineColor;
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
                if (this.dataset.autoExecute === "on") {
                    // Immediately execute a code block if auto-execution is enabled.
                    this.#last_selection.execute();
                }
                this.#last_selection = null;
            }
            break;
        }
        this.#writing = false;
    }

    #createSelection(x, y) {
        this.#last_selection = document.createElement("code-block");
        this.#last_selection.dataset.x = x;
        this.#last_selection.dataset.y = y;
        this.#last_selection.dataset.width = 0;
        this.#last_selection.dataset.height = 0;
        this.#last_selection.setAttribute("language", this.dataset.defaultLanguage);
        this.#last_selection.whiteboard = this;
        this.#last_selection.dataset.page = this.#active_page.id;
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
        this.active_layer.newLine({y: y, x: x}, this.lineWidth,
            this.#line_colors[this.active_layer.name]);
        this.render();
    }

    #penUp() {
        if (this.#writing) {
            let line = this.active_layer.completeLine();

            if (line !== null && this.active_layer.is_code) {
                // Update any blocks the line intersected.
                for (const block of this.#ui.querySelectorAll("code-block")) {
                    block.notifyUpdate(line.boundingRect);
                }
            }

            this.#writing = false;
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
        // Match the size of the window to prevent situations where the canvas is too small after
        // some other element resized. This will usually not be much bigger than it would have to be
        // anyway, so we don't need to worry about the performance implications too much.
        this.#drawing.canvas.width = window.innerWidth;
        this.#drawing.canvas.height = window.innerHeight;
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
            this.#surface.dataset.background = newValue;
            break;
        case "data-layer":
            this.#switchToLayer(newValue);
            break;
        case "data-show-annotations":
            this.render();
            break;
        }
    }

    /**
     * Switch to the layer with the given name on the current page.
     */
    #switchToLayer(name) {
        for (var i = 0; i < this.#active_page.layers.length; i += 1) {
            if (name === this.#active_page.layers[i].name) {
                this.active_layer = this.#active_page.layers[i];
                break;
            }
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

    /**
     * Generate an image containing the whiteboard/page contents within clip
     * @param {DOMRect} clip
     */
    async extractCode(clip) {
        const codeCanvas = new OffscreenCanvas(clip.width, clip.height);
        let ctx = codeCanvas.getContext('2d');
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        this.#active_page.layers[0].draw(ctx, clip);
        return codeCanvas.convertToBlob();
    }

    /// Re-draw the entire whiteboard contents (minimise calls to this)
    render() {
        this.#drawing.clearRect(0, 0, this.#drawing.canvas.width, this.#drawing.canvas.height);
        this.#drawing.lineCap = "round";
        this.#drawing.lineJoin = "round";
        let clip = this.#clipRegion();

        for (const layer of this.#active_page.layers) {
            if (layer.is_code || this.dataset.showAnnotations === "on")
                layer.draw(this.#drawing, clip);
        }
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard, Layer };
