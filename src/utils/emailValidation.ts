// Email validation utility
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateEmail = (email: string): boolean => {
  // Check if email is not empty and matches the regex pattern
  return email.trim() !== '' && EMAIL_REGEX.test(email);
};

export const getEmailErrorMessage = (email: string, language: string = 'en'): string => {
  if (email.trim() === '') {
    return language === 'ar' 
      ? 'البريد الإلكتروني مطلوب'
      : 'Email is required';
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return language === 'ar'
      ? 'صيغة البريد الإلكتروني غير صحيحة'
      : 'Invalid email format';
  }
  
  return '';
}; 