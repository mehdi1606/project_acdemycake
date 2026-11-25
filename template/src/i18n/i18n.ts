import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';

import en from './locales/en.json';

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
    // Arabic is loaded on demand (its own chunk): most visits only need one language.
    resources: {
      en: { translation: en },
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

/** Load the Arabic strings once, the first time Arabic is needed. */
let arabic: Promise<void> | null = null;
const loadArabic = (): Promise<void> => {
  if (!arabic) {
    arabic = import(/* webpackChunkName: "i18n-ar" */ './locales/ar.json').then((m) => {
      i18n.addResourceBundle('ar', 'translation', (m as { default: object }).default ?? m, true, true);
    });
  }
  return arabic;
};

// Switching to Arabic waits for its strings, so the page never flashes English.
const changeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = ((lng?: string, cb?: Parameters<typeof changeLanguage>[1]) =>
  (lng && lng.startsWith('ar') ? loadArabic() : Promise.resolve()).then(() => changeLanguage(lng, cb))) as typeof i18n.changeLanguage;

/** Resolves once the starting language is ready to draw (immediate for English). */
export const i18nReady: Promise<unknown> = (i18n.language || '').startsWith('ar')
  ? loadArabic().then(() => changeLanguage('ar'))
  : Promise.resolve();

// Apply initial state
applyDirection(i18n.language);
syncAxiosLanguage(i18n.language);

// Apply on every language change
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  syncAxiosLanguage(lng);
});

export default i18n;
