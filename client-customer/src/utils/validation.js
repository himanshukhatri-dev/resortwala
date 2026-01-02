export const normalizePhone = (phone) => {
    if (!phone) return '';
    let normalized = phone.replace(/[\s-]/g, ''); // Remove spaces and hyphens
    normalized = normalized.replace(/^\+91/, ''); // Remove +91 prefix
    normalized = normalized.replace(/^0/, ''); // Remove leading 0
    return normalized;
};

export const isValidMobile = (phone) => {
    if (!phone) return false;
    const normalized = normalizePhone(phone);
    return /^[0-9]{10}$/.test(normalized);
};
