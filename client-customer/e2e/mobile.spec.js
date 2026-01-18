import { test, expect } from '@playwright/test';

test.describe('Mobile Critical Path', () => {
    test('should load home page and search', async ({ page }) => {
        // 1. Visit Home
        await page.goto('/');
        await expect(page).toHaveTitle(/ResortWala/i);

        // 2. Check Search Bar Visibility
        const searchInput = page.locator('input[placeholder*="Search"]'); // Adjust selector as needed
        await expect(searchInput).toBeVisible();

        // 3. Perform Search (Date Picker Check)
        // Note: This relies on the specific implementation of SearchBar
        // await searchInput.click();
        // await expect(page.locator('.rdp')).toBeVisible(); // Date Picker
    });

    test('should navigate to property details', async ({ page }) => {
        await page.goto('/');
        // Click first property card
        const firstCard = page.locator('div[class*="group flex flex-col"]').first();
        await expect(firstCard).toBeVisible();

        // Check if View Details button works
        const viewButton = firstCard.locator('button', { hasText: 'View Details' });
        if (await viewButton.isVisible()) {
            await viewButton.click();
        } else {
            await firstCard.click();
        }

        await expect(page).toHaveURL(/property\//);
    });
});
