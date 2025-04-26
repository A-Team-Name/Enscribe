/**
 * @module notebook
 */

import * as shapeUtils from './shapeUtils.mjs';
import { Action } from './undo-redo.mjs';

/**
 * @param {string} color - The color to interpret.
 * @returns {string} color unless it is "auto", in which case it returns black under light theme, or white under dark theme.
 */
export function interpretColor(color) {
    if (color === "auto") {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? "#ffffff" : "#000000";
    } else {
        return color;
    }
}

/**
 * Line
 * @class
 * @public
 */
export class Line {
    /**
     * @param {string} color
     * @param {float} lineWidth
     * @param {shapeUtils.Point | shapeUtils.Point[]} points
     */
    constructor(color, lineWidth, points) {
        /** @type {string} */
        this.color = color;
        /** @type {float} */
        this.lineWidth = lineWidth;
        if (Array.isArray(points)) {
            /** @type {shapeUtils.Point[]} */
            this.points = points;
            this.recomputeBoundingRect();
        } else {
            this.points = [points];
            /** @type {shapeUtils.Rectangle} */
            this.boundingRect = shapeUtils.circleBoundingRect(points, lineWidth / 2);
        }
    }

    /**
     * Add point to the end of the line.
     *
     * @param {shapeUtils.Point}
     */
    addPoint(point) {
        this.points.push(point);
    }

    /**
     * Update this.boundingRect to the smallest rectangle containing the whole line,
     * accounting for its thickness.
     */
    recomputeBoundingRect() {
        let lineWidth2 = this.lineWidth / 2;
        this.boundingRect = shapeUtils.circleBoundingRect(this.points[0], lineWidth2);
        for (var i = 1; i < this.points.length; i += 1) {
            this.boundingRect = shapeUtils.rectangleUnion(
                this.boundingRect, shapeUtils.circleBoundingRect(this.points[i], lineWidth2));
        }
    }

    /**
     * Draw this line in the given context, mapped within the given clip rectangle
     * @param {CanvasRenderingContext2D} ctx
     * @param {shapeUtils.Rectangle} clip
     */
    draw(ctx, clip) {
        if (!shapeUtils.rectanglesOverlapping(this.boundingRect, clip)) {
            // The line lies outside the clip rectangle, so don't draw it.
            return;
        }
        if (this.points.length == 1) {
            // Render a single-point "line" as a point.
            ctx.fillStyle = interpretColor(this.color);
            shapeUtils.fillCircle(ctx, this.points[0].x - clip.left, this.points[0].y - clip.top, this.lineWidth / 2);
        } else {
            ctx.strokeStyle = interpretColor(this.color);
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x - clip.left, this.points[0].y - clip.top);
            for (var i = 1; i < this.points.length; i += 1) {
                ctx.lineTo(this.points[i].x - clip.left, this.points[i].y - clip.top);
            }
            ctx.stroke();
        }
    }
}

/**
 * Layer
 */
export class Layer {
    /**
     * @param {string} name
     * @param {boolean} is_code
     */
    constructor(name, is_code) {
        this.name = name;
        /**
         * Contents of the layer
         * @type {Line[]}
         */
        this.lines = [];
        /** @type {boolean} */
        this.is_code = is_code;
    }

    /**
     * Draw the contents of this layer in the given context, bounded to the given clip rectangle
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {shapeUtils.Rectangle} clip
     */
    draw(ctx, clip) {
        // lines is a sparse array, so we must use "in" rather than "of"
        for (const i in this.lines) {
            this.lines[i].draw(ctx, clip);
        }
    }

    /**
     * Add a new line
     *
     * @param {shapeUtils.Point} start - Starting point of the the line.
     * @param {number} lineWidth - Width of the line.
     * @param {string} color - A color hex code, or the string "auto".
     *
     * @returns {Line} A reference to the new line that was created.
     */
    newLine(start, lineWidth, color) {
        let line = new Line(color, lineWidth, start);
        this.lines.push(line);
        return line;
    }

    /**
     * Extend the last line on the Layer to point
     * @param {Point} point
     */
    extendLine(point) {
        this.lines[this.lines.length - 1].addPoint(point);
    }

    /**
     * Mark the last line as complete and return a reference to it.
     * @returns {?number} The index of the line that was completed, if any.
     */
    completeLine() {
        // Last line could be undefined if it was erased
        if (this.lines.length === 0 || this.lines[this.lines.length - 1] === undefined) {
            return null;
        }
        this.lines[this.lines.length - 1].recomputeBoundingRect();
        return this.lines.length - 1;
    }

    /**
     * Erase lines with vertices intersecting circle centre (x, y), of given radius.
     *
     * @param {float} x
     * @param {float} y
     * @param {float} radius
     * @returns {Line[]} a sparse array of the lines that were erased, at their respective indices.
     */
    erase(x, y, radius) {
        let erased = [];
        let eraserPoint = { x, y };
        let eraserBoundingRect = shapeUtils.circleBoundingRect(eraserPoint, radius);
        for (const i in this.lines) {
            // Do bounding box tests as a first pass for efficiency.
            if (shapeUtils.rectanglesOverlapping(eraserBoundingRect, this.lines[i].boundingRect)) {
                let linePointRadius = (this.lines[i].lineWidth / 2);
                for (const point of this.lines[i].points) {
                    if (shapeUtils.circlesOverlapping(eraserPoint, radius, point, linePointRadius)) {
                        erased[i] = this.lines[i];
                        delete this.lines[i];
                        break;
                    }
                }
            }
        }
        return erased;
    }
}

/**
 * A collection of layers, each containing lines.
 *
 * Code blocks are not stored with their associated Page object because they are part of the DOM,
 * whereas the Page is our abstract representation of drawn lines.
 */
export class Page {
    /**
     * History of actions on this page that can be undone.
     * @type {Action[]}
     */
    #action_history;
    /**
     * Current position in this.actions (the undo/redo history of this page)
     * Index *after* the last action that has been performed (and not undone)
     * @type {number}
     */
    #undo_head;

    /** @param {string | number} id */
    constructor(id) {
        /** @type {Layer[]} */
        this.layers = [
            new Layer("code", true),
            new Layer("annotations", false),
        ];
        /** @type {string | number } */
        this.id = id;
        /** @type {string} */
        this.name = "";
        /**
         * Horizontal scroll offset of page, updated when switching away from a given page.
         * @type {number}
         */
        this.scrollLeft = 0;
        /**
         * Vertical scroll offset of page, updated when switching away from a given page.
         * @type {number}
         */
        this.scrollTop = 0;
        this.#action_history = [];
        this.#undo_head = 0;
    }

    /** @returns {boolean} */
    canUndo() {
        return this.#undo_head > 0;
    }

    /** @returns {boolean} */
    canRedo() {
        return this.#undo_head < this.#action_history.length;
    }

    /**
     * Notify the rest of the application of the undo/redo state of this page.
     */
    postUndoState() {
        window.postMessage({
            "setting": "undo",
            "undo": this.canUndo(),
            "redo": this.canRedo(),
        });
    }

    /**
     * Add action to the undo history, dropping the history after the current position.
     *
     * @param {Action} action
     */
    recordAction(action) {
        if (this.canRedo()) {
            this.#action_history = this.#action_history.slice(0, this.#undo_head);
        }

        this.#action_history.push(action);
        this.#undo_head = this.#action_history.length;
        this.postUndoState();
    }

    /** Undo if possible */
    undo() {
        if (!this.canUndo()) {
            // There is no history to undo.
            return;
        }

        this.#undo_head -= 1;
        this.#action_history[this.#undo_head].undo();
        this.postUndoState();
    }

    /** Redo if possible */
    redo() {
        if (!this.canRedo()) {
            // There is no history to redo.
            return;
        }

        this.#action_history[this.#undo_head].redo();
        this.#undo_head += 1;
        this.postUndoState();
    }
}
