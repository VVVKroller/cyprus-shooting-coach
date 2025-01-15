import React from "react";
import { Award, Users, Target, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
  {
    icon: Award,
    key: "certifiedInstructor",
  },
  {
    icon: Target,
    key: "personalizedApproach",
  },
  {
    icon: Users,
    key: "smallGroups",
  },
  {
    icon: Clock,
    key: "flexibleSchedule",
  },
];

export default function Features() {
  const { t } = useTranslation();

  return (
    <section
      className="py-16 bg-gray-800"
      id="about"
      aria-labelledby="features-title"
    >
      <div className="container mx-auto px-4">
        <h2
          id="features-title"
          className="text-[1.875rem] font-bold text-center text-white mb-12"
        >
          {t("features.title")}
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          role="list"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.key}
                className="relative group bg-gray-900 rounded-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/50 shadow-lg"
                role="listitem"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                <div className="relative z-10">
                  <div className="mb-6 relative" aria-hidden="true">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 mx-auto transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <div className="w-16 h-16 bg-amber-500/20 rounded-lg absolute top-2 left-1/2 -translate-x-1/2 -z-10 group-hover:scale-110 transition-transform duration-300"></div>
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-amber-400 transition-colors duration-300">
                    {t(`features.${feature.key}.title`)}
                  </h3>

                  <p className="text-gray-400 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
