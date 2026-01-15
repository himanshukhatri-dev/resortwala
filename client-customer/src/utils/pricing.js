export const getPricing = (property) => {
    // Safely parse values
    const ob = property?.onboarding_data || {};
    const pricing = ob.pricing || {};
    const adminPricing = property?.admin_pricing || {};

    // 1. Determine Market Price (Vendor Ask / Base Rate) - Crossed Out
    let marketPrice = parseFloat(
        adminPricing.mon_thu?.villa?.current ||
        pricing.weekday ||
        pricing.mon_thu ||
        pricing.base_price ||
        property?.Price ||
        property?.price ||
        property?.PerCost || // Legacy fallback
        0
    );

    // 2. Determine Selling Price (Customer Rate / ResortWala Rate) - Final Price
    let sellingPrice = parseFloat(
        property?.ResortWalaRate ||
        property?.resort_wala_rate ||
        0
    );

    // If no specific Customer Rate is set, fallback to Market Price
    if (!sellingPrice || sellingPrice === 0) {
        sellingPrice = marketPrice;
    }

    // Logic Check: If Customer Rate > Market Price (which shouldn't happen usually but data can be messy),
    // we assume the higher one is the "Original" and lower is "Deal".
    // However, user strictly wants: Vendor Rate = Crossed, Customer Rate = Used.
    // So we just enforce that. If Selling > Market, we just set Market = Selling to hide discount.
    if (sellingPrice > marketPrice) {
        marketPrice = sellingPrice;
    }

    // Calculations
    const savings = marketPrice - sellingPrice;
    const percentage = marketPrice > 0 ? Math.round((savings / marketPrice) * 100) : 0;

    return {
        sellingPrice,
        marketPrice,
        savings,
        percentage,
        isFallback: marketPrice === sellingPrice
    };
};
