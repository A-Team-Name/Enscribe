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

test('Server Save and Load', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');
    await page.getByRole('button', { name: 'note_add' }).click();
    await expect(page.locator('#notebook-name-label')).toMatchAriaSnapshot(`- text: Untitled Notebook`);
    await page.getByRole('button', { name: 'folder_open' }).click();
    await page.locator('#notebooks-dialog').getByRole('button', { name: 'close' }).click();
    await page.getByText('Untitled Notebook').dblclick();
    await page.getByText('Untitled Notebook').fill('Playwright Notebook');
    await page.getByRole('button', { name: 'Page 1 close' }).dblclick();
    await page.getByText('Page 1').fill('Some Page');
    await page.getByRole('button', { name: 'add', exact: true }).click();
    await page.getByRole('button', { name: 'Page 2 close' }).dblclick();
    await page.getByText('Page 2').fill('Another Page');
    await page.getByRole('button', { name: 'save' }).click();
    await page.getByRole('button', { name: 'note_add' }).click();
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
    await page.locator('css=.notebook-div:has-text("Playwright Notebook")').getByRole('button', { name: 'draw' }).click();
    await expect(page.locator('#tab-bar')).toMatchAriaSnapshot(`
    - text: Playwright Notebook
    - button "Some Page close":
      - button "close"
    - button "Another Page close":
      - button "close"
    - button "add"
    - combobox "Restart Kernel":
      - option "Python"
      - option "APL"
      - option "λ Calculus"
    `);
    await page.getByRole('button', { name: 'save' }).click();
    await page.getByRole('button', { name: 'folder_open' }).click();
    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept().catch(() => { });
    });
    await page.locator('css=.notebook-div:has-text("Playwright Notebook")').getByRole('button', { name: 'delete' }).click();
    await page.locator('#notebooks-dialog').getByRole('button', { name: 'close' }).click();
    await page.getByRole('button', { name: 'note_add' }).click();
    await page.getByRole('button', { name: 'save' }).click();
    await expect(page.getByRole('heading', { name: 'Save Notebook' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Notebook Name:' }).click();
    await page.getByRole('textbox', { name: 'Notebook Name:' }).fill('Playwright Notebook Again');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    // await page.getByRole('button', { name: 'Page 1 close' }).dblclick();
    // await page.getByText('Page 1').fill('Pagerino 1');
    // await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: 'note_add' }).click();
    await page.getByRole('button', { name: 'folder_open' }).click();
    await page.locator('css=.notebook-div:has-text("Playwright Notebook Again")').getByRole('button', { name: 'draw' }).click();
    await page.getByText('Page 1').click();
    await page.getByRole('button', { name: 'folder_open' }).click();
    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept().catch(() => { });
    });
    await page.locator('css=.notebook-div:has-text("Playwright Notebook Again")').getByRole('button', { name: 'delete' }).click();
    await page.locator('#notebooks-dialog').getByRole('button', { name: 'close' }).click();
});
