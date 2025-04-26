import { rectanglesOverlapping } from './shapeUtils.mjs';

test('detects overlapping corners',
    () => {
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: 9, top: 9, right: 15, bottom: 15 })).toBe(true);
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: -1, top: 9, right: 1, bottom: 15 })).toBe(true);
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: 9, top: -1, right: 15, bottom: 1 })).toBe(true);
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: -1, top: -1, right: 1, bottom: 1 })).toBe(true);
    }
)

test('detects contained',
    () => {
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: 5, top: 5, right: 8, bottom: 8 })).toBe(true);
    }
)

test('horizontal separation',
    () => {
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: 11, top: 5, right: 12, bottom: 8 })).toBe(false);
    }
)

test('vertical separation',
    () => {
        expect(rectanglesOverlapping(
            { left: 0, top: 0, right: 10, bottom: 10 },
            { left: 5, top: 11, right: 12, bottom: 12 })).toBe(false);
    }
)
