import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import CalendarGrid from "./Calendar/CalendarGrid";
import TimeSlots from "./Calendar/TimeSlots";
import { format } from "date-fns";
import { addDoc, collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || isSubmitting || !captchaToken) return;

    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      const docRef = await addDoc(collection(db, "trainingRequests"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: format(selectedDate!, "yyyy-MM-dd"),
        time: selectedTime,
        status: "pending",
        createdAt: new Date(),
        captchaToken,
      });

      // Listen for verification result
      const unsubscribe = onSnapshot(
        doc(db, "trainingRequests", docRef.id),
        (doc) => {
          const data = doc.data();
          if (data?.recaptchaVerified === false) {
            // Show error if verification failed
            setShowErrorMessage(true);
            setShowSuccessMessage(false);
            // Optionally reset form
            resetForm();
          } else if (data?.recaptchaVerified === true) {
            // Show success if verification passed
            setShowSuccessMessage(true);
            setShowErrorMessage(false);
            resetForm();
          }
          // Clean up listener
          unsubscribe();
        }
      );
    } catch (error) {
      console.error("Error submitting request:", error);
      setShowErrorMessage(true);
      setShowSuccessMessage(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "" });
    setSelectedDate(null);
    setSelectedTime(null);
    setShowConfirmDialog(false);
    setConsentChecked(false);
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-gray-900 p-4 sm:p-8 rounded-lg border border-gray-700 shadow-xl"
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                {t("contact.form.name")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 px-4 py-3 sm:py-2"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                {t("contact.form.email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 px-4 py-3 sm:py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-300"
              >
                {t("contact.form.phone")}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 px-4 py-3 sm:py-2"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-300">
              {t("contact.form.dateTime")}
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[320px] px-4 sm:px-0">
                <CalendarGrid
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>
            <div className="mt-6">
              <TimeSlots
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-gray-300 hover:text-gray-200 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-2 border-gray-600 text-amber-500 focus:ring-amber-500 focus:ring-2 bg-gray-800 
                   checked:bg-amber-500 checked:border-amber-500 transition-colors cursor-pointer
                   group-hover:border-amber-500"
                required
              />
              <span className="flex-1">{t("contact.form.consent.text")}</span>
            </label>
          </div>

          <div className="flex justify-center my-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LdwJ9EqAAAAAAr3jR5CDGAtvXGQYtORWHMLRpb9"
              onChange={onCaptchaChange}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={
              !selectedDate ||
              !selectedTime ||
              isSubmitting ||
              !consentChecked ||
              !captchaToken
            }
            className="w-full bg-amber-500 text-gray-900 py-3 px-4 rounded-md hover:bg-amber-400 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isSubmitting
              ? t("contact.form.scheduling")
              : t("contact.form.scheduleTraining")}
          </button>

          {showSuccessMessage && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-md text-center animate-fadeIn">
              {t("contact.form.success")}
            </div>
          )}

          {showErrorMessage && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md text-center animate-fadeIn">
              {t("contact.form.error")}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            {t("contact.form.consent.privacy")}
          </p>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl text-white mb-4">
              {t("contact.form.confirmation.title")}
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                {t("contact.form.confirmation.text")}
              </p>
              <div className="bg-gray-700 p-4 rounded">
                <p className="text-white">
                  <strong>
                    {t("contact.form.confirmation.details.date")}:
                  </strong>{" "}
                  {format(selectedDate!, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-white">
                  <strong>
                    {t("contact.form.confirmation.details.time")}:
                  </strong>{" "}
                  {selectedTime}
                </p>
                <p className="text-white">
                  <strong>
                    {t("contact.form.confirmation.details.name")}:
                  </strong>{" "}
                  {formData.name}
                </p>
                <p className="text-white">
                  <strong>
                    {t("contact.form.confirmation.details.phone")}:
                  </strong>{" "}
                  {formData.phone}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {t("contact.form.confirmation.check")}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                {t("contact.form.confirmation.cancel")}
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-500 text-gray-900 rounded hover:bg-amber-400 font-semibold disabled:opacity-50"
              >
                {isSubmitting
                  ? t("contact.form.confirmation.confirming")
                  : t("contact.form.confirmation.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
