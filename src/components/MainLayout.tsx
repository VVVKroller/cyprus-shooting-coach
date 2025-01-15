import React from "react";
import Header from "./Header";
import Hero from "./Hero";
import Services from "./Services";
import TrainerAwards from "./TrainerAwards";
import Features from "./Features";
import Testimonials from "./Testimonials";
import ContactForm from "./ContactForm";
import Footer from "./Footer";
import { useTranslation } from "react-i18next";

export default function MainLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-[72px]">
        <Hero />
        <Services />
        <TrainerAwards />
        <Features />
        <Testimonials />
        <section className="py-20 bg-gray-800" id="contact">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              {t("contact.title")}
            </h2>
            <ContactForm />
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
