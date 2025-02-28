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
onEvent("change", "input[name='auto-execute']", setAttribute(whiteboard, "data-auto-execute"));
const selectLanguage = (languageName) => {
    let language = CodeBlock.languages[languageName];
    document.getElementById("default-language").value = languageName;
    document.getElementById("language-logo").src = language.logo;
    document.getElementById("language-logo").alt = language.name;
    whiteboard.dataset.defaultLanguage = languageName;
}
onEvent("change", "select[name='default-language']",
        (input) => selectLanguage(input.value));
window.addEventListener(
    "message",
    (event) => {
        if ("setting" in event.data) {
            switch (event.data.setting) {
            case "defaultLanguage":
                selectLanguage(event.data.value);
            }
        }
    }
)

// Use buttons with the for attribute to click the corresponding radio. Buttons are easier to click
// than labels because the pointer can move before lifting, and a click event will still fire.
onEvent("click", "button[for]",
        (button) => document.getElementById(button.getAttribute("for")).click(),
        // Disable default "immediate application" behaviour of onEvent: wait for real clicks.
        false);
