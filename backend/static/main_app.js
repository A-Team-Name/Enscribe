const whiteboard = {
    container: document.getElementById("whiteboard"),
    background: document.getElementById("whiteboard-background"),
    code: document.getElementById("whiteboard-code"),
    annotations: document.getElementById("whiteboard-annotations"),
    ui: document.getElementById("whiteboard-ui"),
    input: document.getElementById("whiteboard-input"),

    get width() {
        return this.container.width;
    },
    get height() {
        return this.container.height;
    },

    /* Set the width of the whiteboard to value (an integer number of pixels). */
    set width(value) {
        this.background.width = value;
        this.code.width = value;
        this.annotations.width = value;
        this.container.style["width"] = value + "px";
    },

    /* Set the height of the whiteboard to value (an integer number of pixels). */
    set height(value) {
        this.background.height = value;
        this.code.height = value;
        this.annotations.height = value;
        this.container.style["height"] = value + "px";
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

whiteboard.width = whiteboard.height = 10000;
