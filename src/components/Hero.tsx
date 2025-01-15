import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<{ url: string; alt: string }[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
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

    return Promise.all(imageUrls.map((url) => loadImage(url)))
      .then(() => setImagesLoaded(true))
      .catch((error) => console.error("Error preloading images:", error));
  };

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Get uploaded images from Firestore
        const q = query(collection(db, "heroImages"), orderBy("order"));
        const snapshot = await getDocs(q);
        const uploadedSlides = snapshot.docs.map((doc) => ({
          url: doc.data().url,
          alt: doc.data().alt,
        }));

        // Use only database images
        setSlides(uploadedSlides);

        // Preload all images
        if (uploadedSlides.length > 0) {
          await preloadImages(uploadedSlides.map((slide) => slide.url));
        } else {
          // If no images in database, use local images as fallback
          setSlides(localHeroImages);
          await preloadImages(localHeroImages.map((slide) => slide.url));
        }
      } catch (error) {
        console.error("Error loading images:", error);
        // If there's an error, use local images as fallback
        setSlides(localHeroImages);
        await preloadImages(localHeroImages.map((slide) => slide.url));
      }
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (!imagesLoaded || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [imagesLoaded, slides.length]);

  if (!imagesLoaded) {
    return (
      <section className="relative bg-black text-white h-[450px] md:h-[700px] flex items-center">
        <div className="absolute inset-0 bg-black/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Loading...
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-black text-white h-[450px] md:h-[700px] flex items-center overflow-hidden">
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
      <div className="container mx-auto px-4 relative z-10 flex flex-col justify-center h-full">
        <div className="max-w-3xl mb-8 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            {t("hero.title")}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 md:mb-8">
            {t("hero.subtitle")}
          </p>
          <a
            href="#contact"
            className="inline-block bg-amber-500 text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-md font-semibold hover:bg-amber-400 transition-colors text-sm md:text-base"
          >
            {t("hero.cta")}
          </a>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl">
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">
              {t("hero.stats.experience")}
            </div>
            <div className="text-xs md:text-sm text-gray-300">
              {t("hero.stats.experienceLabel")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">
              {t("hero.stats.students")}
            </div>
            <div className="text-xs md:text-sm text-gray-300">
              {t("hero.stats.studentsLabel")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">
              {t("hero.stats.satisfaction")}
            </div>
            <div className="text-xs md:text-sm text-gray-300">
              {t("hero.stats.satisfactionLabel")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">
              {t("hero.stats.awards")}
            </div>
            <div className="text-xs md:text-sm text-gray-300">
              {t("hero.stats.awardsLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
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
