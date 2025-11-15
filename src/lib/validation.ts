export type ValidationType = 'email' | 'address' | 'account_number';

export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim();
  
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Please use format: name@example.com'
    };
  }
  
  return {
    valid: true,
    normalized: trimmed.toLowerCase()
  };
}

export function validateAddress(address: string): ValidationResult {
  const trimmed = address.trim();
  
  // Must contain numbers (street number)
  if (!/\d/.test(trimmed)) {
    return {
      valid: false,
      error: 'Address must include a street number'
    };
  }
  
  // Minimum length check
  if (trimmed.length < 15) {
    return {
      valid: false,
      error: 'Please include street number, city, state, and ZIP'
    };
  }
  
  return {
    valid: true,
    normalized: trimmed
  };
}

export function validateAccountNumber(accountNumber: string): ValidationResult {
  // Extract digits only
  const digitsOnly = accountNumber.replace(/\D/g, '');
  
  if (digitsOnly.length < 5) {
    return {
      valid: false,
      error: 'Account number must be at least 5 digits'
    };
  }
  
  if (digitsOnly.length > 20) {
    return {
      valid: false,
      error: 'Account number must be no more than 20 digits'
    };
  }
  
  return {
    valid: true,
    normalized: digitsOnly
  };
}

export function validate(value: string, type: ValidationType): ValidationResult {
  switch (type) {
    case 'email':
      return validateEmail(value);
    case 'address':
      return validateAddress(value);
    case 'account_number':
      return validateAccountNumber(value);
    default:
      return {
        valid: false,
        error: 'Unknown validation type'
      };
  }
}
