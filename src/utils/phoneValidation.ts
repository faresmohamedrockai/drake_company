// Phone number validation utility
export const PHONE_REGEX = /^[+]?[\d\s\-\(\)]{10,}$/;

export const validatePhoneNumber = (phone: string | null | undefined): boolean => {
  // Handle null/undefined values
  if (!phone) {
    return false;
  }
  
  // Remove all non-digit characters for length check
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's at least 10 digits
  if (digitsOnly.length < 10) {
    return false;
  }
  
  // Check if it matches the regex pattern
  return PHONE_REGEX.test(phone);
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  // Handle null/undefined values
  if (!phone) {
    return '';
  }
  
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

export const getPhoneErrorMessage = (phone: string | null | undefined, language: string = 'en'): string => {
  // Handle null/undefined values
  if (!phone) {
    return language === 'ar' 
      ? 'رقم الهاتف مطلوب'
      : 'Phone number is required';
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    return language === 'ar' 
      ? 'يجب أن يحتوي رقم الهاتف على 10 أرقام على الأقل'
      : 'Phone number must be at least 10 digits';
  }
  
  if (!PHONE_REGEX.test(phone)) {
    return language === 'ar'
      ? 'صيغة رقم الهاتف غير صحيحة'
      : 'Invalid phone number format';
  }
  
  return '';
}; 