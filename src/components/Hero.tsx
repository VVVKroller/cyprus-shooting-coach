import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  memoryLocalCache,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useTranslation } from "react-i18next";

// Import local hero images
import Hero01 from "../assets/images/hero-photos/Hero_01.webp";
import Hero02 from "../assets/images/hero-photos/Hero_02.webp";
import Hero03 from "../assets/images/hero-photos/Hero_03.webp";
import Hero04 from "../assets/images/hero-photos/Hero_04.webp";

// Local hero images configuration
const localHeroImages = [
  { url: Hero01, alt: "Hero Image 1" },
  { url: Hero02, alt: "Hero Image 2" },
  { url: Hero03, alt: "Hero Image 3" },
  { url: Hero04, alt: "Hero Image 4" },
];

const cachedHeroImages = JSON.parse(localStorage.getItem("heroImages") || "[]");

// Add this utility function at the top of the file
const getTextSizeClass = (
  text: string,
  type: "title" | "subtitle" | "stat" | "statLabel"
) => {
  const len = text.length;

  switch (type) {
    case "title":
      if (len > 30) return "text-xl sm:text-2xl md:text-4xl lg:text-5xl";
      return "text-2xl sm:text-3xl md:text-5xl lg:text-6xl";

    case "subtitle":
      if (len > 100) return "text-sm sm:text-base md:text-xl";
      return "text-base sm:text-lg md:text-2xl";

    case "stat":
      if (len > 5) return "text-lg md:text-3xl";
      return "text-xl md:text-4xl";

    case "statLabel":
      if (len > 20) return "text-[8px] md:text-xs";
      return "text-[10px] md:text-sm";

    default:
      return "";
  }
};

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] =
    useState<{ url: string; alt: string }[]>(localHeroImages);
  const { t } = useTranslation();

  // Preload images
  const preloadImages = (imageUrls: string[]) => {
    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
      });
    };

    return Promise.all(imageUrls.map((url) => loadImage(url))).catch((error) =>
      console.error("Error preloading images:", error)
    );
  };

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Try to get cached images first
        const cachedHeroImages = JSON.parse(
          localStorage.getItem("heroImages") || "[]"
        );
        if (cachedHeroImages.length > 0) {
          setSlides(cachedHeroImages);
          preloadImages(cachedHeroImages.map((slide: any) => slide.url));
          return;
        }

        // If no cached images, fetch from Firestore
        const q = query(collection(db, "heroImages"), orderBy("order"));
        const snapshot = await getDocs(q);
        const uploadedSlides = snapshot.docs.map((doc) => ({
          url: doc.data().url,
          alt: doc.data().alt,
        }));

        if (uploadedSlides.length > 0) {
          setSlides(uploadedSlides);
          localStorage.setItem("heroImages", JSON.stringify(uploadedSlides));
          preloadImages(uploadedSlides.map((slide) => slide.url));
        }
      } catch (error) {
        console.error("Error loading images:", error);
        // Keep using local images if there's an error
      }
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative bg-black text-white h-[600px] md:h-[700px] flex items-center overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[2000ms]"
            style={{
              backgroundImage: `url(${slide.url})`,
              transform: index === currentSlide ? "scale(1.05)" : "scale(1)",
            }}
          />
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col justify-center h-full pt-16 md:pt-0">
        <div className="max-w-3xl mb-6 md:mb-16">
          <h1
            className={`font-bold mb-3 md:mb-6 ${getTextSizeClass(
              t("hero.title"),
              "title"
            )}`}
          >
            {t("hero.title")}
          </h1>
          <p
            className={`text-gray-300 mb-4 md:mb-8 ${getTextSizeClass(
              t("hero.subtitle"),
              "subtitle"
            )}`}
          >
            {t("hero.subtitle")}
          </p>
          <a
            href="#contact"
            className="inline-block bg-amber-500 text-gray-900 px-5 md:px-8 py-2.5 md:py-4 rounded-md font-semibold hover:bg-amber-400 transition-colors text-sm md:text-base"
          >
            {t("hero.cta")}
          </a>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 md:gap-8 max-w-4xl">
          <div className="text-center p-2">
            <div
              className={`font-bold text-amber-500 mb-0.5 md:mb-2 ${getTextSizeClass(
                t("hero.stats.experience"),
                "stat"
              )}`}
            >
              {t("hero.stats.experience")}
            </div>
            <div
              className={`text-gray-300 ${getTextSizeClass(
                t("hero.stats.experienceLabel"),
                "statLabel"
              )}`}
            >
              {t("hero.stats.experienceLabel")}
            </div>
          </div>
          <div className="text-center p-2">
            <div
              className={`font-bold text-amber-500 mb-0.5 md:mb-2 ${getTextSizeClass(
                t("hero.stats.students"),
                "stat"
              )}`}
            >
              {t("hero.stats.students")}
            </div>
            <div
              className={`text-gray-300 ${getTextSizeClass(
                t("hero.stats.studentsLabel"),
                "statLabel"
              )}`}
            >
              {t("hero.stats.studentsLabel")}
            </div>
          </div>
          <div className="text-center p-2">
            <div
              className={`font-bold text-amber-500 mb-0.5 md:mb-2 ${getTextSizeClass(
                t("hero.stats.satisfaction"),
                "stat"
              )}`}
            >
              {t("hero.stats.satisfaction")}
            </div>
            <div
              className={`text-gray-300 ${getTextSizeClass(
                t("hero.stats.satisfactionLabel"),
                "statLabel"
              )}`}
            >
              {t("hero.stats.satisfactionLabel")}
            </div>
          </div>
          <div className="text-center p-2">
            <div
              className={`font-bold text-amber-500 mb-0.5 md:mb-2 ${getTextSizeClass(
                t("hero.stats.awards"),
                "stat"
              )}`}
            >
              {t("hero.stats.awards")}
            </div>
            <div
              className={`text-gray-300 ${getTextSizeClass(
                t("hero.stats.awardsLabel"),
                "statLabel"
              )}`}
            >
              {t("hero.stats.awardsLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 md:bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 md:w-3 h-2 md:h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-amber-500 w-4 md:w-6"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
