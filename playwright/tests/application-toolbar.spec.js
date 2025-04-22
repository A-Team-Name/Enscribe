import { test, expect } from '@playwright/test';

test.use({
    storageState: 'auth.json'
});

test('Application Toolbar', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');
    await page.getByRole('button', { name: 'add', exact: true }).click();
    await page.locator('#ui').click();
    await page.getByRole('slider', { name: 'Pen Size' }).fill('20');
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.getByRole('button', { name: 'Page 1 close' }).click();
    await page.locator('#ui').click();
    await page.getByRole('button', { name: 'Page 2 close' }).click();
    await page.locator('#ui').click();
    await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
    - button "undo"
    - button "redo" [disabled]
    `);
    await expect(page.locator('#tab-bar')).toMatchAriaSnapshot(`
    - text: Untitled Notebook
    - button "Page 1 close":
      - button "close"
    - button "Page 2 close":
      - button "close"
    - button "add"
    - combobox "Restart Kernel":
      - option "Python"
      - option "APL"
      - option "λ Calculus"
    `);
    await page.getByRole('button', { name: 'note_add' }).click();
    await expect(page.getByRole('banner')).toMatchAriaSnapshot(`
    - button "undo" [disabled]
    - button "redo" [disabled]
    `);
    await expect(page.locator('#tab-bar')).toMatchAriaSnapshot(`
    - text: Untitled Notebook
    - button "Page 1 close":
      - button "close"
    - button "add"
    - combobox "Restart Kernel":
      - option "Python"
      - option "APL"
      - option "λ Calculus"
    `);
    await page.getByRole('button', { name: 'folder_open' }).click();
    await expect(page.getByRole('heading', { name: 'Notebooks' })).toBeVisible();
    await page.locator('#notebooks-dialog').getByRole('button', { name: 'close' }).click();
    await expect(page.getByRole('heading', { name: 'Notebooks' })).not.toBeVisible();
    await page.getByRole('button', { name: 'Help' }).click();
    await page.getByText('Help close Writing & Erasing').click();
    await expect(page.getByRole('heading', { name: 'Help' })).toBeVisible();
    await page.locator('#help-dialog').getByRole('button', { name: 'close' }).click();
    await expect(page.getByRole('heading', { name: 'Help' })).not.toBeVisible();
    await page.locator('#ui').click();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.locator('#settings-dialog').getByRole('button', { name: 'close' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
});
