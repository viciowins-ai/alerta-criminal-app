import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'pt' : 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      it: { translation: it },
      hi: { translation: hi },
      ar: { translation: ar }
    },
    lng: savedLang,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang;
  if (savedLang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}

export default i18n;
