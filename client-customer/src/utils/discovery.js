/**
 * Utility for managing user discovery preferences for ResortWala Smart Sorting.
 */

const PREF_COOKIE_NAME = 'rw_discovery_pref';
const EXPIRY_DAYS = 30;

export const getDiscoveryPrefs = () => {
    try {
        const name = PREF_COOKIE_NAME + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return JSON.parse(c.substring(name.length, c.length));
            }
        }
    } catch (e) {
        console.error("Failed to parse discovery cookies", e);
    }
    return {};
};

export const setDiscoveryPrefs = (prefs) => {
    const d = new Date();
    d.setTime(d.getTime() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const value = JSON.stringify({
        ...getDiscoveryPrefs(),
        ...prefs,
        last_ts: Math.floor(Date.now() / 1000)
    });
    document.cookie = PREF_COOKIE_NAME + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
};

export const updateFromFilters = (filters) => {
    const updates = {};
    if (filters.type && filters.type !== 'all') {
        updates.cat = filters.type;
    }
    if (filters.location) {
        updates.loc = filters.location;
    }
    if (filters.minPrice) {
        updates.p_min = filters.minPrice;
    }
    if (filters.maxPrice) {
        updates.p_max = filters.maxPrice;
    }

    if (Object.keys(updates).length > 0) {
        setDiscoveryPrefs(updates);
    }
};

export const updateFromProperty = (property) => {
    setDiscoveryPrefs({
        cat: property.PropertyType?.toLowerCase(),
        loc: property.Location || property.CityName,
        p_min: Math.max(0, (property.Price || 0) - 5000),
        p_max: (property.Price || 0) + 5000
    });
};
