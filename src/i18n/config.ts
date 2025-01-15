import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import el from "./locales/el.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  el: { translation: el },
};

// Get supported languages
const supportedLangs = Object.keys(resources);

// Get browser language
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split("-")[0]; // Get the language code without region
  return supportedLangs.includes(browserLang) ? browserLang : "en";
};

// Get initial language
const getInitialLanguage = () => {
  const savedLang = localStorage.getItem("language");
  if (savedLang && supportedLangs.includes(savedLang)) {
    return savedLang;
  }
  return getBrowserLanguage();
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
