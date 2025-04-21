/**
 * @module shapeUtils
 */
/**
 * test if two rectangles are overlapping
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
 * Computes whether point is in rect
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
 * Computes a rectangle that perfectly fits a and b
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
 * Compute the bounding rectangle of a circle {y, x}, with the supplied radius
 */
export function circleBoundingRect(point, radius) {
    return {
        right: point.x + radius,
        left: point.x - radius,
        top: point.y - radius,
        bottom: point.y + radius,
    };
}

/**
 * Compute the distance between two points, squared
 * @param {DOMPoint} a
 * @param {DOMPoint} b
 * @returns DOMPoint - distance between a and b
 */
export function distance2(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * @param {DOMPoint} point_a
 * @param {float} radius_a
 * @param {DOMPoint} point_b
 * @param {float} radius_b
 * @returns bool - whether circles a and b overlap
 */
export function circlesOverlapping(point_a, radius_a, point_b, radius_b) {
    return distance2(point_a, point_b) <= (radius_a ** 2 + radius_b ** 2);
}
