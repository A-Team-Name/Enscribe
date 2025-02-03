function rectanglesOverlapping(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
}

/// Computes whether point is in rect
function pointInRect(point, rect) {
    return !(
        rect.right < point.x
            || rect.left > point.x
            || rect.bottom < point.y
            || rect.top > point.y
    );
}

/// Computes a rectangle that perfectly fits a and b
function rectangleUnion(a, b) {
    return {
        right: Math.max(a.right, b.right),
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        bottom: Math.max(a.bottom, b.bottom),
    };
}

/// Compute the bounding rectangle of a circle {y, x}, with the supplied radius
function circleBoundingRect(point, radius) {
    return {
        right: point.x + radius,
        left: point.x - radius,
        top: point.y - radius,
        bottom: point.y + radius,
    };
}

export { rectanglesOverlapping, pointInRect, rectangleUnion, circleBoundingRect };
