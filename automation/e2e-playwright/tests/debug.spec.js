// @ts-check
const { test, expect } = require('@playwright/test');

test('Debug Staging Environment', async ({ page }) => {
    // Go to Vendor Login
    try {
        await page.goto(process.env.VENDOR_URL || 'http://stagingvendor.resortwala.com/login');
        console.log('Vendor URL:', page.url());
        console.log('Vendor Title:', await page.title());
        // console.log('Vendor HTML:', await page.content()); // Too verbose, maybe just check specific elements
        const inputCount = await page.locator('input').count();
        console.log('Vendor Inputs found:', inputCount);
    } catch (e) {
        console.error('Vendor Navigation Failed:', e);
    }

    // Go to Admin Login
    try {
        await page.goto(process.env.ADMIN_URL || 'http://stagingadmin.resortwala.com/login');
        console.log('Admin URL:', page.url());
        console.log('Admin Title:', await page.title());
        const inputCount = await page.locator('input').count();
        console.log('Admin Inputs found:', inputCount);
    } catch (e) {
        console.error('Admin Navigation Failed:', e);
    }
});
