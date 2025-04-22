/**
 * This is the implementation for our prototype canvas drawing applet.
 * This code is not used in the main application.
 * @module canvas_drawing
 */

/**
 * Generate a random integer in the range [min, max).
 *
 * @param {number} min - minimum random value.
 * @param {number} max - upper bound on random values; exclusive.
 *
 * Adapted from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
 */
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

/**
 * @typedef CharacterDrawingControls
 * @type {object}
 *
 * A bag of references to controls for the character drawing UI.
 *
 * @property {HTMLInputElement} lineWidth
 * @property {HTMLAnchorElement} save - link to download drawn symbol.
 * @property {HTMLInputElement} writtenSymbol - displays current symbol.
 * @property {HTMLButtonElement} nextSymbol - button to save and move to next symbol.
 * @property {HTMLTextAreaElement} symbolSet - the (editable!) set of symbols to draw.
 * @property {HTMLButtonElement} clear - button to clear the canvas.
 */

/**
 * Set up callbacks on canvas and controls for the character drawing UI.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CharacterDrawingControls} controls
 */
const setupCanvasDrawing = (canvas, controls) => {
    let ctx = canvas.getContext("2d");
    let drawing_index = getRandomInt(0, controls.symbolSet.value.length);

    console.log("Drawing index:", drawing_index);

    /** Select the nth next symbol in controls.symbolSet, wrapping if necessary. */
    const getNewLine = () => {
        fetch('/lambda_calculus/')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                controls.symbolSet.value = data.lambda_line;
            })
            .catch(error => console.error('Error fetching new symbol:', error));
    }

    getNewLine();

    ctx.lineWidth = controls.lineWidth.value || 3;
    controls.lineWidth.labels[0].innerHTML = ctx.lineWidth + "px";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /** Remove the href and contents of controls.save. */
    const removeSaveLink = () => {
        controls.save.href = "";
        controls.save.innerHTML = "";
    }

    /** Clear the canvas disable controls.save. */
    const clearCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        removeSaveLink();
    }

    controls.lineWidth.addEventListener(
        "input",
        (event) => {
            ctx.lineWidth = event.target.value;
            for (const label of event.target.labels) {
                label.innerHTML = ctx.lineWidth + "px";
            }
        }
    );

    controls.clear.addEventListener("click", clearCanvas);

    controls.nextSymbol.addEventListener(
        "click",
        (event) => {
            // Save the currently drawn symbol, if any.
            if (controls.save.innerHTML != "") {
                controls.save.click();
                clearCanvas();
                getNewLine();
            } else {
                alert("You haven't drawn anything for the current symbol.");
            }
        }
    )

    controls.previousSymbol.addEventListener(
        "click",
        (event) => {
            clearCanvas();
            getNewLine();
        }
    )

    /** Make controls.save a link to download the current canvas contents. */
    const generateSaveLink = () => {
        // Set up the save link so clicking it downloads the currently drawn character.
        controls.save.href = canvas.toDataURL();
        controls.save.download =
            controls.symbolSet.value.toString()
            + "-" + Date.now() + ".png";
        controls.save.innerHTML = "Save: " + controls.save.download;
    }

    /** Draw a line to (x, y) from the previous location. */
    const drawLine = (x, y) => {
        ctx.lineTo(x, y);
        ctx.stroke();
        generateSaveLink();
    }

    /** Draw a circle, diameter ctx.lineWidth at (x, y). */
    const drawPoint = (x, y) => {
        const circle = new Path2D();
        // Radius must be half ctx.lineWidth so diameter matches lines.
        circle.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
        ctx.fill(circle);
    }

    /**
     * Start a new drawn line at (x, y).
     * Draw a dot at that point, which will appear even if the pointer doesn't move.
     */
    const penDown = (x, y) => {
        drawPoint(x, y);
        ctx.beginPath();
        ctx.moveTo(x, y);
        generateSaveLink();
    }

    /**
     * Create a handler for a mouse event that calls fn(x, y),
     * where (x, y) is the position of the cursor relative to the canvas.
     */
    const mouseAction = (fn) => {
        return (event) => {
            if (event.buttons & 1) {
                fn(event.offsetX, event.offsetY);
            }
        };
    }
    const mousePenDown = mouseAction(penDown);
    const mouseDrawLine = mouseAction(drawLine);
    canvas.addEventListener("mousedown", mousePenDown);
    canvas.addEventListener("mouseenter", mousePenDown);
    canvas.addEventListener("mouseup", mouseDrawLine);
    canvas.addEventListener("mouseleave", mouseDrawLine);
    canvas.addEventListener("mousemove", mouseDrawLine);

    /**
     * Create a handler for a touch event that calls fn(x, y),
     * where (x, y) is the position of a finger relative to the canvas.
     */
    const touchAction = (fn) => {
        return (event) => {
            // Prevent panning when touching canvas.
            event.preventDefault();
            // Don't handle multitouch for now.
            let touch = event.changedTouches[0];
            // Compensate for the offset of the canvas.
            let box = canvas.getBoundingClientRect();
            fn(touch.pageX - box.x, touch.pageY - box.y);
        };
    }

    const touchPenDown = touchAction(penDown);
    const touchDrawLine = touchAction(drawLine);
    canvas.addEventListener("touchstart", touchPenDown);
    canvas.addEventListener("touchmove", touchDrawLine);
    canvas.addEventListener("touchend", touchDrawLine);
    canvas.addEventListener("touchcancel", touchDrawLine);
}
