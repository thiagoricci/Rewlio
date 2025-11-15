/**
 * Generates a unique 6-character alphanumeric request ID
 * Format: XXXXXX (uppercase letters and numbers only)
 */
export function generateRequestId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
