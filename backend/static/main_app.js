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
}

linkInputToWhiteboardAttribute(document.getElementById("pen-width"),
                               "data-line-width");
