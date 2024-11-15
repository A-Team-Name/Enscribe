const whiteboard = {
    background: document.getElementById("whiteboard-background"),
    code: document.getElementById("whiteboard-code"),
    annotations: document.getElementById("whiteboard-annotations"),
    ui: document.getElementById("whiteboard-ui"),
    input: document.getElementById("whiteboard-input"),

    get width() {
        return this.background.width;
    },
    get height() {
        return this.background.height;
    },

    /* Set the width of the whiteboard to value (an integer number of pixels). */
    set width(value) {
        this.background.width = value;
        this.code.width = value;
        this.annotations.width = value;
        this.ui.style["width"] = value + "px";
        this.input.style["width"] = value + "px;"
    },

    /* Set the height of the whiteboard to value (an integer number of pixels). */
    set height(value) {
        this.background.height = value;
        this.code.height = value;
        this.annotations.height = value;
        this.ui.style["height"] = value + "px";
        this.input.style["height"] = value + "px;"
    },
};

const settings = {
    get penWidth() {
        return parseInt(this.penWidthInput.value);
    },
    get interactionMode() {
        return document.querySelector("input[name=interaction-mode]:checked").value;
    },
    get penMode() {
        return document.querySelector("input[name=pen-mode]:checked").value;
    },
};

whiteboard.input
    .addEventListener(
        "mousedown",
        (event) => {
            console.log("Mouse down at " + event.offsetX + " " +  event.offsetY);
        }
    );
