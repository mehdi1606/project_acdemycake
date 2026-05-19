import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';

import en from './locales/en.json';
import ar from './locales/ar.json';

/** Apply RTL layout + Arabic font when language changes */
const applyDirection = (lng: string) => {
  const isAr = lng === 'ar';
  document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  if (isAr && !document.getElementById('arabic-font')) {
    const link = document.createElement('link');
    link.id = 'arabic-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Cairo', sans-serif";
  } else if (!isAr) {
    document.body.style.fontFamily = '';
  }
};

/** Sync the Accept-Language header on all axios instances */
const syncAxiosLanguage = (lng: string) => {
  axios.defaults.headers.common['Accept-Language'] = lng;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Apply initial state
applyDirection(i18n.language);
syncAxiosLanguage(i18n.language);

// Apply on every language change
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  syncAxiosLanguage(lng);
});

export default i18n;
