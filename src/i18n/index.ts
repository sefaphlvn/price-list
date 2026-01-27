import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr.json';
import en from './locales/en.json';

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem('language');
  if (saved && ['tr', 'en'].includes(saved)) {
    return saved;
  }
  // Default to Turkish if browser language starts with 'tr'
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('tr') ? 'tr' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng;
});

export default i18n;
