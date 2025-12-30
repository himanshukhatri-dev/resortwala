// @ts-check
const { expect } = require('@playwright/test');

exports.LoginPage = class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Vendor Selectors
        this.vendorInput = page.locator('input[type="text"]').first(); // Email/Mobile
        this.sendOtpBtn = page.getByRole('button', { name: /send otp|login/i });
        this.otpInput = page.locator('input.otp-input');

        // Admin Selectors
        this.adminEmail = page.locator('input[type="email"]');
        this.adminPassword = page.locator('input[type="password"]');
        this.adminLoginBtn = page.getByRole('button', { name: /login/i });
    }

    async gotoVendor() {
        const baseUrl = process.env.VENDOR_URL || 'http://localhost:5173';
        await this.page.goto(baseUrl.includes('login') ? baseUrl : `${baseUrl}/login`);
    }

    async gotoAdmin() {
        const baseUrl = process.env.ADMIN_URL || 'http://localhost:5174';
        await this.page.goto(baseUrl.includes('login') ? baseUrl : `${baseUrl}/login`);
    }

    /**
     * @param {string} identifier
     */
    async loginAsVendor(identifier) {
        await this.vendorInput.fill(identifier);
        await this.sendOtpBtn.click();
    }

    /**
     * @param {string} email
     * @param {string} password
     */
    async loginAsAdmin(email, password) {
        await this.adminEmail.fill(email);
        await this.adminPassword.fill(password);
        await this.adminLoginBtn.click();
    }
};
