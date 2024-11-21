import { Whiteboard } from '/static/modules/whiteboard.mjs';
customElements.define("white-board", Whiteboard);

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

/**
 * Add a "change" event listener to input that will set the given attribute of
 * whiteboard to event.target.value.
 */
function linkInputToWhiteboardAttribute(input, attribute) {
    input.addEventListener(
        "change",
        (event) => {
            whiteboard.setAttribute(attribute, event.target.value);
        }
    );
    if ((input.type !== "radio" && input.type !== "checkbox") || input.checked)
        whiteboard.setAttribute(attribute, input.value);
}

linkInputToWhiteboardAttribute(document.getElementById("pen-width"),
                               "data-line-width");
for (const radio of document.querySelectorAll("input[name='pen']")) {
    linkInputToWhiteboardAttribute(radio, "data-pen");
}
for (const radio of document.querySelectorAll("input[name='tool']")) {
    linkInputToWhiteboardAttribute(radio, "data-tool");
}
