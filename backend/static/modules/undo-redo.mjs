/**
 * A single change to the state of the application, that can be undone or redone.
 */
class Action {
    undo() {}
    redo() {}
}

/**
 * The action of drawing a single stroke on a page.
 */
class DrawAction extends Action {
    #layer;
    #line;
    // Index of #line in #layer.lines
    #index;

    constructor(layer, index, line) {
        super();
        this.#layer = layer;
        this.#line = line;
        this.#index = index;
    }

    undo() {
        delete this.#layer.lines[this.#index];
    }

    redo() {
        this.#layer.lines[this.#index] = this.#line;
    }
}

/**
 * The action of erasing some lines.
 */
class EraseAction extends Action {
    #layer;
    #lines;

    constructor(layer, lines) {
        super();
        this.#layer = layer;
        // A sparse array of erased lines, at their original indices in this.#layer
        this.#lines = lines;
    }

    undo() {
        for (let i = 0; i < this.#lines.length; i += 1) {
            if (this.#lines.hasOwnProperty(i)) {
                this.#layer.lines[i] = this.#lines[i];
            }
        }
    }

    redo() {
        for (let i = 0; i < this.#lines.length; i += 1) {
            if (this.#lines[i] != undefined) {
                delete this.#layer.lines[i];
            }
        }
    }
}

/**
 * The action of creating a code block/selection
 */
class CreateSelectionAction extends Action {
    #whiteboard;
    #block;

    constructor(whiteboard, block) {
        super();
        this.#whiteboard = whiteboard;
        this.#block = block;
    }

    undo() {
        this.#block.close();
    }

    redo() {
        this.#whiteboard.addSelection(this.#block);
        this.#block.confirm();
    }
}

/**
 * The action of closing a code block/selection
 */
class CloseSelectionAction extends Action {
    #whiteboard;
    #block;

    constructor(whiteboard, block) {
        super();
        this.#whiteboard = whiteboard;
        this.#block = block;
    }

    undo() {
        this.#whiteboard.addSelection(this.#block);
        this.#block.confirm();
    }

    redo() {
        this.#block.close();
    }
}

export { Action, DrawAction, EraseAction, CreateSelectionAction, CloseSelectionAction };
