## Modules

<dl>
<dt><a href="#module_canvas_drawing">canvas_drawing</a></dt>
<dd><p>This is the implementation for our prototype canvas drawing applet.
This code is not used in the main application.</p>
</dd>
<dt><a href="#module_code-block">code-block</a></dt>
<dd></dd>
<dt><a href="#module_notebook">notebook</a></dt>
<dd></dd>
<dt><a href="#module_radio-panel">radio-panel</a></dt>
<dd></dd>
<dt><a href="#module_reactivity">reactivity</a></dt>
<dd></dd>
<dt><a href="#module_shapeUtils">shapeUtils</a></dt>
<dd></dd>
<dt><a href="#module_undo-redo">undo-redo</a></dt>
<dd></dd>
<dt><a href="#module_whiteboard">whiteboard</a></dt>
<dd></dd>
</dl>

<a name="module_canvas_drawing"></a>

## canvas\_drawing
This is the implementation for our prototype canvas drawing applet.
This code is not used in the main application.


* [canvas_drawing](#module_canvas_drawing)
    * [~getRandomInt(min, max)](#module_canvas_drawing..getRandomInt)
    * [~setupCanvasDrawing(canvas, controls)](#module_canvas_drawing..setupCanvasDrawing)
        * [~getNewLine()](#module_canvas_drawing..setupCanvasDrawing..getNewLine)
        * [~removeSaveLink()](#module_canvas_drawing..setupCanvasDrawing..removeSaveLink)
        * [~clearCanvas()](#module_canvas_drawing..setupCanvasDrawing..clearCanvas)
        * [~generateSaveLink()](#module_canvas_drawing..setupCanvasDrawing..generateSaveLink)
        * [~drawLine()](#module_canvas_drawing..setupCanvasDrawing..drawLine)
        * [~drawPoint()](#module_canvas_drawing..setupCanvasDrawing..drawPoint)
        * [~penDown()](#module_canvas_drawing..setupCanvasDrawing..penDown)
        * [~mouseAction()](#module_canvas_drawing..setupCanvasDrawing..mouseAction)
        * [~touchAction()](#module_canvas_drawing..setupCanvasDrawing..touchAction)
    * [~CharacterDrawingControls](#module_canvas_drawing..CharacterDrawingControls) : <code>object</code>

<a name="module_canvas_drawing..getRandomInt"></a>

### canvas_drawing~getRandomInt(min, max)
Generate a random integer in the range [min, max).

**Kind**: inner method of [<code>canvas\_drawing</code>](#module_canvas_drawing)  

| Param | Type | Description |
| --- | --- | --- |
| min | <code>number</code> | minimum random value. |
| max | <code>number</code> | upper bound on random values; exclusive. Adapted from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values |

<a name="module_canvas_drawing..setupCanvasDrawing"></a>

### canvas_drawing~setupCanvasDrawing(canvas, controls)
Set up callbacks on canvas and controls for the character drawing UI.

**Kind**: inner method of [<code>canvas\_drawing</code>](#module_canvas_drawing)  

| Param | Type |
| --- | --- |
| canvas | <code>HTMLCanvasElement</code> | 
| controls | <code>CharacterDrawingControls</code> | 


* [~setupCanvasDrawing(canvas, controls)](#module_canvas_drawing..setupCanvasDrawing)
    * [~getNewLine()](#module_canvas_drawing..setupCanvasDrawing..getNewLine)
    * [~removeSaveLink()](#module_canvas_drawing..setupCanvasDrawing..removeSaveLink)
    * [~clearCanvas()](#module_canvas_drawing..setupCanvasDrawing..clearCanvas)
    * [~generateSaveLink()](#module_canvas_drawing..setupCanvasDrawing..generateSaveLink)
    * [~drawLine()](#module_canvas_drawing..setupCanvasDrawing..drawLine)
    * [~drawPoint()](#module_canvas_drawing..setupCanvasDrawing..drawPoint)
    * [~penDown()](#module_canvas_drawing..setupCanvasDrawing..penDown)
    * [~mouseAction()](#module_canvas_drawing..setupCanvasDrawing..mouseAction)
    * [~touchAction()](#module_canvas_drawing..setupCanvasDrawing..touchAction)

<a name="module_canvas_drawing..setupCanvasDrawing..getNewLine"></a>

#### setupCanvasDrawing~getNewLine()
Select the nth next symbol in controls.symbolSet, wrapping if necessary.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..removeSaveLink"></a>

#### setupCanvasDrawing~removeSaveLink()
Remove the href and contents of controls.save.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..clearCanvas"></a>

#### setupCanvasDrawing~clearCanvas()
Clear the canvas disable controls.save.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..generateSaveLink"></a>

#### setupCanvasDrawing~generateSaveLink()
Make controls.save a link to download the current canvas contents.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..drawLine"></a>

#### setupCanvasDrawing~drawLine()
Draw a line to (x, y) from the previous location.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..drawPoint"></a>

#### setupCanvasDrawing~drawPoint()
Draw a circle, diameter ctx.lineWidth at (x, y).

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..penDown"></a>

#### setupCanvasDrawing~penDown()
Start a new drawn line at (x, y).
Draw a dot at that point, which will appear even if the pointer doesn't move.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..mouseAction"></a>

#### setupCanvasDrawing~mouseAction()
Create a handler for a mouse event that calls fn(x, y),
where (x, y) is the position of the cursor relative to the canvas.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..setupCanvasDrawing..touchAction"></a>

#### setupCanvasDrawing~touchAction()
Create a handler for a touch event that calls fn(x, y),
where (x, y) is the position of a finger relative to the canvas.

**Kind**: inner method of [<code>setupCanvasDrawing</code>](#module_canvas_drawing..setupCanvasDrawing)  
<a name="module_canvas_drawing..CharacterDrawingControls"></a>

### canvas_drawing~CharacterDrawingControls : <code>object</code>
A bag of references to controls for the character drawing UI.

**Kind**: inner typedef of [<code>canvas\_drawing</code>](#module_canvas_drawing)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| lineWidth | <code>HTMLInputElement</code> |  |
| save | <code>HTMLAnchorElement</code> | link to download drawn symbol. |
| writtenSymbol | <code>HTMLInputElement</code> | displays current symbol. |
| nextSymbol | <code>HTMLButtonElement</code> | button to save and move to next symbol. |
| symbolSet | <code>HTMLTextAreaElement</code> | the (editable!) set of symbols to draw. |
| clear | <code>HTMLButtonElement</code> | button to clear the canvas. |

<a name="module_code-block"></a>

## code-block

* [code-block](#module_code-block)
    * [.CodeBlock](#module_code-block.CodeBlock)
        * [.languages](#module_code-block.CodeBlock+languages)
        * [.execute()](#module_code-block.CodeBlock+execute)
        * [.refreshClickableCharacters()](#module_code-block.CodeBlock+refreshClickableCharacters)
        * [.executeTranscribedCode()](#module_code-block.CodeBlock+executeTranscribedCode)
        * [.resize()](#module_code-block.CodeBlock+resize)
        * [.getBoundingSelectionRect()](#module_code-block.CodeBlock+getBoundingSelectionRect) ⇒
        * [.confirm()](#module_code-block.CodeBlock+confirm)
        * [.notifyUpdate(region)](#module_code-block.CodeBlock+notifyUpdate)
        * [.close()](#module_code-block.CodeBlock+close)
        * [.updateState(oldState, newState)](#module_code-block.CodeBlock+updateState)

<a name="module_code-block.CodeBlock"></a>

### code-block.CodeBlock
A code block element, that can be used to run handwritten code.

**Kind**: static class of [<code>code-block</code>](#module_code-block)  

* [.CodeBlock](#module_code-block.CodeBlock)
    * [.languages](#module_code-block.CodeBlock+languages)
    * [.execute()](#module_code-block.CodeBlock+execute)
    * [.refreshClickableCharacters()](#module_code-block.CodeBlock+refreshClickableCharacters)
    * [.executeTranscribedCode()](#module_code-block.CodeBlock+executeTranscribedCode)
    * [.resize()](#module_code-block.CodeBlock+resize)
    * [.getBoundingSelectionRect()](#module_code-block.CodeBlock+getBoundingSelectionRect) ⇒
    * [.confirm()](#module_code-block.CodeBlock+confirm)
    * [.notifyUpdate(region)](#module_code-block.CodeBlock+notifyUpdate)
    * [.close()](#module_code-block.CodeBlock+close)
    * [.updateState(oldState, newState)](#module_code-block.CodeBlock+updateState)

<a name="module_code-block.CodeBlock+languages"></a>

#### codeBlock.languages
The names and logos of the possible code block languages.

**Kind**: instance property of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+execute"></a>

#### codeBlock.execute()
Execute the code block. Perform handwriting recognition ("transcribe") first if necessary.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+refreshClickableCharacters"></a>

#### codeBlock.refreshClickableCharacters()
Add event listeners to display the corrections UI for each character in the predicted text

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+executeTranscribedCode"></a>

#### codeBlock.executeTranscribedCode()
Pass the current text representation of the block to the backend to execute.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+resize"></a>

#### codeBlock.resize()
Resize the block in response to a pointer movement event.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+getBoundingSelectionRect"></a>

#### codeBlock.getBoundingSelectionRect() ⇒
Get the bounding client rect of the selection (viewport coordinates).
This includes the border of the selection.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
**Returns**: DOMRect - viewport bounds of selection  
<a name="module_code-block.CodeBlock+confirm"></a>

#### codeBlock.confirm()
Lock in the current size of the selection, and display its UI.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+notifyUpdate"></a>

#### codeBlock.notifyUpdate(region)
Notify the code block of an update in the given rectangular region of the whiteboard/page.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  

| Param | Type | Description |
| --- | --- | --- |
| region | <code>shapeUtils.Rectangle</code> | The updated region in whiteboard space |

<a name="module_code-block.CodeBlock+close"></a>

#### codeBlock.close()
Close the code block

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  
<a name="module_code-block.CodeBlock+updateState"></a>

#### codeBlock.updateState(oldState, newState)
Perform a state transition from oldState to newState.

**Kind**: instance method of [<code>CodeBlock</code>](#module_code-block.CodeBlock)  

| Param | Type |
| --- | --- |
| oldState | <code>&quot;resizing&quot;</code> \| <code>&quot;stale&quot;</code> \| <code>&quot;running&quot;</code> \| <code>&quot;executed&quot;</code> | 
| newState | <code>&quot;resizing&quot;</code> \| <code>&quot;stale&quot;</code> \| <code>&quot;running&quot;</code> \| <code>&quot;executed&quot;</code> | 

<a name="module_notebook"></a>

## notebook

* [notebook](#module_notebook)
    * [.Line](#module_notebook.Line)
        * [new exports.Line(color, lineWidth, points)](#new_module_notebook.Line_new)
        * [.color](#module_notebook.Line+color) : <code>string</code>
        * [.lineWidth](#module_notebook.Line+lineWidth) : <code>float</code>
        * [.points](#module_notebook.Line+points) : <code>Array.&lt;shapeUtils.Point&gt;</code>
        * [.boundingRect](#module_notebook.Line+boundingRect) : <code>shapeUtils.Rectangle</code>
        * [.addPoint(point)](#module_notebook.Line+addPoint)
        * [.recomputeBoundingRect()](#module_notebook.Line+recomputeBoundingRect)
        * [.draw(ctx, clip)](#module_notebook.Line+draw)
    * [.Layer](#module_notebook.Layer)
        * [new exports.Layer(name, is_code)](#new_module_notebook.Layer_new)
        * [.lines](#module_notebook.Layer+lines) : <code>Array.&lt;Line&gt;</code>
        * [.is_code](#module_notebook.Layer+is_code) : <code>boolean</code>
        * [.draw(ctx, clip)](#module_notebook.Layer+draw)
        * [.newLine(start, lineWidth, color)](#module_notebook.Layer+newLine) ⇒ <code>Line</code>
        * [.extendLine(point)](#module_notebook.Layer+extendLine)
        * [.completeLine()](#module_notebook.Layer+completeLine) ⇒ <code>number</code>
        * [.erase(x, y, radius)](#module_notebook.Layer+erase) ⇒ <code>Array.&lt;Line&gt;</code>
    * [.Page](#module_notebook.Page)
        * [new exports.Page(id)](#new_module_notebook.Page_new)
        * [.layers](#module_notebook.Page+layers) : <code>Array.&lt;Layer&gt;</code>
        * [.id](#module_notebook.Page+id) : <code>string</code> \| <code>number</code>
        * [.name](#module_notebook.Page+name) : <code>string</code>
        * [.scrollLeft](#module_notebook.Page+scrollLeft) : <code>number</code>
        * [.scrollTop](#module_notebook.Page+scrollTop) : <code>number</code>
        * [.canUndo()](#module_notebook.Page+canUndo) ⇒ <code>boolean</code>
        * [.canRedo()](#module_notebook.Page+canRedo) ⇒ <code>boolean</code>
        * [.postUndoState()](#module_notebook.Page+postUndoState)
        * [.recordAction(action)](#module_notebook.Page+recordAction)
        * [.undo()](#module_notebook.Page+undo)
        * [.redo()](#module_notebook.Page+redo)
    * [.interpretColor(color)](#module_notebook.interpretColor) ⇒ <code>string</code>

<a name="module_notebook.Line"></a>

### notebook.Line
Line

**Kind**: static class of [<code>notebook</code>](#module_notebook)  
**Access**: public  

* [.Line](#module_notebook.Line)
    * [new exports.Line(color, lineWidth, points)](#new_module_notebook.Line_new)
    * [.color](#module_notebook.Line+color) : <code>string</code>
    * [.lineWidth](#module_notebook.Line+lineWidth) : <code>float</code>
    * [.points](#module_notebook.Line+points) : <code>Array.&lt;shapeUtils.Point&gt;</code>
    * [.boundingRect](#module_notebook.Line+boundingRect) : <code>shapeUtils.Rectangle</code>
    * [.addPoint(point)](#module_notebook.Line+addPoint)
    * [.recomputeBoundingRect()](#module_notebook.Line+recomputeBoundingRect)
    * [.draw(ctx, clip)](#module_notebook.Line+draw)

<a name="new_module_notebook.Line_new"></a>

#### new exports.Line(color, lineWidth, points)

| Param | Type |
| --- | --- |
| color | <code>string</code> | 
| lineWidth | <code>float</code> | 
| points | <code>shapeUtils.Point</code> \| <code>Array.&lt;shapeUtils.Point&gt;</code> | 

<a name="module_notebook.Line+color"></a>

#### line.color : <code>string</code>
**Kind**: instance property of [<code>Line</code>](#module_notebook.Line)  
<a name="module_notebook.Line+lineWidth"></a>

#### line.lineWidth : <code>float</code>
**Kind**: instance property of [<code>Line</code>](#module_notebook.Line)  
<a name="module_notebook.Line+points"></a>

#### line.points : <code>Array.&lt;shapeUtils.Point&gt;</code>
**Kind**: instance property of [<code>Line</code>](#module_notebook.Line)  
<a name="module_notebook.Line+boundingRect"></a>

#### line.boundingRect : <code>shapeUtils.Rectangle</code>
**Kind**: instance property of [<code>Line</code>](#module_notebook.Line)  
<a name="module_notebook.Line+addPoint"></a>

#### line.addPoint(point)
Add point to the end of the line.

**Kind**: instance method of [<code>Line</code>](#module_notebook.Line)  

| Param | Type |
| --- | --- |
| point | <code>shapeUtils.Point</code> | 

<a name="module_notebook.Line+recomputeBoundingRect"></a>

#### line.recomputeBoundingRect()
Update this.boundingRect to the smallest rectangle containing the whole line,
accounting for its thickness.

**Kind**: instance method of [<code>Line</code>](#module_notebook.Line)  
<a name="module_notebook.Line+draw"></a>

#### line.draw(ctx, clip)
Draw this line in the given context, mapped within the given clip rectangle

**Kind**: instance method of [<code>Line</code>](#module_notebook.Line)  

| Param | Type |
| --- | --- |
| ctx | <code>CanvasRenderingContext2D</code> | 
| clip | <code>shapeUtils.Rectangle</code> | 

<a name="module_notebook.Layer"></a>

### notebook.Layer
Layer

**Kind**: static class of [<code>notebook</code>](#module_notebook)  

* [.Layer](#module_notebook.Layer)
    * [new exports.Layer(name, is_code)](#new_module_notebook.Layer_new)
    * [.lines](#module_notebook.Layer+lines) : <code>Array.&lt;Line&gt;</code>
    * [.is_code](#module_notebook.Layer+is_code) : <code>boolean</code>
    * [.draw(ctx, clip)](#module_notebook.Layer+draw)
    * [.newLine(start, lineWidth, color)](#module_notebook.Layer+newLine) ⇒ <code>Line</code>
    * [.extendLine(point)](#module_notebook.Layer+extendLine)
    * [.completeLine()](#module_notebook.Layer+completeLine) ⇒ <code>number</code>
    * [.erase(x, y, radius)](#module_notebook.Layer+erase) ⇒ <code>Array.&lt;Line&gt;</code>

<a name="new_module_notebook.Layer_new"></a>

#### new exports.Layer(name, is_code)

| Param | Type |
| --- | --- |
| name | <code>string</code> | 
| is_code | <code>boolean</code> | 

<a name="module_notebook.Layer+lines"></a>

#### layer.lines : <code>Array.&lt;Line&gt;</code>
Contents of the layer

**Kind**: instance property of [<code>Layer</code>](#module_notebook.Layer)  
<a name="module_notebook.Layer+is_code"></a>

#### layer.is\_code : <code>boolean</code>
**Kind**: instance property of [<code>Layer</code>](#module_notebook.Layer)  
<a name="module_notebook.Layer+draw"></a>

#### layer.draw(ctx, clip)
Draw the contents of this layer in the given context, bounded to the given clip rectangle

**Kind**: instance method of [<code>Layer</code>](#module_notebook.Layer)  

| Param | Type |
| --- | --- |
| ctx | <code>CanvasRenderingContext2D</code> | 
| clip | <code>shapeUtils.Rectangle</code> | 

<a name="module_notebook.Layer+newLine"></a>

#### layer.newLine(start, lineWidth, color) ⇒ <code>Line</code>
Add a new line

**Kind**: instance method of [<code>Layer</code>](#module_notebook.Layer)  
**Returns**: <code>Line</code> - A reference to the new line that was created.  

| Param | Type | Description |
| --- | --- | --- |
| start | <code>shapeUtils.Point</code> | Starting point of the the line. |
| lineWidth | <code>number</code> | Width of the line. |
| color | <code>string</code> | A color hex code, or the string "auto". |

<a name="module_notebook.Layer+extendLine"></a>

#### layer.extendLine(point)
Extend the last line on the Layer to point

**Kind**: instance method of [<code>Layer</code>](#module_notebook.Layer)  

| Param | Type |
| --- | --- |
| point | <code>Point</code> | 

<a name="module_notebook.Layer+completeLine"></a>

#### layer.completeLine() ⇒ <code>number</code>
Mark the last line as complete and return a reference to it.

**Kind**: instance method of [<code>Layer</code>](#module_notebook.Layer)  
**Returns**: <code>number</code> - The index of the line that was completed, if any.  
<a name="module_notebook.Layer+erase"></a>

#### layer.erase(x, y, radius) ⇒ <code>Array.&lt;Line&gt;</code>
Erase lines with vertices intersecting circle centre (x, y), of given radius.

**Kind**: instance method of [<code>Layer</code>](#module_notebook.Layer)  
**Returns**: <code>Array.&lt;Line&gt;</code> - a sparse array of the lines that were erased, at their respective indices.  

| Param | Type |
| --- | --- |
| x | <code>float</code> | 
| y | <code>float</code> | 
| radius | <code>float</code> | 

<a name="module_notebook.Page"></a>

### notebook.Page
A collection of layers, each containing lines.

Code blocks are not stored with their associated Page object because they are part of the DOM,
whereas the Page is our abstract representation of drawn lines.

**Kind**: static class of [<code>notebook</code>](#module_notebook)  

* [.Page](#module_notebook.Page)
    * [new exports.Page(id)](#new_module_notebook.Page_new)
    * [.layers](#module_notebook.Page+layers) : <code>Array.&lt;Layer&gt;</code>
    * [.id](#module_notebook.Page+id) : <code>string</code> \| <code>number</code>
    * [.name](#module_notebook.Page+name) : <code>string</code>
    * [.scrollLeft](#module_notebook.Page+scrollLeft) : <code>number</code>
    * [.scrollTop](#module_notebook.Page+scrollTop) : <code>number</code>
    * [.canUndo()](#module_notebook.Page+canUndo) ⇒ <code>boolean</code>
    * [.canRedo()](#module_notebook.Page+canRedo) ⇒ <code>boolean</code>
    * [.postUndoState()](#module_notebook.Page+postUndoState)
    * [.recordAction(action)](#module_notebook.Page+recordAction)
    * [.undo()](#module_notebook.Page+undo)
    * [.redo()](#module_notebook.Page+redo)

<a name="new_module_notebook.Page_new"></a>

#### new exports.Page(id)

| Param | Type |
| --- | --- |
| id | <code>string</code> \| <code>number</code> | 

<a name="module_notebook.Page+layers"></a>

#### page.layers : <code>Array.&lt;Layer&gt;</code>
**Kind**: instance property of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+id"></a>

#### page.id : <code>string</code> \| <code>number</code>
**Kind**: instance property of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+name"></a>

#### page.name : <code>string</code>
**Kind**: instance property of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+scrollLeft"></a>

#### page.scrollLeft : <code>number</code>
Horizontal scroll offset of page, updated when switching away from a given page.

**Kind**: instance property of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+scrollTop"></a>

#### page.scrollTop : <code>number</code>
Vertical scroll offset of page, updated when switching away from a given page.

**Kind**: instance property of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+canUndo"></a>

#### page.canUndo() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+canRedo"></a>

#### page.canRedo() ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+postUndoState"></a>

#### page.postUndoState()
Notify the rest of the application of the undo/redo state of this page.

**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+recordAction"></a>

#### page.recordAction(action)
Add action to the undo history, dropping the history after the current position.

**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  

| Param | Type |
| --- | --- |
| action | <code>Action</code> | 

<a name="module_notebook.Page+undo"></a>

#### page.undo()
Undo if possible

**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.Page+redo"></a>

#### page.redo()
Redo if possible

**Kind**: instance method of [<code>Page</code>](#module_notebook.Page)  
<a name="module_notebook.interpretColor"></a>

### notebook.interpretColor(color) ⇒ <code>string</code>
**Kind**: static method of [<code>notebook</code>](#module_notebook)  
**Returns**: <code>string</code> - color unless it is "auto", in which case it returns black under light theme, or white under dark theme.  

| Param | Type | Description |
| --- | --- | --- |
| color | <code>string</code> | The color to interpret. |

<a name="module_radio-panel"></a>

## radio-panel
<a name="module_radio-panel..RadioPanel"></a>

### radio-panel~RadioPanel
A "radio panel" of buttons.
It behaves similarly to a set of radio inputs, with the UX of buttons.
At most one button is "checked/selected" at a time.
This is indicated by the button having the disabled attribute.

**Kind**: inner class of [<code>radio-panel</code>](#module_radio-panel)  
<a name="module_reactivity"></a>

## reactivity

* [reactivity](#module_reactivity)
    * _static_
        * [.onEvent](#module_reactivity.onEvent)
        * [.setAttribute(element, attribute)](#module_reactivity.setAttribute)
    * _inner_
        * [~inputValue(input)](#module_reactivity..inputValue) ⇒ <code>string</code>

<a name="module_reactivity.onEvent"></a>

### reactivity.onEvent
Add an event listener to input that calls callback(input)
when it receives the given event, and initially if appropriate.
The input can be an iterable collection of elements,
or a string that will be passed to document.querySelectorAll

**Kind**: static constant of [<code>reactivity</code>](#module_reactivity)  

| Param | Type |
| --- | --- |
| eventType | <code>string</code> | 
| input | <code>HTMLInputElement</code> | 
| allowImmediate | <code>boolean</code> | 

<a name="module_reactivity.setAttribute"></a>

### reactivity.setAttribute(element, attribute)
Generate a function that sets the given attribute of the given element to inputValue(input),
where input is the value passed to the generated function.

**Kind**: static method of [<code>reactivity</code>](#module_reactivity)  

| Param | Type |
| --- | --- |
| element | <code>HTMLElement</code> | 
| attribute | <code>string</code> | 

<a name="module_reactivity..inputValue"></a>

### reactivity~inputValue(input) ⇒ <code>string</code>
Obtain a meaningful value string for input.
This will be input.value unless the input is an unchecked checkbox with value "on",
in which case it will be "off".

**Kind**: inner method of [<code>reactivity</code>](#module_reactivity)  

| Param | Type |
| --- | --- |
| input | <code>HTMLInputElement</code> | 

<a name="module_shapeUtils"></a>

## shapeUtils

* [shapeUtils](#module_shapeUtils)
    * _static_
        * [.rectanglesOverlapping(a, b)](#module_shapeUtils.rectanglesOverlapping) ⇒ <code>boolean</code>
        * [.pointInRect(a, b)](#module_shapeUtils.pointInRect) ⇒ <code>boolean</code>
        * [.rectangleUnion(a, b)](#module_shapeUtils.rectangleUnion) ⇒ <code>Rectangle</code>
        * [.circleBoundingRect(centre, radius)](#module_shapeUtils.circleBoundingRect) ⇒ <code>Rectangle</code>
        * [.distance2(a, b)](#module_shapeUtils.distance2) ⇒ <code>float</code>
        * [.circlesOverlapping(centre_a, radius_a, centre_b, radius_b)](#module_shapeUtils.circlesOverlapping) ⇒ <code>boolean</code>
        * [.fillCircle(ctx, x, y, radius)](#module_shapeUtils.fillCircle)
        * [.strokeCircle(ctx, x, y, radius)](#module_shapeUtils.strokeCircle)
    * _inner_
        * [~Point](#module_shapeUtils..Point) : <code>Object</code>
        * [~Rectangle](#module_shapeUtils..Rectangle) : <code>Object</code>

<a name="module_shapeUtils.rectanglesOverlapping"></a>

### shapeUtils.rectanglesOverlapping(a, b) ⇒ <code>boolean</code>
**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  
**Returns**: <code>boolean</code> - whether rectangles a and b are overlapping  

| Param | Type |
| --- | --- |
| a | <code>Rectangle</code> | 
| b | <code>Rectangle</code> | 

<a name="module_shapeUtils.pointInRect"></a>

### shapeUtils.pointInRect(a, b) ⇒ <code>boolean</code>
**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  
**Returns**: <code>boolean</code> - whether point is in rect  

| Param | Type |
| --- | --- |
| a | <code>Point</code> | 
| b | <code>Rectangle</code> | 

<a name="module_shapeUtils.rectangleUnion"></a>

### shapeUtils.rectangleUnion(a, b) ⇒ <code>Rectangle</code>
Computes a rectangle that perfectly fits points a and b.

**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  

| Param | Type |
| --- | --- |
| a | <code>Point</code> | 
| b | <code>Point</code> | 

<a name="module_shapeUtils.circleBoundingRect"></a>

### shapeUtils.circleBoundingRect(centre, radius) ⇒ <code>Rectangle</code>
**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  
**Returns**: <code>Rectangle</code> - the bounding rectangle of a circle, with the supplied radius and centre  

| Param | Type |
| --- | --- |
| centre | <code>Point</code> | 
| radius | <code>float</code> | 

<a name="module_shapeUtils.distance2"></a>

### shapeUtils.distance2(a, b) ⇒ <code>float</code>
**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  
**Returns**: <code>float</code> - distance between a and b, squared  

| Param | Type |
| --- | --- |
| a | <code>Point</code> | 
| b | <code>Point</code> | 

<a name="module_shapeUtils.circlesOverlapping"></a>

### shapeUtils.circlesOverlapping(centre_a, radius_a, centre_b, radius_b) ⇒ <code>boolean</code>
**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  
**Returns**: <code>boolean</code> - whether circles a and b overlap  

| Param | Type |
| --- | --- |
| centre_a | <code>Point</code> | 
| radius_a | <code>float</code> | 
| centre_b | <code>Point</code> | 
| radius_b | <code>float</code> | 

<a name="module_shapeUtils.fillCircle"></a>

### shapeUtils.fillCircle(ctx, x, y, radius)
Draw a filled circle.

**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>CanvasRenderingContext2D</code> | Context to draw on |
| x | <code>float</code> |  |
| y | <code>float</code> |  |
| radius | <code>float</code> |  |

<a name="module_shapeUtils.strokeCircle"></a>

### shapeUtils.strokeCircle(ctx, x, y, radius)
Draw an unfilled circle.

**Kind**: static method of [<code>shapeUtils</code>](#module_shapeUtils)  

| Param | Type | Description |
| --- | --- | --- |
| ctx | <code>CanvasRenderingContext2D</code> | Context to draw on |
| x | <code>float</code> |  |
| y | <code>float</code> |  |
| radius | <code>float</code> |  |

<a name="module_shapeUtils..Point"></a>

### shapeUtils~Point : <code>Object</code>
A point in a 2D space

**Kind**: inner typedef of [<code>shapeUtils</code>](#module_shapeUtils)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| y | <code>float</code> | Its vertical coordinate |
| x | <code>float</code> | Its horizontal coordinate |

<a name="module_shapeUtils..Rectangle"></a>

### shapeUtils~Rectangle : <code>Object</code>
A rectangle defined by the coordinates of its sides

**Kind**: inner typedef of [<code>shapeUtils</code>](#module_shapeUtils)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| left | <code>float</code> | The left side of the rectangle |
| right | <code>float</code> | The right side of the rectangle |
| top | <code>float</code> | The top side of the rectangle |
| bottom | <code>float</code> | The bottom side of the rectangle |

<a name="module_undo-redo"></a>

## undo-redo

* [undo-redo](#module_undo-redo)
    * [.Action](#module_undo-redo.Action)
        * [.postRegionUpdate(region)](#module_undo-redo.Action+postRegionUpdate)
    * [.DrawAction](#module_undo-redo.DrawAction)
    * [.EraseAction](#module_undo-redo.EraseAction)
    * [.CreateSelectionAction](#module_undo-redo.CreateSelectionAction)
    * [.CloseSelectionAction](#module_undo-redo.CloseSelectionAction)

<a name="module_undo-redo.Action"></a>

### undo-redo.Action
A single change to the state of the application, that can be undone or redone.

**Kind**: static class of [<code>undo-redo</code>](#module_undo-redo)  
<a name="module_undo-redo.Action+postRegionUpdate"></a>

#### action.postRegionUpdate(region)
Post a message indicating that a region of the whiteboard has changed.

**Kind**: instance method of [<code>Action</code>](#module_undo-redo.Action)  

| Param | Type |
| --- | --- |
| region | <code>shapeUtils.Rectangle</code> | 

<a name="module_undo-redo.DrawAction"></a>

### undo-redo.DrawAction
The action of drawing a single stroke on a page.

**Kind**: static class of [<code>undo-redo</code>](#module_undo-redo)  
<a name="module_undo-redo.EraseAction"></a>

### undo-redo.EraseAction
The action of erasing some lines.

**Kind**: static class of [<code>undo-redo</code>](#module_undo-redo)  
<a name="module_undo-redo.CreateSelectionAction"></a>

### undo-redo.CreateSelectionAction
The action of creating a code block/selection

**Kind**: static class of [<code>undo-redo</code>](#module_undo-redo)  
<a name="module_undo-redo.CloseSelectionAction"></a>

### undo-redo.CloseSelectionAction
The action of closing a code block/selection

**Kind**: static class of [<code>undo-redo</code>](#module_undo-redo)  
<a name="module_whiteboard"></a>

## whiteboard

* [whiteboard](#module_whiteboard)
    * [.Whiteboard](#module_whiteboard.Whiteboard)
        * [.lineColor](#module_whiteboard.Whiteboard+lineColor)
        * [.handleRegionUpdate(region)](#module_whiteboard.Whiteboard+handleRegionUpdate)
        * [.serialiseNotebook()](#module_whiteboard.Whiteboard+serialiseNotebook) ⇒ <code>string</code>
        * [.downloadNotebook()](#module_whiteboard.Whiteboard+downloadNotebook)
        * [.saveNotebook(notebookFormData)](#module_whiteboard.Whiteboard+saveNotebook)
        * [.updateNotebookList()](#module_whiteboard.Whiteboard+updateNotebookList)
        * [.applyNotebookEventListeners()](#module_whiteboard.Whiteboard+applyNotebookEventListeners)
        * [.loadNotebook(notebook_data)](#module_whiteboard.Whiteboard+loadNotebook)
        * [.timeSince(date)](#module_whiteboard.Whiteboard+timeSince) ⇒ <code>string</code>
        * [.newPage()](#module_whiteboard.Whiteboard+newPage) ⇒ <code>string</code>
        * [.switchToPage(id)](#module_whiteboard.Whiteboard+switchToPage)
        * [.closePage(id)](#module_whiteboard.Whiteboard+closePage)
        * [.closeAllPages()](#module_whiteboard.Whiteboard+closeAllPages)
        * [.eventAction(event)](#module_whiteboard.Whiteboard+eventAction)
        * [.handlePointerDown(event)](#module_whiteboard.Whiteboard+handlePointerDown)
        * [.drawCursor(event)](#module_whiteboard.Whiteboard+drawCursor)
        * [.handlePointerMove(event)](#module_whiteboard.Whiteboard+handlePointerMove)
        * [.handlePointerUp(event)](#module_whiteboard.Whiteboard+handlePointerUp)
        * [.addSelection(block)](#module_whiteboard.Whiteboard+addSelection)
        * [.createSelection(x, y)](#module_whiteboard.Whiteboard+createSelection)
        * [.restoreSelection()](#module_whiteboard.Whiteboard+restoreSelection)
        * [.draw(event)](#module_whiteboard.Whiteboard+draw)
        * [.penDown(x, y)](#module_whiteboard.Whiteboard+penDown)
        * [.penUp()](#module_whiteboard.Whiteboard+penUp)
        * [.erase(x, y)](#module_whiteboard.Whiteboard+erase)
        * [.resizeSurface()](#module_whiteboard.Whiteboard+resizeSurface)
        * [.resizeCanvas()](#module_whiteboard.Whiteboard+resizeCanvas)
        * [.switchToLayer(name)](#module_whiteboard.Whiteboard+switchToLayer)
        * [.clipRegion()](#module_whiteboard.Whiteboard+clipRegion) ⇒ <code>shapeUtils.Rectangle</code>
        * [.extractCode(clip)](#module_whiteboard.Whiteboard+extractCode) ⇒ <code>Blob</code>
        * [.render()](#module_whiteboard.Whiteboard+render)

<a name="module_whiteboard.Whiteboard"></a>

### whiteboard.Whiteboard
The main page surface on which the user can write code.

Handles input, notebook state and rendering handwriting.

**Kind**: static class of [<code>whiteboard</code>](#module_whiteboard)  

* [.Whiteboard](#module_whiteboard.Whiteboard)
    * [.lineColor](#module_whiteboard.Whiteboard+lineColor)
    * [.handleRegionUpdate(region)](#module_whiteboard.Whiteboard+handleRegionUpdate)
    * [.serialiseNotebook()](#module_whiteboard.Whiteboard+serialiseNotebook) ⇒ <code>string</code>
    * [.downloadNotebook()](#module_whiteboard.Whiteboard+downloadNotebook)
    * [.saveNotebook(notebookFormData)](#module_whiteboard.Whiteboard+saveNotebook)
    * [.updateNotebookList()](#module_whiteboard.Whiteboard+updateNotebookList)
    * [.applyNotebookEventListeners()](#module_whiteboard.Whiteboard+applyNotebookEventListeners)
    * [.loadNotebook(notebook_data)](#module_whiteboard.Whiteboard+loadNotebook)
    * [.timeSince(date)](#module_whiteboard.Whiteboard+timeSince) ⇒ <code>string</code>
    * [.newPage()](#module_whiteboard.Whiteboard+newPage) ⇒ <code>string</code>
    * [.switchToPage(id)](#module_whiteboard.Whiteboard+switchToPage)
    * [.closePage(id)](#module_whiteboard.Whiteboard+closePage)
    * [.closeAllPages()](#module_whiteboard.Whiteboard+closeAllPages)
    * [.eventAction(event)](#module_whiteboard.Whiteboard+eventAction)
    * [.handlePointerDown(event)](#module_whiteboard.Whiteboard+handlePointerDown)
    * [.drawCursor(event)](#module_whiteboard.Whiteboard+drawCursor)
    * [.handlePointerMove(event)](#module_whiteboard.Whiteboard+handlePointerMove)
    * [.handlePointerUp(event)](#module_whiteboard.Whiteboard+handlePointerUp)
    * [.addSelection(block)](#module_whiteboard.Whiteboard+addSelection)
    * [.createSelection(x, y)](#module_whiteboard.Whiteboard+createSelection)
    * [.restoreSelection()](#module_whiteboard.Whiteboard+restoreSelection)
    * [.draw(event)](#module_whiteboard.Whiteboard+draw)
    * [.penDown(x, y)](#module_whiteboard.Whiteboard+penDown)
    * [.penUp()](#module_whiteboard.Whiteboard+penUp)
    * [.erase(x, y)](#module_whiteboard.Whiteboard+erase)
    * [.resizeSurface()](#module_whiteboard.Whiteboard+resizeSurface)
    * [.resizeCanvas()](#module_whiteboard.Whiteboard+resizeCanvas)
    * [.switchToLayer(name)](#module_whiteboard.Whiteboard+switchToLayer)
    * [.clipRegion()](#module_whiteboard.Whiteboard+clipRegion) ⇒ <code>shapeUtils.Rectangle</code>
    * [.extractCode(clip)](#module_whiteboard.Whiteboard+extractCode) ⇒ <code>Blob</code>
    * [.render()](#module_whiteboard.Whiteboard+render)

<a name="module_whiteboard.Whiteboard+lineColor"></a>

#### whiteboard.lineColor
The hex color code that should be used to draw lines on the current layer.

**Kind**: instance property of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+handleRegionUpdate"></a>

#### whiteboard.handleRegionUpdate(region)
Perform the necessary operations to handle a change in the given region of the current page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| region | <code>shapeUtils.Rectangle</code> | 

<a name="module_whiteboard.Whiteboard+serialiseNotebook"></a>

#### whiteboard.serialiseNotebook() ⇒ <code>string</code>
**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
**Returns**: <code>string</code> - The current notebook state as serialised JSON.  
<a name="module_whiteboard.Whiteboard+downloadNotebook"></a>

#### whiteboard.downloadNotebook()
Download a local copy of the current notebook.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+saveNotebook"></a>

#### whiteboard.saveNotebook(notebookFormData)
Save the current notebook to the server.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type | Description |
| --- | --- | --- |
| notebookFormData | <code>FormData</code> | Form data containing the notebook, its name and ID. |

<a name="module_whiteboard.Whiteboard+updateNotebookList"></a>

#### whiteboard.updateNotebookList()
Generate an interactive list of the notebooks the current user has saved on the server.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+applyNotebookEventListeners"></a>

#### whiteboard.applyNotebookEventListeners()
Add event listeners to all .open-notebook and .delete-notebook buttons

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+loadNotebook"></a>

#### whiteboard.loadNotebook(notebook_data)
Load the contents of a notebook into the application.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type | Description |
| --- | --- | --- |
| notebook_data | <code>string</code> | The notebook's contents. |

<a name="module_whiteboard.Whiteboard+timeSince"></a>

#### whiteboard.timeSince(date) ⇒ <code>string</code>
**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
**Returns**: <code>string</code> - An approximation of time since date in English.  

| Param | Type |
| --- | --- |
| date | <code>number</code> \| <code>string</code> \| <code>Date</code> | 

<a name="module_whiteboard.Whiteboard+newPage"></a>

#### whiteboard.newPage() ⇒ <code>string</code>
Create a new page, and add a tab for it.
Make it the active page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
**Returns**: <code>string</code> - The id of the new page  
<a name="module_whiteboard.Whiteboard+switchToPage"></a>

#### whiteboard.switchToPage(id)
Switch to the page with the given id, and hide code blocks that aren't on that page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| id | <code>number</code> \| <code>string</code> | 

<a name="module_whiteboard.Whiteboard+closePage"></a>

#### whiteboard.closePage(id)
Remove the page with the given id, and switch to the next tab if there is one, or the last
tab otherwise. Do nothing if this is the only page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| id | <code>number</code> \| <code>string</code> | 

<a name="module_whiteboard.Whiteboard+closeAllPages"></a>

#### whiteboard.closeAllPages()
Close all existing pages

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+eventAction"></a>

#### whiteboard.eventAction(event)
Determine the type of action a pointer event should cause.
Takes this.dataset.tool and event.pointerType into account.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+handlePointerDown"></a>

#### whiteboard.handlePointerDown(event)
Begin handling a pointer tap and/or stroke based on the given pointerdown event.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+drawCursor"></a>

#### whiteboard.drawCursor(event)
Render a cursor on the canvas previewing the size and colour of the pen or eraser,
depending on the active tool, at the location of event.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+handlePointerMove"></a>

#### whiteboard.handlePointerMove(event)
Continue an action based on the pointermove PointerEvent received,
and the state of the whiteboard.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+handlePointerUp"></a>

#### whiteboard.handlePointerUp(event)
Complete an action based on the pointerup PointerEvent received,
and the state of the whiteboard.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+addSelection"></a>

#### whiteboard.addSelection(block)
Add the supplied code block to the notebook.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| block | <code>CodeBlock</code> | 

<a name="module_whiteboard.Whiteboard+createSelection"></a>

#### whiteboard.createSelection(x, y)
Create a new CodeBlock at the given coordinates,
and store a reference to it in #last_selection.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="module_whiteboard.Whiteboard+restoreSelection"></a>

#### whiteboard.restoreSelection()
Re-create a CodeBlock with the given attributes.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+draw"></a>

#### whiteboard.draw(event)
Continue drawing a line using event.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| event | <code>PointerEvent</code> | 

<a name="module_whiteboard.Whiteboard+penDown"></a>

#### whiteboard.penDown(x, y)
Start a new drawn line at (x, y)

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="module_whiteboard.Whiteboard+penUp"></a>

#### whiteboard.penUp()
Complete the current pointer action.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+erase"></a>

#### whiteboard.erase(x, y)
Erase any lines that intersect the eraser when it is placed at (x, y)

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="module_whiteboard.Whiteboard+resizeSurface"></a>

#### whiteboard.resizeSurface()
Resize the drawing surface to match data-width and data-height.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+resizeCanvas"></a>

#### whiteboard.resizeCanvas()
Handle a change in the size of the visible region of the whiteboard.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+switchToLayer"></a>

#### whiteboard.switchToLayer(name)
Switch to the layer with the given name on the current page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 

<a name="module_whiteboard.Whiteboard+clipRegion"></a>

#### whiteboard.clipRegion() ⇒ <code>shapeUtils.Rectangle</code>
Determine the visible region of the whiteboard surface.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
<a name="module_whiteboard.Whiteboard+extractCode"></a>

#### whiteboard.extractCode(clip) ⇒ <code>Blob</code>
Generate an image containing the whiteboard/page contents within clip

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  

| Param | Type |
| --- | --- |
| clip | <code>shapeUtils.Rectangle</code> | 

<a name="module_whiteboard.Whiteboard+render"></a>

#### whiteboard.render()
Render the handwriting on the visible portion of the page.

**Kind**: instance method of [<code>Whiteboard</code>](#module_whiteboard.Whiteboard)  
