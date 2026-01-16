export const getPricing = (property) => {
    // Safely parse values
    const ob = property?.onboarding_data || {};
    const pricing = ob.pricing || {};
    const adminPricing = property?.admin_pricing || {};

    // Determine current day for mapping
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay(); // 0 (Sun) - 6 (Sat)
    const todayName = days[todayIndex];

    const isWaterpark = property?.PropertyType?.toLowerCase() === 'waterpark';
    const isWeekend = ['friday', 'saturday', 'sunday'].includes(todayName);
    const wpKey = isWeekend ? 'adult_weekend' : 'adult_weekday';

    // 1. Determine Market Price (Vendor Ask / Base Rate)
    let marketPrice = parseFloat(
        (isWaterpark
            ? (adminPricing[wpKey]?.current || adminPricing.adult_rate?.current || adminPricing.adult?.current)
            : adminPricing[todayName]?.villa?.current) ||
        adminPricing.mon_thu?.villa?.current || // Legacy fallback
        property?.display_price ||
        property?.lowest_price_next_30 ||
        pricing.weekday ||
        pricing.mon_thu ||
        pricing.base_price ||
        property?.Price ||
        property?.price ||
        0
    );


    // 2. Determine Selling Price (Customer Rate / ResortWala Rate)
    let sellingPrice = parseFloat(
        property?.display_price ||
        property?.lowest_price_next_30 ||
        (isWaterpark
            ? (adminPricing[wpKey]?.final || adminPricing.adult_rate?.discounted || adminPricing.adult?.discounted)
            : adminPricing[todayName]?.villa?.final) ||
        property?.ResortWalaRate ||
        property?.resort_wala_rate ||
        0
    );



    // If no specific Customer Rate is set, fallback to Market Price
    if (!sellingPrice || sellingPrice === 0) {
        sellingPrice = marketPrice;
    }

    // Logic Check: If Customer Rate > Market Price, assume the higher one is Market
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

