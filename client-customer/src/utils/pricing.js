export const getPricing = (property) => {
    // Safely parse values
    const originalPrice = parseFloat(property?.Price || 0);
    const rwRate = parseFloat(property?.ResortWalaRate || 0); // Handle string or numeric
    const dealPrice = parseFloat(property?.DealPrice || 0);

    let sellingPrice = originalPrice;
    let marketPrice = originalPrice * 1.25; // Default fallback (approx 20% discount illusion)

    // Logic: If RW Rate exists and is lower than Price, use Price as Market and RW as Selling
    if (rwRate > 0 && rwRate < originalPrice) {
        sellingPrice = rwRate;
        marketPrice = originalPrice;
    }
    // Logic: If Deal Price exists and is lower than Price, use Deal Price (if RW rate absent or logic dictates)
    // Assuming ResortWalaRate takes precedence if both exist, or we check for lowest?
    // Let's stick strictly to plan: RW Rate first.
    else if (dealPrice > 0 && dealPrice < originalPrice) {
        sellingPrice = dealPrice;
        marketPrice = originalPrice;
    }

    // Ensure logic holds: Market > Selling
    if (marketPrice <= sellingPrice) {
        marketPrice = sellingPrice * 1.25;
    }

    const savings = marketPrice - sellingPrice;
    const percentage = Math.round((savings / marketPrice) * 100);

    return {
        sellingPrice,
        marketPrice,
        savings,
        percentage,
        isFallback: marketPrice === originalPrice * 1.25 // Flag to know if it's "real" or "implied"
    };
};
