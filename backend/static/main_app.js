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
onEvent("change", "input[name='layer']",
        (input) => {
            document.getElementById("line-color").value = whiteboard.lineColor;
        });
{
    // Spaghetti to synchronise color picker UI with theme preference.
    let prefers_dark = window.matchMedia('(prefers-color-scheme: dark)');

    let line_color = document.getElementById("line-color");
    line_color.value = prefers_dark.matches ? "#ffffff" : "#000000";

    // Synchronise live. The user will never observe this behaviour, but I like it.
    prefers_dark
        .addEventListener("change", () => {
            if (line_color.value === "#000000" && prefers_dark.matches) {
                line_color.value = "#ffffff";
            } else if (line_color.value === "#ffffff" && !prefers_dark.matches) {
                line_color.value = "#000000";
            }
        });
}

onEvent("change", "#line-color",
        (input) => {
            whiteboard.lineColor = input.value;
        })
onEvent("change", "input[name='tool']", setAttribute(whiteboard, "data-tool"));
onEvent("change", "input[name='touch-action']", setAttribute(whiteboard, "data-touch-action"));
onEvent("change", "select[name='default-language']",
        (input) => {
            let language = CodeBlock.languages[input.value];
            document.getElementById("language-logo").src = language.logo;
            document.getElementById("language-logo").alt = language.name;
            whiteboard.dataset.defaultLanguage = input.value;
        });
