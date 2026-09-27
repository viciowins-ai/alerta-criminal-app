import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
];

export function LanguageSelectorModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { i18n, t } = useTranslation();

  if (!isOpen) return null;

  const currentLang = i18n.language || 'pt';

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    document.documentElement.lang = code;
    if (code === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('settings.selectLanguage', 'Idioma do Aplicativo')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.languageHelp', 'Selecione seu idioma preferido')}
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm">{lang.label}</span>
                </div>
                {isSelected && <Check size={18} className="text-blue-400" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors text-sm"
        >
          {t('common.close', 'Fechar')}
        </button>
      </div>
    </div>
  );
}
