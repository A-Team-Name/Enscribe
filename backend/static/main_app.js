import { Whiteboard } from '/static/modules/whiteboard.mjs';
import { onEvent, setAttribute } from '/static/modules/reactivity.mjs';

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

onEvent("change", "#pen-width", setAttribute(whiteboard, "data-line-width"));
onEvent("change", "#eraser-width", setAttribute(whiteboard, "data-eraser-width"));
onEvent("change", "#show-annotations", setAttribute(whiteboard, "data-show-annotations"));
onEvent("change", "input[name='pen']", setAttribute(whiteboard, "data-pen"));
onEvent("change", "input[name='tool']", setAttribute(whiteboard, "data-tool"));
onEvent("change", "input[name='touch-action']", setAttribute(whiteboard, "data-touch-action"));
