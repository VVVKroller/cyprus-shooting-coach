import React, { useState } from "react";
import {
  Shield,
  Target,
  Trophy,
  X,
  Clock,
  Wallet,
  Crosshair,
  Gauge,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const services = [
  {
    icon: Crosshair,
    key: "firstShot",
    color: "from-purple-500 to-purple-700",
    borderColor:
      "border-purple-500 md:border-gray-700 md:hover:border-purple-500",
    iconBg: "bg-gradient-to-r from-purple-500 to-purple-700",
  },
  {
    icon: Shield,
    key: "beginner",
    color: "from-green-500 to-emerald-700",
    borderColor:
      "border-green-500 md:border-gray-700 md:hover:border-green-500",
    iconBg: "bg-gradient-to-r from-green-500 to-emerald-700",
  },
  {
    icon: Gauge,
    key: "intermediate",
    color: "from-blue-500 to-blue-700",
    borderColor: "border-blue-500 md:border-gray-700 md:hover:border-blue-500",
    iconBg: "bg-gradient-to-r from-blue-500 to-blue-700",
  },
  {
    icon: Trophy,
    key: "advanced",
    color: "from-amber-500 to-amber-700",
    borderColor:
      "border-amber-500 md:border-gray-700 md:hover:border-amber-500",
    iconBg: "bg-gradient-to-r from-amber-500 to-amber-700",
  },
];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    key: string;
    color: string;
  };
}

function ServiceModal({ isOpen, onClose, service }: ModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBookTraining = () => {
    onClose();
    navigate("/#contact");
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = t(`services.${service.key}.features`, {
    returnObjects: true,
  }) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose}></div>

      <div className="relative bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className={`bg-gradient-to-r ${service.color} p-8 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-2xl font-bold text-white mb-4">
            {t(`services.${service.key}.title`)}
          </h3>

          <div className="flex flex-wrap gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{t(`services.${service.key}.duration`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>{t(`services.${service.key}.price`)}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="prose prose-invert max-w-none">
            <h4 className="text-xl font-semibold text-white mb-4">
              {t("services.about.title")}
            </h4>
            <p className="text-gray-300 mb-6">
              {t(`services.${service.key}.description`)}
            </p>

            <h4 className="text-xl font-semibold text-white mb-4">
              {t("services.features.title")}
            </h4>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleBookTraining}
            className={`w-full bg-gradient-to-r ${service.color} text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity`}
          >
            {t("services.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <section className="py-16 bg-gray-800" id="services">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          {t("services.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-[1600px] mx-auto px-4">
          {services.map((service) => {
            const Icon = service.icon;
            const features = t(`services.${service.key}.features`, {
              returnObjects: true,
            }) as string[];

            return (
              <div
                key={service.key}
                className={`bg-gray-900 rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 ${service.borderColor} min-w-[300px] flex flex-col`}
              >
                <div
                  className={`${service.iconBg} p-4 flex items-center justify-center`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-white mb-4 h-[56px]">
                    {t(`services.${service.key}.title`)}
                  </h3>

                  <ul className="space-y-3 mb-6 flex-1 min-h-[200px]">
                    {features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-gray-300"
                      >
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col space-y-3 mt-auto">
                    <p className="text-amber-500 font-semibold">
                      {t(`services.${service.key}.price`)}
                    </p>
                    <button
                      onClick={() => setSelectedService(service.key)}
                      className="w-full bg-gray-800 text-white font-semibold py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                    >
                      {t("services.learnMore")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedService && (
          <ServiceModal
            isOpen={true}
            onClose={() => setSelectedService(null)}
            service={services.find((s) => s.key === selectedService)!}
          />
        )}
      </div>
    </section>
  );
}
