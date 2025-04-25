import { test, expect, Page } from '@playwright/test';

test.use({
    storageState: 'auth.json'
});

async function doStroke(page, points) {
    await page.mouse.move(points[0][0], points[0][1]);
    await page.mouse.down();
    for (let [x, y] of points) {
        await page.mouse.move(x, y);
    }
    await page.mouse.up();
}

async function doPoint(page, x, y) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    // A point doesn't get generated if we just do .click() or .down();.up(), for some reason
    await page.mouse.move(x, y);
    await page.mouse.up();
}

/**
 * Draw a lambda calculus string
 *
 * @param {Page} page
 * @param {number[]} start - Starting coordinates [y, x]
 * @param {string} expr - A lambda calculus string to draw
 * @param {number} spacing - Gap between characters
 * @param {number} height - Line height, of λ.
 */
async function drawLambdaCalculus(page, start, expr, height, spacing) {
    let draw_button = page.getByRole('button', { name: 'edit' });
    // the radio buttons are disabled if checked; clicking a disabled button blocks Playwright
    if (!await draw_button.isDisabled()) {
        await draw_button.click();
    }
    await page.mouse.up();

    let coords = { x: start[0], y: start[1] };

    for (let tok of expr) {
        switch (tok) {
            case 'λ':
                await doStroke(page,
                    [[coords.x, coords.y],
                    [coords.x + height * 0.5, coords.y + height]]);
                await doStroke(page,
                    [[coords.x, coords.y + height],
                    [coords.x + height * 0.25, coords.y + height * 0.5]]);
                coords.x += height * 0.5;
                break;
            case 'x':
                await doStroke(page, [
                    [coords.x, coords.y + height * 0.5],
                    [coords.x + height * 0.5, coords.y + height]]);
                await doStroke(page, [
                    [coords.x, coords.y + height],
                    [coords.x + height * 0.5, coords.y + height * 0.5]]);
                coords.x += height * 0.5;
                break;
            case 'y':
                await doStroke(page, [
                    [coords.x, coords.y + height * 0.5],
                    [coords.x + height * 0.2, coords.y + height * 0.75]]);
                await doStroke(page, [
                    [coords.x, coords.y + height],
                    [coords.x + height * 0.4, coords.y + height * 0.5]]);
                coords.x += height * 0.4;
                break;
            case 'z':
                await doStroke(page, [
                    [coords.x, coords.y + height * 0.5],
                    [coords.x + height * 0.5, coords.y + height * 0.5]]);
                await doStroke(page, [
                    [coords.x + height * 0.5, coords.y + height * 0.5],
                    [coords.x, coords.y + height]]);
                await doStroke(page, [
                    [coords.x, coords.y + height],
                    [coords.x + height * 0.5, coords.y + height]]);
                coords.x += height * 0.5;
                break;
            case '.':
                await doPoint(page, coords.x, coords.y + height);
                coords.x += height * 0.1;
                break;
            case '(':
                await doStroke(page,
                    [[coords.x + height * 0.15, coords.y],
                    [coords.x, coords.y + height * 0.2],
                    [coords.x, coords.y + height * 0.8],
                    [coords.x + height * 0.15, coords.y + height]]);
                coords.x += height * 0.15;
                break;
            case ')':
                await doStroke(page,
                    [[coords.x, coords.y],
                    [coords.x + height * 0.15, coords.y + height * 0.2],
                    [coords.x + height * 0.15, coords.y + height * 0.8],
                    [coords.x, coords.y + height]]);
                coords.x += height * 0.15;
                break;
            case ' ':
                coords.x += height * 0.5;
                break;
        }
        coords.x += spacing;
    }

    return [coords.x, coords.y + height];
}

async function makeCodeBlock(page, start, end) {
    await page.getByRole('button', { name: 'select' }).click();
    await doStroke(page, [start, end]);
}

test('draw, undo and redo', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk');
    await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
    - button "undo" [disabled]
    - button "redo" [disabled]
    `);
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.move(300, 400);
    await page.mouse.up();
    await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
    - button "undo"
    - button "redo" [disabled]
    `);
    await page.getByRole('button', { name: 'undo' }).click();
    await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
    - button "undo" [disabled]
    - button "redo"
    `);
});

test('Code Block Creation and Closing', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');
    await page.getByRole('button', { name: 'select' }).click();
    // Click: Code block removes itself
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('code-block')).toHaveCount(0);

    // Drag: Code block persists
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.move(800, 600);
    await page.mouse.up();
    await expect(page.locator('code-block')).toHaveCount(1);

    // Closing
    await page.locator('#close').click();
    await expect(page.locator('code-block')).toHaveCount(0);

    // Code block undo actions
    await page.getByRole('button', { name: 'undo' }).click();
    await expect(page.locator('code-block')).toHaveCount(1);
    await page.getByRole('button', { name: 'undo' }).click();
    await expect(page.locator('code-block')).toHaveCount(0);

    await expect(page.getByText('undo redo')).toMatchAriaSnapshot(`
    - button "undo" [disabled]
    - button "redo"
    `);

    // Code block redo actions
    await page.getByRole('button', { name: 'redo' }).click();
    await expect(page.locator('code-block')).toHaveCount(1);
    await page.getByRole('button', { name: 'redo' }).click();
    await expect(page.locator('code-block')).toHaveCount(0);

    await expect(page.getByText('undo redo')).toMatchAriaSnapshot(`
    - button "undo"
    - button "redo" [disabled]
    `);
});

test('Code Block Staling', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');

    // Require manual code block execution to make state change testing easier
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('checkbox', { name: 'Automatically execute new' }).uncheck();
    await page.locator('#settings-dialog').getByRole('button', { name: 'close' }).click();

    const expect_stale_and_refresh = async () => {
        await expect(page.locator("code-block[state='stale']")).toHaveCount(1);
        await page.getByRole('button', { name: 'play_arrow' }).click();
        await expect(page.locator("code-block[state='executed']")).toHaveCount(1);
    }

    // Code block is initially stale
    await makeCodeBlock(page, [300, 300], [800, 600]);
    await expect_stale_and_refresh();

    // Drawing and erasing cause staling
    await page.getByRole('button', { name: 'edit' }).click();
    await doStroke(page, [[200, 200], [400, 500]]);

    // Erase the line without the eraser directly intersecting the code block
    await page.getByRole('button', { name: 'ink_eraser' }).click();
    await doStroke(page, [[200, 200], [250, 250]]);
    await expect_stale_and_refresh();

    // Undoing erase and draw also cause staling
    await page.getByRole('button', { name: 'undo' }).click();
    await expect_stale_and_refresh();
    await page.getByRole('button', { name: 'undo' }).click();
    await expect_stale_and_refresh();

    // Redoing erase and draw also cause staling
    await page.getByRole('button', { name: 'redo' }).click();
    await expect_stale_and_refresh();
    await page.getByRole('button', { name: 'redo' }).click();
    await expect_stale_and_refresh();
});

function lambdaCalculusTest(expr, height, spacing, { prelude = async page => { }, result = expr } = {}) {
    return async ({ page }) => {
        await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');

        await prelude(page);

        // Rely on auto-execute to run code:
        await page.getByRole('button', { name: 'Settings' }).click();
        await expect(page.getByRole('checkbox', { name: 'Automatically execute new' })).toBeChecked();
        await page.locator('#settings-dialog').getByRole('button', { name: 'close' }).click();

        await page.locator('#default-language').selectOption('lambda-calculus');
        let end = await drawLambdaCalculus(page, [300, 300], expr, height, spacing);
        await makeCodeBlock(page, [300 - spacing, 300 - spacing], [end[0] + spacing, end[1] + spacing]);

        await page.locator('#output-column').getByText('text_fields').click();

        await expect(page.locator('#text')).toContainText(expr);

        // Wait for execution to finish
        await expect(page.getByRole('button', { name: 'play_arrow' })).toBeEnabled();

        await expect(page.locator('#output')).toContainText(result);
    };
}

test('Lambda Calculus Identity', lambdaCalculusTest("λx.x", 100, 10));
test('Lambda Calculus Small', lambdaCalculusTest("λy.y", 50, 10));
test('Lambda Calculus Very Small', lambdaCalculusTest("λy.y", 25, 10));
test('Lambda Calculus Thick',
    lambdaCalculusTest("λz.λy.y(zz)", 150, 20,
        { prelude: async page => await page.getByRole('slider', { name: 'Pen Size' }).fill('18') }));
test('Lambda Calculus Interesting Combinator', lambdaCalculusTest("λz.λy.y(zy (y))", 100, 10));
