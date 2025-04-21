/**
 * @module shapeUtils
 */

/**
 * A point in a 2D space
 * @typedef {Object} Point
 * @property {float} y - Its vertical coordinate
 * @property {float} x - Its horizontal coordinate
 */

/**
 * A rectangle defined by the coordinates of its sides
 * @typedef {Object} Rectangle
 * @property {float} left - The left side of the rectangle
 * @property {float} right - The right side of the rectangle
 * @property {float} top - The top side of the rectangle
 * @property {float} bottom - The bottom side of the rectangle
 */

/**
 * @param {Rectangle} a
 * @param {Rectangle} b
 * @returns {boolean} whether rectangles a and b are overlapping
 */
export function rectanglesOverlapping(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
}

/**
 * @param {Point} a
 * @param {Rectangle} b
 * @returns {boolean} whether point is in rect
 */
export function pointInRect(point, rect) {
    return !(
        rect.right < point.x
            || rect.left > point.x
            || rect.bottom < point.y
            || rect.top > point.y
    );
}

/**
 * Computes a rectangle that perfectly fits points a and b.
 *
 * @param {Point} a
 * @param {Point} b
 * @returns {Rectangle}
 */
export function rectangleUnion(a, b) {
    return {
        right: Math.max(a.right, b.right),
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        bottom: Math.max(a.bottom, b.bottom),
    };
}

/**
 * @param {Point} centre
 * @param {float} radius
 * @returns {Rectangle} the bounding rectangle of a circle, with the supplied radius and centre
 */
export function circleBoundingRect(centre, radius) {
    return {
        right: centre.x + radius,
        left: centre.x - radius,
        top: centre.y - radius,
        bottom: centre.y + radius,
    };
}

/**
 * @param {Point} a
 * @param {Point} b
 * @returns {float} distance between a and b, squared
 */
export function distance2(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * @param {Point} centre_a
 * @param {float} radius_a
 * @param {Point} centre_b
 * @param {float} radius_b
 * @returns {boolean} whether circles a and b overlap
 */
export function circlesOverlapping(centre_a, radius_a, centre_b, radius_b) {
    return distance2(centre_a, centre_b) <= (radius_a ** 2 + radius_b ** 2);
}


/**
 * Draw a filled circle.
 *
 * @param {CanvasRenderingContext2D} ctx - Context to draw on
 * @param {float} x
 * @param {float} y
 * @param {float} radius
 */
export function fillCircle(ctx, x, y, radius) {
    const circle = new Path2D();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill(circle);
}

/**
 * Draw an unfilled circle.
 *
 * @param {CanvasRenderingContext2D} ctx - Context to draw on
 * @param {float} x
 * @param {float} y
 * @param {float} radius
 */
export function strokeCircle(ctx, x, y, radius) {
    const circle = new Path2D();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke(circle);
}
