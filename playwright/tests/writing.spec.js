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
                    [coords.x + height * 0.25, coords.y + height * 0.75]]);
                await doStroke(page, [
                    [coords.x, coords.y + height],
                    [coords.x + height * 0.5, coords.y + height * 0.5]]);
                coords.x += height * 0.5;
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
                    [[coords.x + height * 0.1, coords.y],
                    [coords.x, coords.y + height * 0.2],
                    [coords.x, coords.y + height * 0.8],
                    [coords.x + height * 0.1, coords.y + height]]);
                coords.x += height * 0.1;
                break;
            case ')':
                await doStroke(page,
                    [[coords.x, coords.y],
                    [coords.x + height * 0.1, coords.y + height * 0.2],
                    [coords.x + height * 0.1, coords.y + height * 0.8],
                    [coords.x, coords.y + height]]);
                coords.x += height * 0.1;
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

test('Code Blocks', async ({ page }) => {
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
});

function lambdaCalculusTest(expr, height, spacing, result = expr) {
    return async ({ page }) => {
        await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');

        // Rely on auto-execute to run code:
        await page.getByRole('button', { name: 'Settings' }).click();
        await expect(page.getByRole('checkbox', { name: 'Automatically execute new' })).toBeChecked();
        await page.locator('#settings-dialog').getByRole('button', { name: 'close' }).click();

        await page.locator('#default-language').selectOption('lambda-calculus');
        let end = await drawLambdaCalculus(page, [300, 300], expr, height, spacing);
        await makeCodeBlock(page, [300 - spacing, 300 - spacing], [end[0] + spacing, end[1] + spacing]);


        // await page.getByRole('button', { name: 'play_arrow' }).click();

        await page.locator('#output-column').getByText('text_fields').click();

        // Space is not significant in lambda calculus, so trim it.
        await expect(page.locator('#text')).toContainText(expr);
        await expect(page.locator('#output')).toContainText(result);
    };
}

test('Lambda Calculus Identity', lambdaCalculusTest("λy.y", 100, 10));
test('Lambda Calculus Small', lambdaCalculusTest("λy.y", 50, 10));
test('Lambda Calculus Interesting Combinator', lambdaCalculusTest("λz.λy.y(zy (y))", 100, 10));
