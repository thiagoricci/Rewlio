/**
 * Masks a phone number for display
 * Example: +12345678901 -> +1***\* *8901
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) {
    return phone;
  }
  
  // Keep the country code and last 4 digits
  const start = phone.substring(0, 2);
  const end = phone.substring(phone.length - 4);
  const middle = '*'.repeat(Math.min(phone.length - 6, 7));
  
  return `${start}${middle}${end}`;
}

/**
 * Validates E.164 phone number format
 * Example: +12345678901
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}
