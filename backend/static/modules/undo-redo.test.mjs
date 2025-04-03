import { DrawAction, EraseAction } from './undo-redo.mjs';
let layer, manual_layer;

beforeEach(() => {
    layer = {
        lines: ['a', 'b', 'c', 'd'],
    };
    manual_layer = {
        lines: ['a', 'b', 'c', 'd'],
    };
})

test('undo draw', () => {
    let action = new DrawAction(layer, 3, layer[3]);
    expect(layer).toEqual(manual_layer);
    action.undo();
    delete manual_layer.lines[3];
    expect(layer).toEqual(manual_layer);
})

test('redo draw', () => {
    let action = new DrawAction(layer, 4, 'e');
    expect(layer).toEqual(manual_layer);
    manual_layer.lines[4] = 'e';
    action.redo();
    expect(layer).toEqual(manual_layer);

})


test('undo erase', () => {
    let action = new EraseAction(layer, ['a', 'b']);
    expect(layer).toEqual(manual_layer);
    delete layer.lines[0];
    delete layer.lines[1];
    action.undo();
    expect(layer).toEqual(manual_layer);
})

test('redo erase', () => {
    let action = new EraseAction(layer, ['a']);
    expect(layer).toEqual(manual_layer);
    delete manual_layer.lines[0];
    action.redo();
    expect(layer).toEqual(manual_layer);

})
