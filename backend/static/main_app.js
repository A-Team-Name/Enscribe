import { Whiteboard } from '/static/modules/whiteboard.mjs';
import { setupReactiveInput } from '/static/modules/reactivity.mjs';

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

setupReactiveInput(document.getElementById("pen-width"),
                   (value) => whiteboard.setAttribute("data-line-width", value));
setupReactiveInput(document.getElementById("eraser-width"),
                   (value) => whiteboard.setAttribute("data-eraser-width", value));
document.getElementById("show-annotations")
    .addEventListener("change",
                      (event) => {
                          whiteboard.setAttribute("data-show-annotations",
                                                  event.target.checked ? "on" : "off");
                      })
for (const radio of document.querySelectorAll("input[name='pen']")) {
    setupReactiveInput(radio, (value) => whiteboard.setAttribute("data-pen", value));
}
for (const radio of document.querySelectorAll("input[name='tool']")) {
    setupReactiveInput(radio, (value) => whiteboard.setAttribute("data-tool", value));
}

for (const option of document.querySelectorAll("input[name='touch-action']")) {
    setupReactiveInput(option, (value) => whiteboard.setAttribute("data-touch-action", value));
}
