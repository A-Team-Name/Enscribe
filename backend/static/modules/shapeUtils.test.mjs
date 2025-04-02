import { rectanglesOverlapping } from './shapeUtils.mjs';

test('detects overlapping corners',
    () => {
        expect(rectanglesOverlapping(
            {left: 0, top: 0, right: 10, bottom: 10},
            {left: 9, top: 9, right: 15, bottom: 15})).toBe(true);
    }
)
