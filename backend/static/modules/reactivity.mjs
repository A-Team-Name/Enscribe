/**
 * Add an event listener to input that calls callback(input)
 * when it receives the given event, and initially if appropriate.
 * The input can be an iterable collection of elements,
 * or a string that will be passed to document.querySelectorAll
 */
let onEvent = (eventType, input, callback, allowImmediate = true) => {
    let setup = (input) => {
        input.addEventListener(eventType, () => callback(input));
        if (allowImmediate && (input.type !== "radio" || input.checked))
            callback(input);
    }
    if (typeof(input) === "string") {
        input = document.querySelectorAll(input);
    }

    if (input?.[Symbol.iterator]) {
        input.forEach(setup);
    } else {
        setup(input);
    }
}

let inputValue = (input) => {
    switch (input.type) {
    case "checkbox":
        if (!input.checked && input.value === "on") {
            return "off"
        } else {
            return input.value
        }
    default:
        return input.value
    }
}

function setAttribute(element, attribute) {
    return (input) => element.setAttribute(attribute, inputValue(input));
}

export { onEvent, setAttribute };
