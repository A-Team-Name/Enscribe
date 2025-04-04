import { test, expect } from '@playwright/test';

test('draw, undo and redo', async ({ page }) => {
    await page.goto('http://localhost:5000/');
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
