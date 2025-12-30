// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test('Vendor Login Page Loads', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoVendor();

    await expect(page.getByRole('heading', { name: /Vendor Login/i })).toBeVisible();
    await expect(loginPage.vendorInput).toBeVisible();
});

test('Admin Login Page Loads', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoAdmin();

    await expect(page.getByRole('heading', { name: /Admin Login/i })).toBeVisible();
    await expect(loginPage.adminEmail).toBeVisible();
});
