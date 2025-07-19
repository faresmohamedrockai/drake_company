// Phone number validation utility
export const PHONE_REGEX = /^[+]?[\d\s\-\(\)]{11,}$/;

export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters for length check
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's at least 11 digits
  if (digitsOnly.length < 11) {
    return false;
  }
  
  // Check if it matches the regex pattern
  return PHONE_REGEX.test(phone);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If it starts with country code (like +20 for Egypt), keep it
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // For Egyptian numbers, add +20 if not present
  if (digitsOnly.startsWith('20') && digitsOnly.length >= 12) {
    return `+${digitsOnly}`;
  }
  
  // For local Egyptian numbers (starting with 01), add +20
  if (digitsOnly.startsWith('01') && digitsOnly.length === 11) {
    return `+20${digitsOnly.substring(1)}`;
  }
  
  // For other cases, just return the original
  return phone;
};

export const getPhoneErrorMessage = (phone: string, language: string = 'en'): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 11) {
    return language === 'ar' 
      ? 'يجب أن يحتوي رقم الهاتف على 11 رقم على الأقل'
      : 'Phone number must be at least 11 digits';
  }
  
  if (!PHONE_REGEX.test(phone)) {
    return language === 'ar'
      ? 'صيغة رقم الهاتف غير صحيحة'
      : 'Invalid phone number format';
  }
  
  return '';
}; 