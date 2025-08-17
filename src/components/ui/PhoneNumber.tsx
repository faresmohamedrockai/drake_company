import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/phoneValidation';

interface PhoneNumberProps {
  phone: string | null | undefined;
  className?: string;
}

export const PhoneNumber: React.FC<PhoneNumberProps> = ({ phone, className = '' }) => {
  // Handle null/undefined phone numbers
  if (!phone) {
    return <span className={`text-gray-500 ${className}`}>No phone number</span>;
  }

  const formattedPhone = formatPhoneNumber(phone);

  const handleCallClick = () => {
    window.location.href = `tel:${formattedPhone}`;
  };

  const handleWhatsAppClick = () => {
    // Remove any non-digit characters for WhatsApp
    const cleanPhone = formattedPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Phone number with call functionality */}
      <button
        onClick={handleCallClick}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
        title="Click to call"
      >
        <Phone size={14} />
        <span className="text-xs sm:text-sm truncate">
          {formattedPhone}
        </span>
      </button>

      {/* WhatsApp icon */}
      <button
        onClick={handleWhatsAppClick}
        className="flex items-center justify-center w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
        title="Open WhatsApp"
      >
        <MessageCircle size={12} className="text-white" />
      </button>
    </div>
  );
};
