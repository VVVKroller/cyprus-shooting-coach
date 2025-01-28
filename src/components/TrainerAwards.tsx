import React from "react";
import { Medal, Trophy, Award, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import coachPhoto from "../assets/images/coach-photo.png";

const awards = [
  {
    icon: Trophy,
    key: "issf",
  },
  {
    icon: Medal,
    key: "european",
  },
  {
    icon: Award,
    key: "master",
  },
  {
    icon: Star,
    key: "experience",
  },
];

export default function TrainerAwards() {
  const { t } = useTranslation();

  return (
    <section className="py-8 sm:py-12 bg-gray-900 border-t border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex-1 w-full md:w-auto">
            <img
              src={coachPhoto}
              alt={t("trainer.title")}
              className="rounded-lg shadow-xl w-full max-w-md mx-auto object-cover 
                       h-[300px] sm:h-[400px] md:h-[400px] transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="flex-1 space-y-4 sm:space-y-6 w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4 text-center md:text-left">
              {t("trainer.title")}
            </h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center md:text-left text-sm sm:text-base">
              {t("trainer.description")}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {awards.map((award) => {
                const Icon = award.icon;
                return (
                  <div
                    key={award.key}
                    className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-amber-500 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 transform hover:-translate-y-1"
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-2" />
                    <h3 className="text-white font-semibold text-sm sm:text-base">
                      {t(`trainer.awards.${award.key}.title`)}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {t(`trainer.awards.${award.key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
