import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

const languages = [
  {
    code: "en",
    name: "English",
    flag: (
      <svg className="w-5 h-5" viewBox="0 0 640 480">
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path
          fill="#FFF"
          d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
        />
        <path
          fill="#C8102E"
          d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
        />
        <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
        <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
      </svg>
    ),
  },
  {
    code: "ru",
    name: "Русский",
    flag: (
      <svg className="w-5 h-5" viewBox="0 0 640 480">
        <g fillRule="evenodd" strokeWidth="1pt">
          <path fill="#fff" d="M0 0h640v480H0z" />
          <path fill="#0039a6" d="M0 160h640v320H0z" />
          <path fill="#d52b1e" d="M0 320h640v160H0z" />
        </g>
      </svg>
    ),
  },
  {
    code: "el",
    name: "Ελληνικά",
    flag: (
      <svg className="w-5 h-5" viewBox="0 0 640 480">
        <path fill="#0D5EAF" d="M0 0h640v53.3H0z" />
        <path fill="#FFF" d="M0 53.3h640v53.4H0z" />
        <path fill="#0D5EAF" d="M0 106.7h640V160H0z" />
        <path fill="#FFF" d="M0 160h640v53.3H0z" />
        <path fill="#0D5EAF" d="M0 213.3h640v53.4H0z" />
        <path fill="#FFF" d="M0 266.7h640V320H0z" />
        <path fill="#0D5EAF" d="M0 320h640v53.3H0z" />
        <path fill="#FFF" d="M0 373.3h640v53.4H0z" />
        <path fill="#0D5EAF" d="M0 426.7h640V480H0z" />
        <path fill="#0D5EAF" d="M0 0h213.3v266.7H0z" />
        <path fill="#FFF" d="M86 0h53.3v266.7H86z" />
        <path fill="#FFF" d="M0 106.7h213.3V160H0z" />
      </svg>
    ),
  },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (langCode: string) => {
    // Get current path segments
    const pathSegments = location.pathname.split("/").filter(Boolean);

    // Remove the language segment if it exists
    if (languages.some((lang) => lang.code === pathSegments[0])) {
      pathSegments.shift();
    }

    // Construct new path with new language
    const newPath = `/${langCode}${
      pathSegments.length ? "/" + pathSegments.join("/") : ""
    }`;

    // Update language and navigate
    i18n.changeLanguage(langCode);
    localStorage.setItem("language", langCode);
    navigate(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`transition-transform hover:scale-110 relative ${
            i18n.language === lang.code
              ? "after:absolute after:inset-0 after:bg-amber-500/20 after:rounded-sm"
              : "opacity-70 hover:opacity-100"
          }`}
          aria-label={`Switch to ${lang.name}`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}
