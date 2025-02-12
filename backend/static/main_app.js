import { Whiteboard } from '/static/modules/whiteboard.mjs';
import { onEvent, setAttribute } from '/static/modules/reactivity.mjs';
import { CodeBlock } from '/static/modules/code-block.mjs';

const settingsDialog = document.getElementById("settings-dialog");
const whiteboard = document.getElementById("whiteboard");

document.getElementById("open-settings")
    .addEventListener("click", () => settingsDialog.showModal());

onEvent("change", "#pen-width",
        (input) => { whiteboard.lineWidth = input.value; });
onEvent("change", "#eraser-width", setAttribute(whiteboard, "data-eraser-width"));
onEvent("change", "#show-annotations", setAttribute(whiteboard, "data-show-annotations"));
onEvent("change", "input[name='layer']", setAttribute(whiteboard, "data-layer"));
onEvent("change", "input[name='tool']", setAttribute(whiteboard, "data-tool"));
onEvent("change", "select[name='default-language']",
        (input) => {
            let language = CodeBlock.languages[input.value];
            document.getElementById("language-logo").src = language.logo;
            document.getElementById("language-logo").alt = language.name;
            whiteboard.dataset.defaultLanguage = input.value;
        });
