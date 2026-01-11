export const getPricing = (property) => {
    // Safely parse values
    const ob = property?.onboarding_data || {};
    const pricing = ob.pricing || {};
    const adminPricing = property?.admin_pricing || {};

    // Prioritize structured data (admin_pricing or onboarding) over legacy flat columns (Price/PerCost)
    // for the Market Price (Vendor Ask).
    const originalPrice = parseFloat(
        adminPricing.mon_thu?.villa?.current ||
        pricing.weekday ||
        pricing.mon_thu ||
        pricing.base_price ||
        property?.Price ||
        property?.price ||
        property?.PerCost ||
        property?.per_cost ||
        0
    );
    // Selling Price (Customer Rate)
    const rwRate = parseFloat(
        property?.ResortWalaRate ||
        property?.resort_wala_rate ||
        property?.price_mon_thu ||
        property?.Price ||
        0
    );
    const dealPrice = parseFloat(property?.DealPrice || property?.deal_price || 0);

    let sellingPrice = originalPrice;
    let marketPrice = originalPrice; // Removed 1.25 fallback to show transparent pricing

    // Logic: If RW Rate exists and is lower than Price, use Price as Market and RW as Selling
    if (rwRate > 0) {
        sellingPrice = rwRate;
        marketPrice = (originalPrice > rwRate) ? originalPrice : rwRate;
    }
    // Logic: If Deal Price exists and is lower than Price, use Deal Price (if RW rate absent or logic dictates)
    else if (dealPrice > 0 && dealPrice < originalPrice) {
        sellingPrice = dealPrice;
        marketPrice = originalPrice;
    }

    // Ensure logic holds: Market >= Selling
    if (marketPrice < sellingPrice) {
        marketPrice = sellingPrice;
    }

    const savings = marketPrice - sellingPrice;
    const percentage = Math.round((savings / marketPrice) * 100);

    return {
        sellingPrice,
        marketPrice,
        savings,
        percentage,
        isFallback: marketPrice === sellingPrice // Flag to know if it's "real" or "implied"
    };
};
