export const getPricing = (property, dateOverride = null) => {
    // Safely parse values
    const ob = property?.onboarding_data || {};
    const pricing = ob.pricing || {};
    const adminPricing = property?.admin_pricing || {};

    // Determine target date for mapping (Default to today)
    const targetDate = dateOverride ? new Date(dateOverride) : new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = targetDate.getDay(); // 0 (Sun) - 6 (Sat)
    const dayName = days[dayIndex];

    const isWaterpark = property?.PropertyType?.toLowerCase() === 'waterpark';
    const isWeekend = ['friday', 'saturday', 'sunday'].includes(dayName);
    const wpKey = isWeekend ? 'adult_weekend' : 'adult_weekday';

    // 1. Determine Market Price (Vendor Ask / Base Rate)
    let marketPrice = parseFloat(
        property?.market_price ||
        (isWaterpark
            ? (adminPricing[wpKey]?.current || adminPricing.adult_rate?.current || adminPricing.adult?.current)
            : adminPricing[dayName]?.villa?.current) ||
        adminPricing.mon_thu?.villa?.current || // Legacy fallback
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
            : adminPricing[dayName]?.villa?.final) ||
        property?.ResortWalaRate ||
        property?.resort_wala_rate ||
        0
    );

    // If no specific Customer Rate is set, fallback to Market Price
    if (!sellingPrice || sellingPrice === 0) {
        sellingPrice = marketPrice;
    }

    // Calculations
    const savings = marketPrice - sellingPrice;
    const percentage = (marketPrice > 0 && savings > 0) ? Math.round((savings / marketPrice) * 100) : 0;

    return {
        sellingPrice,
        marketPrice,
        savings: Math.max(0, savings),
        percentage,
        isFallback: marketPrice === sellingPrice,
        isMarkup: sellingPrice > marketPrice
    };
};

