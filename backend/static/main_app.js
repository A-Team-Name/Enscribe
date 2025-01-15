import { Whiteboard } from '/static/modules/whiteboard.mjs';
import { sync, setAttribute } from '/static/modules/reactivity.mjs';

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

sync("change", "#pen-width", setAttribute(whiteboard, "data-line-width"));
sync("change", "#eraser-width", setAttribute(whiteboard, "data-eraser-width"));
sync("change", "#show-annotations", setAttribute(whiteboard, "data-show-annotations"));
sync("change", "input[name='pen']", setAttribute(whiteboard, "data-pen"));
sync("change", "input[name='tool']", setAttribute(whiteboard, "data-tool"));
sync("change", "input[name='touch-action']", setAttribute(whiteboard, "data-touch-action"));
