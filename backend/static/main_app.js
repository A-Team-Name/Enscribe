import { Whiteboard } from '/static/modules/whiteboard.mjs';
import { onEvent, setAttribute } from '/static/modules/reactivity.mjs';

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

onEvent("change", "#pen-width",
        (input) => { whiteboard.active_layer.lineWidth = input.value; });
onEvent("change", "#eraser-width", setAttribute(whiteboard, "data-eraser-width"));
onEvent("change", "#show-annotations", setAttribute(whiteboard, "data-show-annotations"));
onEvent("change", "input[name='layer']", setAttribute(whiteboard, "data-layer"));
onEvent("change", "input[name='layer']",
        () => {
            document.getElementById("pen-width").value = whiteboard.active_layer.lineWidth;
        });
onEvent("change", "input[name='tool']", setAttribute(whiteboard, "data-tool"));
