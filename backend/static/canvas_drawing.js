// Adapted from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

const setupCanvasDrawing = (canvas, controls) => {
    let ctx = canvas.getContext("2d");
    let drawing_index = controls.symbolSet.value.length;

    // Advance to the next symbol in the symbol set.
    const nextSymbol = () => {
	let symbols = controls.symbolSet.value;
	drawing_index = drawing_index % symbols.length;
	let chosen_symbol = symbols.substring(drawing_index, drawing_index + 1);
	drawing_index = (drawing_index + 1) % symbols.length;
	controls.writtenSymbol.value = chosen_symbol;
    }

    nextSymbol();

    ctx.lineWidth = controls.lineWidth.value || 3;

    const removeSaveLink = () => {
	controls.save.href = "";
	controls.save.innerHTML = "";
    }

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
    controls.save.addEventListener("click",
				   (event) => {
				       // Clear the canvas, delayed until after save.
				       setTimeout(clearCanvas, 200);
				       // Remove the save link, so we don't accidentally save over
				       // a drawing by clicking multiple times.
				       removeSaveLink();
				   })

    controls.nextSymbol.addEventListener(
	"click",
	(event) => {
	    // Save the currently drawn symbol, if any.
	    if (controls.save.innerHTML != "") {
		controls.save.click();
	    }
	    clearCanvas();
	    nextSymbol();
	}
    )

    const generateSaveLink = (event) => {
	// Set up the save link so clicking it downloads the currently drawn character.
	controls.save.href = canvas.toDataURL();
	controls.save.download =
	    "u"
	    + controls.writtenSymbol.value.codePointAt(0).toString(16)
	    + "-" + Date.now() + ".png";
	controls.save.innerHTML = "Save: " + controls.save.download;
    }

    const drawLine = (event) => {
	if (event.buttons & 1) {
	    ctx.lineTo(event.offsetX, event.offsetY);
	    ctx.stroke();
	    drawPoint(event);
	    generateSaveLink();
	}
    }

    const drawPoint = (event) => {
	const circle = new Path2D();
	// Radius must be half ctx.lineWidth so diameter matches lines.
	circle.arc(event.offsetX, event.offsetY, ctx.lineWidth / 2, 0, 2 * Math.PI);
	ctx.fill(circle);
    }

    const penDown = (event) => {
	ctx.beginPath();
	ctx.moveTo(event.offsetX, event.offsetY);
    }

    canvas.addEventListener("mousedown", drawPoint);
    canvas.addEventListener("mousedown", penDown);
    canvas.addEventListener("mousedown", generateSaveLink);

    canvas.addEventListener("mouseenter", penDown);

    canvas.addEventListener("mouseup", drawLine);

    canvas.addEventListener("mouseleave", drawLine);

    canvas.addEventListener("mousemove", drawLine);
}
