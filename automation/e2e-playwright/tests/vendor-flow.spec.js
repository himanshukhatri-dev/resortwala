// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test.describe('Vendor Critical Flows', () => {

    test('Vendor can login with Demo Account and view Dashboard', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoVendor();

        // Use Demo Account (Bypasses OTP)
        await loginPage.loginAsVendor('vendor@resortwala.com');

        // Verify Dashboard redirect
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.getByText(/Welcome,.*/i)).toBeVisible({ timeout: 10000 });
    });

    const { PropertyFormPage } = require('../pages/PropertyFormPage');

    test('Vendor can complete Add Property flow', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const propPage = new PropertyFormPage(page);

        // Login
        await loginPage.gotoVendor();
        await loginPage.loginAsVendor('vendor@resortwala.com');
        await expect(page).toHaveURL(/.*dashboard/);

        // Add Property Start
        await page.goto(process.env.VENDOR_URL + '/properties/add');
        await expect(page.getByText('Basic Info')).toBeVisible();

        // Step 1
        const propName = `Auto Test Villa ${Date.now()}`;
        await propPage.fillBasicInfo(propName);

        // Step 2 (Amenities) - Verify transition
        await expect(page.getByText('Select Amenities')).toBeVisible();
        await propPage.selectAmenities();

        // Step 3 (Rooms)
        await expect(page.getByText('Room Configuration')).toBeVisible();
        await propPage.configureRooms();

        // Step 4 (Pricing)
        await expect(page.getByText('Pricing')).toBeVisible();
        await propPage.fillPricing();

        // Verify Success
        // Wait for redirect to Properties list or Success Modal
        await expect(page).toHaveURL(/.*properties$/);
        await expect(page.getByText(propName)).toBeVisible();
    });

});
