import { Whiteboard } from '/static/modules/whiteboard.mjs';
customElements.define("white-board", Whiteboard);

const settings = {
    openButton: document.getElementById("open-settings"),
    dialog: document.getElementById("settings-dialog"),
    penWidthInput: document.getElementById("pen-width"),
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

settings.openButton.addEventListener(
    "click",
    () => {
        settings.dialog.showModal();
    }
)
