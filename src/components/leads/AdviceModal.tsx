import React from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

/**
 * واجهات (Interfaces) لتطابق شكل البيانات الجديد
 */
interface BilingualAdviceItem {
    ar_tip: string;
    en_tip: string;
}

interface AdviceData {
    title: string;
    advices: BilingualAdviceItem[];
}

/**
 * واجهة لتحديد الـ props التي يستقبلها المكون.
 */
interface AdviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => void;
    isLoading: boolean;
    advice: AdviceData | null;
    error: string | null;
    t: (key: string) => string;
    i18n?: any;
}

/**
 * مكون AdviceModal بتصميم عصري ومحسن
 * يستخدم اللون الأرجواني ويحسن من الخطوط والتنسيق العام.
 */
export const AdviceModal: React.FC<AdviceModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    isLoading,
    advice,
    error,
    t,
    i18n
}) => {
    if (!isOpen) return null;

    const isArabic = i18n?.language === 'ar';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6 relative flex flex-col m-4">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center mb-4">
                    <Sparkles className="text-[#803FC5]" size={28} />
                    <h2 className="text-lg font-semibold text-gray-900 mx-3">{t('aiSalesCoach')}</h2>
                </div>
                <hr className="mb-6" />

                <div className="min-h-[300px] flex flex-col items-center justify-center text-center">

                    {isLoading ? (
                        <div className="flex flex-col items-center text-gray-600 animate-fadeIn">
                            <Loader2 className="animate-spin mb-4 text-[#803FC5]" size={48} />
                            <p className="font-semibold">{t('generatingAdvice')}</p>
                            <p className="text-sm text-gray-500 mt-1">{t('pleaseWait')}</p>
                        </div>

                    ) : error ? (
                        <div className="text-red-600 bg-red-50 p-4 rounded-lg w-full animate-fadeIn">
                            <p className="font-semibold">{t('errorOccurred')}</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>

                    ) : advice ? (
                        <div className="text-left w-full animate-fadeIn">
                            {/* ✨ 2. تحسين العنوان الرئيسي */}
                            <h3 className={`text-2xl font-extrabold text-[#803FC5] mb-6 text-center ${isArabic ? 'font-arabic' : ''}`}>
                                {advice.title}
                            </h3>

                            {/* ✨ 3. التصميم الجديد لقائمة النصائح */}
                            <div className="space-y-5 max-h-[55vh] overflow-y-auto p-1 pr-4">
                                {advice.advices.map((item, index) => (
                                    <div key={index} className="flex items-start">
                                        {/* الدائرة المرقمة بالتصميم الجديد */}
                                        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-[#803FC5]/10 text-[#803FC5] rounded-full font-bold text-base mt-1 border border-[#803FC5]/20">
                                            {index + 1}
                                        </div>
                                        
                                        {/* بطاقة النصيحة */}
                                        <div className="flex-1 ml-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            {/* النصيحة الإنجليزية */}
                                            <div dir="ltr">
                                                <h4 className="font-semibold text-gray-600 text-xs mb-1 flex items-center">🇬🇧 English Tip</h4>
                                                <p className="text-base text-gray-800 leading-relaxed">{item.en_tip}</p>
                                            </div>

                                            {/* فاصل منقط */}
                                            <div className="my-3 border-t border-dashed border-gray-300"></div>

                                            {/* النصيحة العربية */}
                                            <div dir="rtl">
                                                <h4 className={`font-semibold text-gray-600 text-xs mb-1 flex items-center justify-end ${isArabic ? 'font-arabic' : ''}`}>نصيحة بالعربية 🇪🇬</h4>
                                                <p className={`text-base text-gray-800 leading-relaxed ${isArabic ? 'font-arabic' : ''}`}>{item.ar_tip}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    ) : (
                        <div className="animate-fadeIn">
                            <p className="text-gray-600 mb-6 max-w-xs mx-auto">{t('getInstantAnalysis')}</p>
                            <button
                                onClick={onGenerate}
                                disabled={isLoading}
                                // ✨ 4. تغيير لون الزر الرئيسي
                                className={`px-6 py-3 bg-[#803FC5] text-white font-semibold rounded-lg hover:bg-[#6d33a8] transition-all transform hover:scale-105 flex items-center justify-center w-full max-w-xs ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                <Sparkles size={20} className="mr-2" />
                                {t('generateAdviceForMe')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};