import React, { useState, useEffect } from "react";
import { Target, Menu, X } from "lucide-react";
import { ACADEMY } from "../constants";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-sm shadow-lg" : "bg-black"
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <a href="#" className="flex items-center space-x-3 group">
            <Target className="h-8 w-8 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">
                {ACADEMY.SHORT_NAME}
              </span>
              <span className="text-xs text-gray-400">{ACADEMY.FULL_NAME}</span>
            </div>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "#about", label: t("header.about") },
              { href: "#services", label: t("header.services") },
              { href: "#testimonials", label: t("header.reviews") },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative text-white hover:text-amber-500 transition-colors py-2 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a
              href="#contact"
              className="relative overflow-hidden bg-amber-500 text-gray-900 px-6 py-2.5 rounded-md font-semibold transition-all duration-300 hover:bg-amber-400 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
            >
              {t("header.bookTraining")}
            </a>
            <LanguageSwitcher />
          </div>

          <button
            className="md:hidden text-white hover:text-amber-500 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <div
          className={`md:hidden mt-4 space-y-4 overflow-hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {[
            { href: "#about", label: t("header.about") },
            { href: "#services", label: t("header.services") },
            { href: "#testimonials", label: t("header.reviews") },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block text-white hover:text-amber-500 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            className="block bg-amber-500 text-gray-900 px-4 py-2.5 rounded-md hover:bg-amber-400 transition-all duration-300 text-center font-semibold hover:shadow-lg hover:shadow-amber-500/20"
            onClick={() => setIsMenuOpen(false)}
          >
            {t("header.bookTraining")}
          </a>
          <div className="pt-2">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    </header>
  );
}
