/**
 * Add a "change" event listener to input that calls callback(value) with the new value of the input
 * when it changes, and with the initial value.
 */
function setupReactiveInput(input, callback) {
    input.addEventListener(
        "change",
        (event) => {
            callback(event.target.value);
        }
    );
    if ((input.type !== "radio" && input.type !== "checkbox") || input.checked)
        callback(input.value);
}

export { setupReactiveInput };
