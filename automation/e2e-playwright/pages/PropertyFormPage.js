// @ts-check
const { expect } = require('@playwright/test');

exports.PropertyFormPage = class PropertyFormPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        // Step 1: Basic
        this.nameInput = page.locator('input[name="Name"]');
        this.locationInput = page.locator('input[name="Location"]');
        this.mapLinkInput = page.locator('input[name="GoogleMapLink"]');
        this.descInput = page.locator('textarea[name="ShortDescription"]');
        this.nextBtn = page.getByRole('button', { name: /next|continue/i });

        // Step 2: Amenities
        this.parkingCheckbox = page.getByText('Parking');

        // Step 3: Rooms
        this.addBedroomBtn = page.getByRole('button', { name: /add bedroom/i });

        // Step 4: Pricing
        this.priceInput = page.locator('input[name="Price"]'); // Adjust based on exact name (Mon-Thu)
        this.submitBtn = page.getByRole('button', { name: /submit|finish/i });
    }

    /**
   * @param {string} name
   */
    async fillBasicInfo(name) {
        await this.nameInput.fill(name);
        await this.locationInput.fill('Test Location, Lonavala');
        await this.mapLinkInput.fill('https://goo.gl/maps/test');
        await this.descInput.fill('Automated Test Property Description');
        await this.nextBtn.click();
    }

    async selectAmenities() {
        await this.parkingCheckbox.click();
        await this.nextBtn.click();
    }

    async configureRooms() {
        await this.addBedroomBtn.click();
        await this.nextBtn.click();
    }

    async fillPricing() {
        // Assuming Mon-Thu is primary
        await this.priceInput.fill('5000');
        // If there are other mandatory fields, fill them
        await this.submitBtn.click();
    }
};
