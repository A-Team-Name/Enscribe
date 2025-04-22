import { test, expect } from '@playwright/test';

test.use({
    storageState: 'auth.json'
});

async function closeTab(page, id) {
    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept().catch(() => { });
    });
    await page.locator(`button[data-id='${id}']`).getByRole('button', { name: 'close' }).click();
}

test('Notebook Toolbar', async ({ page }) => {
    await page.goto('https://enscribe-dev.containers.uwcs.co.uk/');
    await page.getByText('Untitled Notebook').dblclick();
    await page.getByText('Untitled Notebook').fill('Cool Notebook');
    await page.getByRole('button', { name: 'Page 1 close' }).dblclick();
    await page.getByText('Page 1').fill('Weird Page');
    await expect(page.locator('#notebook-name-label')).toContainText('Cool Notebook');
    await expect(page.locator('#tab-bar')).toContainText('Weird Page');
    // Open 2 tabs
    await page.getByRole('button', { name: 'add', exact: true }).click();
    await page.getByRole('button', { name: 'add', exact: true }).click();
    // Tab closing
    await closeTab(page, 2);
    await expect(page.locator('button[data-id]')).toHaveCount(2);
    await closeTab(page, 3);
    await expect(page.locator('button[data-id]')).toHaveCount(1);
    // Last tab won't close
    await closeTab(page, 1);
    await expect(page.locator('button[data-id]')).toHaveCount(1);
    // Click the restart kernel button, although this cannot easily be tested here.
    await page.locator('#restart-kernel').selectOption('lambda-calculus');
});
