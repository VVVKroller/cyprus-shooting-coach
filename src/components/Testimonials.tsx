import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

export default function Testimonials() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateAnimation = () => {
      if (scrollRef.current) {
        const isMobile = window.innerWidth < 640; // sm breakpoint
        scrollRef.current.style.animation = "none";
        scrollRef.current.offsetHeight; // Trigger reflow
        scrollRef.current.style.animation = `scroll ${
          isMobile ? "30s" : "50s"
        } linear infinite`;
      }
    };

    // Initial setup
    updateAnimation();

    // Update on resize
    window.addEventListener("resize", updateAnimation);

    return () => {
      window.removeEventListener("resize", updateAnimation);
    };
  }, []);

  const testimonials = t("testimonials.reviews", {
    returnObjects: true,
  }) as Array<{
    text: string;
    author: string;
  }>;

  return (
    <section className="py-12 sm:py-20 bg-gray-900" id="testimonials">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-white">
        {t("testimonials.title")}
      </h2>
      <div className="relative overflow-hidden w-full">
        <div
          ref={scrollRef}
          className="flex animate-scroll gap-6 sm:gap-10 whitespace-normal"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="w-[330px] sm:w-[500px] flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-xl shadow-lg
                      border border-gray-700 hover:border-amber-500/50 transition-all duration-300
                      hover:shadow-amber-500/10 hover:shadow-xl relative overflow-hidden group"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-500/5 rounded-tr-full transform -translate-x-8 translate-y-8 group-hover:-translate-x-6 group-hover:translate-y-6 transition-transform duration-300"></div>

              {/* Rating stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-amber-500 fill-amber-500"
                  />
                ))}
              </div>

              {/* Quote mark */}
              <div className="text-4xl text-amber-500/20 font-serif absolute top-4 right-6">
                "
              </div>

              {/* Content */}
              <div className="relative">
                <p className="mb-6 text-gray-300 text-sm sm:text-base whitespace-normal leading-relaxed">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-500 font-semibold text-lg">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-500 text-base sm:text-lg">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t("testimonials.verified")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
