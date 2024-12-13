import { Whiteboard } from '/static/modules/whiteboard.mjs';

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
linkInputToWhiteboardAttribute(document.getElementById("eraser-width"),
                               "data-eraser-width");
document.getElementById("show-annotations")
    .addEventListener("change",
                      (event) => {
                          whiteboard.setAttribute("data-show-annotations",
                                                  event.target.checked ? "on" : "off");
                      })
for (const radio of document.querySelectorAll("input[name='pen']")) {
    linkInputToWhiteboardAttribute(radio, "data-pen");
}
for (const radio of document.querySelectorAll("input[name='tool']")) {
    linkInputToWhiteboardAttribute(radio, "data-tool");
}

for (const option of document.querySelectorAll("input[name='touch-action']")) {
    linkInputToWhiteboardAttribute(option, "data-touch-action");
}
