import { DrawAction, EraseAction, CreateSelectionAction, CloseSelectionAction } from './undo-redo.mjs';
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
    align-items: center;
}

#notebook-name-label-container{
    width:15%;
    text-align:center;
    text-overflow: ellipsis;
    overflow: hidden;
}

#restart-kernel{
    margin-left: auto;
    margin-right: 1em;
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
    background-image: linear-gradient(to right, var(--ui-border-color) 0.1rem, transparent 0.1rem),
                      linear-gradient(to bottom, var(--ui-border-color) 0.1rem, transparent 0.1rem);
}
#surface[data-background=lines] {
    background-image: linear-gradient(to bottom, var(--ui-border-color) 0.1rem, transparent 0.1rem);
}
#surface[data-background=dots] {
    background-image: radial-gradient(circle, var(--ui-border-color) 0.2rem, transparent 2px);
    background-position: center center;
}
</style>
<div id="tab-bar" class="tool-bar">
  <div id="notebook-name-label-container">
    <label id="notebook-name-label">Untitled Notebook</label>
  </div>
  <button class="material-symbols-outlined" id="new-tab">add</button>
  <select id="restart-kernel" name="restart-kernel" title="Restart Kernel">
      <option value="" hidden selected>Restart Kernel</option>
      <option value="python3">Python</option>
      <option value="dyalog_apl" >APL</option>
      <option value="lambda-calculus">λ Calculus</option>
  </select>
</div>
<div id="container">
  <div id="surface">
    <canvas id="drawing">A canvas drawing context could not be created. This application requires canvas drawing to function.</canvas>
    <div id="ui"></div>
  </div>
</div>
`;

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

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
    constructor(color, lineWidth, points) {
        this.color = color;
        this.lineWidth = lineWidth;
        if (Array.isArray(points)){
            this.points = points;
            this.recomputeBoundingRect();
            
        } else {
            this.points = [points];
            this.boundingRect = circleBoundingRect(points, lineWidth/2);
        }
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
     * @returns number? - The index of the line that was completed, if any.
     */
    completeLine() {
        // Last line could be undefined if it was erased
        if (this.lines.length === 0 || this.lines[this.lines.length - 1] === undefined) {
            return null;
        }
        this.lines[this.lines.length - 1].recomputeBoundingRect();
        return this.lines.length - 1;
    }

    /**
     * Erase lines with vertices intersecting circle centre (x, y), of given radius.
     * @returns Array<Line> - a sparse array of the lines that were erased, at their respective indices.
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
                        erased[i] = this.lines[i];
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
    #action_history;
    #undo_head;

    constructor(id) {
        this.layers = [
            new Layer("code", true),
            new Layer("annotations", false),
        ];
        this.id = id;
        this.name = "";
        // Scroll position of page, updated when switching away from a given page.
        this.scrollLeft = 0;
        this.scrollTop = 0;
        // History of actions on this page that can be undone
        this.#action_history = [];
        // Current position in this.actions (the undo/redo history of this page)
        // Index *after* the last action that has been performed (and not undone)
        this.#undo_head = 0;
    }

    canUndo() {
        return this.#undo_head > 0;
    }

    canRedo() {
        return this.#undo_head < this.#action_history.length;
    }

    // Notify the rest of the application of the undo/redo state of this page
    postUndoState() {
        window.postMessage({
            "setting": "undo",
            "undo": this.canUndo(),
            "redo": this.canRedo(),
        });
    }

    recordAction(action) {
        // Drop the history after the current position
        if (this.canRedo()) {
            this.#action_history = this.#action_history.slice(0, this.#undo_head);
        }

        // TODO: Impose maximum history length if it consumes too much memory (unlikely).

        this.#action_history.push(action);
        this.#undo_head = this.#action_history.length;
        this.postUndoState();
    }

    undo() {
        if (!this.canUndo()) {
            // There is no history to undo.
            return;
        }

        this.#undo_head -= 1;
        this.#action_history[this.#undo_head].undo();
        this.postUndoState();
    }

    redo() {
        if (!this.canRedo()) {
            // There is no history to redo.
            return;
        }

        this.#action_history[this.#undo_head].redo();
        this.#undo_head += 1;
        this.postUndoState();
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
    /** Lines that have been erased in the current stroke of the eraser, if any */
    #erased_lines;

    // Tabs/Pages
    #active_page;
    #tab_bar;
    #new_tab;
    #pages;
    #line_colors;
    #notebook_name;
    #notebook_name_label;
    #notebook_id;
    #notebooks;
    #notebooks_dialog;
    #restart_kernel;

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
        this.#notebook_name = "";
        this.#notebook_name_label = shadowRoot.getElementById("notebook-name-label");
        this.#notebook_id = -1;
        this.#notebooks = null;
        this.#notebooks_dialog = document.getElementById("notebooks-dialog");
        this.#restart_kernel = shadowRoot.getElementById("restart-kernel");

        const saveNotebookDialog = document.getElementById("save-notebook-dialog");

        this.#notebook_name_label.addEventListener("dblclick", () => {
            this.#notebook_name_label.setAttribute("contenteditable", "true");
            this.#notebook_name_label.focus();
        });

        // Disable contenteditable when the label loses focus.
        this.#notebook_name_label.addEventListener("focusout", () => {
            this.#notebook_name_label.removeAttribute("contenteditable");
            this.#notebook_name = this.#notebook_name_label.textContent;
        });

        document.getElementById("new").addEventListener("click", async () => {
            this.#closeAllPages();
            this.#newPage();
            this.#notebook_name = "";
            this.#notebook_name_label.textContent = "Untitled Notebook";
            this.#notebook_id = -1;
            localStorage.setItem("current_notebook_id", -1);

        });

        document.getElementById("save").addEventListener("click", async () => {
            const jsonString = this.serialiseNotebook();
            const notebookFormData = new FormData();
            notebookFormData.append("canvas", jsonString);
        
            if (this.#notebook_name === "") {
                saveNotebookDialog.showModal();
                document.getElementById("save-notebook-name").addEventListener("click", async () => {
                    this.#notebook_name = document.getElementById("notebook-name-input").value;
                    this.#notebook_name_label.textContent = this.#notebook_name;
                    saveNotebookDialog.close();
                    notebookFormData.append("notebook_name", this.#notebook_name);
                    notebookFormData.append("notebook_id", -1);
                    await this.saveNotebook(notebookFormData);
                }, { once: true });  // Ensures event listener runs only once
            } else {
                notebookFormData.append("notebook_name", this.#notebook_name);
                notebookFormData.append("notebook_id", this.#notebook_id);
                await this.saveNotebook(notebookFormData);
            }
        });
        

        // File save button
        document.getElementById("save_file")
            .addEventListener("click", () => {
                // If notebook name hasn't been set, show popup
                if (this.#notebook_name == ""){
                    saveNotebookDialog.showModal();
                    document.getElementById("save-notebook-name").addEventListener("click", async () => {
                        this.#notebook_name = document.getElementById("notebook-name-input").value;
                        this.#notebook_name_label.textContent = this.#notebook_name;
                        saveNotebookDialog.close();
                        this.downloadNotebook(this.#notebook_name)
                    }, { once: true }); 
                }
                else{
                    this.downloadNotebook(this.#notebook_name)
                }
            });

        // Open Saved Notebooks Button
        document.getElementById("open_from_account")
        .addEventListener("click", () => this.#notebooks_dialog.showModal());

        // Open From File Button - opens hidden file input button
        document.getElementById("open_file")
            .addEventListener("click", () => {
                document.getElementById('fileInput').click();
            
            });

        
        // Open file input selection
        document.getElementById('fileInput').addEventListener('change', (event) =>  {
            let file = event.target.files[0]; // Get the selected file
            if (file) {
                const reader = new FileReader();
    
                reader.onload = (event) => {
                    try {
                        this.#notebook_name = file.name.replace(".json", "");
                        this.#notebook_name_label.textContent = this.#notebook_name;
                        this.loadNotebook(event.target.result);
                        localStorage.setItem("current_notebook_id", this.#notebook_id);
                    } catch (error) {
                        console.error("Invalid JSON file:", error);
                        alert("Could not load Notebook: Invalid format.");
                    }
                };
                reader.readAsText(file);
            }
        });

        this.#restart_kernel.addEventListener("change", () => {
            setTimeout(() => {
              this.#restart_kernel.selectedIndex = 0; // Reset to the default "restart kernel"
            }, 100); // Give the form a moment to submit

            const restartFormData = new FormData();
            restartFormData.append("language", this.getAttribute("language"));

            return fetch("/restart_kernel/", {
                method: "POST",
                body: restartFormData,
                credentials: 'include',
                headers: {
                    "X-CSRFTOKEN" : csrftoken
                }
            })
                .then((rsp) => rsp.text())
                .then((message) => {
                    // Show restarted popup
                    const restartedPopup = document.getElementById("restarted-popup");
                    restartedPopup.innerText = message;
                    restartedPopup.className = "show popup";
                    setTimeout(() => { restartedPopup.className = restartedPopup.className.replace("show", ""); }, 2900);
                    
                })
                .catch((error) => console.error("Error:", error));
          });

        this.applyNotebookEventListeners();

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
        this.#erased_lines = [];

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
        var current_notebook_id = localStorage.getItem("current_notebook_id");
        this.#newPage();
        if ((current_notebook_id != null) && (current_notebook_id != -1)){
            const notebookFormData = new FormData();
            notebookFormData.append("notebook_id", current_notebook_id);
            fetch("/get_notebook_data/", {
                method: "POST",
                body: notebookFormData,
                credentials: 'include',
                headers: {
                    "X-CSRFTOKEN" : csrftoken
                }
            })
                .then((rsp) => rsp.json())
                .then((json) => {
                    // Load the returned notebook and display notebook name
                    this.loadNotebook(json["notebook_data"]);
                    this.#notebook_name = json["notebook_name"]
                    this.#notebook_name_label.textContent = json["notebook_name"];
                    this.#notebook_id = json["notebook_id"];
                })
                .catch((error) => console.error("Error:", error));  
        }
    }

    /**
     * Perform the necessary operations to handle a change in the given region of the current page.
     */
    handleRegionUpdate(region) {
        for (const block of this.#ui.querySelectorAll("code-block")) {
            if (block.dataset.page == this.#active_page.id)
                block.notifyUpdate(region);
        }
    }

    serialiseNotebook() {
        this.#active_page.scrollLeft = this.#container.scrollLeft;
        this.#active_page.scrollTop = this.#container.scrollTop;
        var code_block_list = []
        for (const block of this.#ui.querySelectorAll("code-block")) {
            // Convert HTML elements attributes to dict
            var attributes_dict = Array.from(block.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {});
            code_block_list.push(attributes_dict);
        }

        var whiteboard_dict = {"pages": Array.from(this.#pages.entries()), "code_blocks": code_block_list}
        const jsonString =JSON.stringify(whiteboard_dict, null, 2)

        return jsonString
    }

    downloadNotebook(notebook_name){
        const jsonString = this.serialiseNotebook();
        const blob = new Blob([jsonString], { type: "application/json" }); // Create a Blob
        const link = document.createElement("a"); // Create a temporary link
        link.href = URL.createObjectURL(blob); // Create a URL for the Blob
        link.download = notebook_name + ".json"; // Set filename
        document.body.appendChild(link);
        link.click(); // Trigger download
        document.body.removeChild(link); // Cleanup
    }

    async saveNotebook(notebookFormData) {
        try {
            const response = await fetch("/save_notebook/", {
                method: "POST",
                body: notebookFormData,
                credentials: "include",
                headers: { "X-CSRFTOKEN": csrftoken }
            });
            const json = await response.json();

            this.#notebooks = json["notebooks"];
            this.#notebook_id = json["notebook_id"];
    
            // Show saved popup
            const savedPopup = document.getElementById("saved-popup");
            savedPopup.className = "show popup";
            setTimeout(() => { savedPopup.className = savedPopup.className.replace("show", ""); }, 2900);
            
            this.updateNotebookList();
            localStorage.setItem("current_notebook_id", this.#notebook_id);
        } catch (error) {
            console.error("Error:", error);
        }
    }
    
    updateNotebookList() {
        const container = document.getElementById("notebooks-container");
        container.innerHTML = ""; // Clear existing notebooks
    
        this.#notebooks.forEach(notebook => {
            const div = document.createElement("div");
            div.classList.add("notebook-div");
            div.setAttribute("data-notebook-id", notebook.id);
            div.innerHTML = `
                <div> ${notebook.notebook_name} </div>
                <div> ${this.timeSince(notebook.notebook_modified_at)} </div>
                <div>
                    <button class="open-notebook material-symbols-outlined" data-notebook-id="${notebook.id}" title="Open Notebook">draw</button>
                    <button class="delete-notebook material-symbols-outlined" data-notebook-id="${notebook.id}" title="Delete Notebook">delete</button>
                </div>
            `;
            container.appendChild(div);
        });
    
        this.applyNotebookEventListeners();
    }

    applyNotebookEventListeners() {
        // Open notebook button for each notebook
        document.querySelectorAll(".open-notebook").forEach(button => {
            button.addEventListener("click", () => {
                let notebook_id = button.getAttribute("data-notebook-id");
                const notebookFormData = new FormData();
                notebookFormData.append("notebook_id", notebook_id);
                return fetch("/get_notebook_data/", {
                    method: "POST",
                    body: notebookFormData,
                    credentials: 'include',
                    headers: {
                        "X-CSRFTOKEN" : csrftoken
                    }
                })
                    .then((rsp) => rsp.json())
                    .then((json) => {
                        // Load the returned notebook and display notebook name
                        this.loadNotebook(json["notebook_data"]);
                        this.#notebook_name = json["notebook_name"]
                        this.#notebook_name_label.textContent = json["notebook_name"];
                        this.#notebook_id = json["notebook_id"];
                        localStorage.setItem("current_notebook_id", this.#notebook_id);
                        this.#notebooks_dialog.close();
                    })
                    .catch((error) => console.error("Error:", error));
            });  

        });
            
        // Delete notebook button for each notebook
        document.querySelectorAll(".delete-notebook").forEach(button => {
            button.addEventListener("click", () => {
                let notebook_id = button.getAttribute("data-notebook-id");
                const notebookFormData = new FormData();
                notebookFormData.append("notebook_id", notebook_id);

                // Check if selected notebook exists
                var div = document.querySelector(`.notebook-div[data-notebook-id='${notebook_id}']`);
                if (div) {
                    // Remove DOM element
                    div.remove();
                } else {
                    console.log("Div not found with notebookId:", notebook_id);
                }

                // POST request to remove entry in DB
                return fetch("/delete_notebook/", {
                    method: "POST",
                    body: notebookFormData,
                    credentials: 'include',
                    headers: {
                        "X-CSRFTOKEN" : csrftoken
                    }
                })
                    .then((rsp) => console.log(rsp))
                    .catch((error) => console.error("Error:", error));
            })}
        );

    };

    // Load a notebook on the canvas using JSON 
    loadNotebook(notebook_data){
        const notebook = JSON.parse(notebook_data); 
        const pages = notebook["pages"];
        const code_blocks = notebook["code_blocks"];

        // Close all existing tabs
        this.#closeAllPages();

        // Create a new pages map
        this.#pages = new Map();

        var first = true;

        // For each page in saved notebook
        for (const [key, page] of pages) {
            // Create a new page
            var page_id = this.#newPage();
            this.#tab_bar.querySelector(`button[data-id='${page_id}'] > span`).textContent = page.name;
            this.#pages.get(page_id).name = page.name;

            // Store the ID of the first page id
            if (first) {
                var first_page_id = page_id;
                first = false;
            }

            // Load the page's scroll position (the Page object's scroll values will get set when switching to a different page)
            this.#container.scrollTo(page.scrollLeft, page.scrollTop);

            // Reconstruct each line of code layer
            var line_objs = [];
            for (var code_line of page.layers[0].lines){
                let line = new Line(code_line.color, code_line.lineWidth, code_line.points);
                line_objs.push(line)
            }

            this.#pages.get(page_id).layers[0].lines = line_objs

            // Reconstruct each line of annotations layer
            var line_objs = [];
            for (var code_line of page.layers[1].lines){
                let line = new Line(code_line.color, code_line.lineWidth, code_line.points);
                line_objs.push(line)
            }

            this.#pages.get(page_id).layers[1].lines = line_objs
          }

        // Restore each code block
        for (const code_block of code_blocks){
            this.#restoreSelection(code_block)
        }

        // Switch to the first page
        this.#switchToPage(first_page_id);
    }

    connectedCallback() {
        this.#resizeCanvas();
        window.addEventListener("resize",
            () => this.#resizeCanvas());

        window.addEventListener("message",
            (event) => {
                // Handle code block closing events
                if ("deleteCodeBlock" in event.data) {
                    let block = this.#ui.childNodes[event.data.deleteCodeBlock];
                    block.close();
                    this.#active_page.recordAction(new CloseSelectionAction(this, block));
                }

                // Handle region changes
                if ("regionUpdate" in event.data) {
                    this.handleRegionUpdate(event.data.regionUpdate);
                }
            })
    }

    timeSince(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 },
        ];
    
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count > 0) {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
            }
        }
    
        return 'just now';
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

        this.#pages.set(id, new Page(id));

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
        this.#pages.get(id).name = label

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
            () => {
                label_element.removeAttribute("contenteditable");
                this.#pages.get(id).name = label_element.textContent;
            });

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

        // Notify the UI of the selected page's undo/redo state
        this.#active_page.postUndoState();

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

    // Close all existing pages, including the last tab
    #closeAllPages() {
        for (var id of Array.from(this.#pages.keys())){
            id = parseInt(id);

            let page_tab = this.#tab_bar.querySelector(`button[data-id='${id}']`);

            // Delete the page and its associated tab
            this.#pages.delete(id);
            page_tab.remove();

            // Delete associated code blocks
            for (const block of this.#ui.querySelectorAll(`code-block[data-page='${id}']`)) {
                block.remove();
            }
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

                // Only execute and/or record block creation if the block was resized,
                // and so didn't immediately close itself.
                if (this.#last_selection.parentElement !== null) {
                    if (this.dataset.autoExecute === "on") {
                        // Immediately execute a code block if auto-execution is enabled.
                        this.#last_selection.execute();
                    }

                    this.#active_page.recordAction(new CreateSelectionAction(this, this.#last_selection));
                }

                this.#last_selection = null;
            }
            break;
        }
        this.#writing = false;
    }

    addSelection(block) {
        this.#ui.appendChild(block);
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
        this.#last_selection.setAttribute("predicted-text","");
        this.#last_selection.setAttribute("execution-output","");
        this.#last_selection.setAttribute("predictions",{});
        this.#last_selection.setAttribute("restored", false);
        this.addSelection(this.#last_selection);
    }

    #restoreSelection(code_block_attributes) {
        this.#last_selection = document.createElement("code-block");
        this.#last_selection.dataset.x = code_block_attributes["data-x"];
        this.#last_selection.dataset.y = code_block_attributes["data-y"];
        this.#last_selection.dataset.width = code_block_attributes["data-width"];
        this.#last_selection.dataset.height = code_block_attributes["data-height"];
        this.#last_selection.setAttribute("language", code_block_attributes["language"]);
        this.#last_selection.whiteboard = this;
        this.#last_selection.dataset.page = code_block_attributes["data-page"];
        this.#last_selection.setAttribute("state", "executed");
        this.#last_selection.setAttribute("predicted-text",code_block_attributes["predicted-text"]);
        this.#last_selection.setAttribute("execution-output", code_block_attributes["execution-output"]);
        this.#last_selection.setAttribute("predictions",code_block_attributes["predictions"]);
        this.#last_selection.setAttribute("restored", true);
        this.addSelection(this.#last_selection);
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
            let index = this.active_layer.completeLine();

            // Record writing action
            if (index !== null) {
                let line = this.active_layer.lines[index];
                this.#active_page.recordAction(new DrawAction(this.active_layer, index, line));

                if (this.active_layer.is_code) {
                    // Update any blocks the line intersected.
                    this.handleRegionUpdate(line.boundingRect);
                }
            }

            this.#writing = false;
        }

        if (this.#erased_lines.length > 0) {
            this.#active_page.recordAction(new EraseAction(this.active_layer, this.#erased_lines));
            this.#erased_lines = [];
        }
    }

    #erase(x, y) {
        let erased = this.active_layer.erase(x, y, parseInt(this.dataset.eraserWidth)/2);

        // Update any blocks that contained erased lines.
        if (this.active_layer.is_code) {
            for (const i in erased) {
                this.handleRegionUpdate(erased[i].boundingRect);
            }
        }
        for (let i = 0; i < erased.length; i += 1) {
            if (erased.hasOwnProperty(i)) {
                this.#erased_lines[i] = erased[i];
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

    undo() {
        this.#active_page.undo();
        this.render();
    }

    redo() {
        this.#active_page.redo();
        this.render();
    }
}
customElements.define("white-board", Whiteboard);

export { Whiteboard, Layer };
