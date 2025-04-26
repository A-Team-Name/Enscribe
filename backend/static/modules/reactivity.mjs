/**
 * @module reactivity
 */

/**
 * Add an event listener to input that calls callback(input)
 * when it receives the given event, and initially if appropriate.
 * The input can be an iterable collection of elements,
 * or a string that will be passed to document.querySelectorAll
 *
 * @param {string} eventType
 * @param {HTMLInputElement} input
 * @param {boolean} allowImmediate
 */
export const onEvent = (eventType, input, callback, allowImmediate = true) => {
    let setup = (input) => {
        input.addEventListener(eventType, () => callback(input));
        if (allowImmediate && (input.type !== "radio" || input.checked))
            callback(input);
    }
    if (typeof (input) === "string") {
        input = document.querySelectorAll(input);
    }

    if (input?.[Symbol.iterator]) {
        input.forEach(setup);
    } else {
        setup(input);
    }
}

/**
 * Obtain a meaningful value string for input.
 * This will be input.value unless the input is an unchecked checkbox with value "on",
 * in which case it will be "off".
 *
 * @param {HTMLInputElement} input
 * @returns {string}
 */
const inputValue = (input) => {
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

/**
 * Generate a function that sets the given attribute of the given element to inputValue(input),
 * where input is the value passed to the generated function.
 * @param {HTMLElement} element
 * @param {string} attribute
 */
export function setAttribute(element, attribute) {
    return (input) => element.setAttribute(attribute, inputValue(input));
}
