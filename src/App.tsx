import { useLocation, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import MainLayout from "./components/MainLayout";
import AdminRoute from "./components/Admin/AdminRoute";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { initializeGA, trackPageView } from "./utils/analytics";

const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

export default function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    initializeGA(GA_MEASUREMENT_ID);
  }, []);

  return (
    <HelmetProvider>
      <RouteTracker />
      <Helmet>
        {/* Primary Meta Tags */}
        <html lang={i18n.language} />
        <title>{t("meta.title")}</title>
        <meta name="title" content={t("meta.title")} />
        <meta name="description" content={t("meta.description")} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin} />
        <meta property="og:title" content={t("meta.title")} />
        <meta property="og:description" content={t("meta.description")} />
        <meta
          property="og:image"
          content={`${window.location.origin}/og-image.jpg`}
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.origin} />
        <meta property="twitter:title" content={t("meta.title")} />
        <meta property="twitter:description" content={t("meta.description")} />
        <meta
          property="twitter:image"
          content={`${window.location.origin}/og-image.jpg`}
        />

        {/* Additional SEO tags */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <link rel="canonical" href={window.location.href} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: t("meta.title"),
            description: t("meta.description"),
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nicosia",
              addressCountry: "CY",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "35.1856",
              longitude: "33.3823",
            },
            openingHours: ["Mo-Fr 09:00-17:00", "Sa 09:00-14:00"],
            url: window.location.origin,
            telephone: t("contact.phone"),
            priceRange: "€€",
          })}
        </script>
      </Helmet>

      <Routes>
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </HelmetProvider>
  );
}
