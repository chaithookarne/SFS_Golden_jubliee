// lib/phone.ts

/**
 * Normalize phone number to a consistent format
 * Converts: +91 9876543210, 091 9876543210, 9876543210, etc.
 * To: 919876543210 (India country code 91 + 10 digit number)
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    if (!digits || digits.length === 0) {
        return '';
    }

    // Handle leading zero (Indian format)
    let normalized = digits.startsWith('0') ? digits.slice(1) : digits;

    // If doesn't start with 91 (India country code), prepend it
    if (!normalized.startsWith('91')) {
        normalized = '91' + normalized;
    }

    // Ensure exactly 12 digits (91 + 10 digit Indian number)
    if (normalized.length !== 12) {
        return ''; // Invalid format
    }

    return normalized;
}

/**
 * Format normalized phone number for display
 * Input: 919876543210
 * Output: +91 98765 43210
 */
export function formatPhoneForDisplay(normalizedPhone: string): string {
    if (!normalizedPhone || normalizedPhone.length !== 12) {
        return normalizedPhone;
    }

    const countryCode = normalizedPhone.slice(0, 2); // 91
    const areaCode = normalizedPhone.slice(2, 7); // 98765
    const number = normalizedPhone.slice(7); // 43210

    return `+${countryCode} ${areaCode} ${number}`;
}

/**
 * Check if two phone numbers are the same (normalized comparison)
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
    const norm1 = normalizePhoneNumber(phone1);
    const norm2 = normalizePhoneNumber(phone2);

    return norm1 === norm2 && norm1 !== '';
}