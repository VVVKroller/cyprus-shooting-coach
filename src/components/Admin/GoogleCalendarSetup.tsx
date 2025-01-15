import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// Google Calendar API configuration
const GOOGLE_API_KEY = "AIzaSyAtQNERdN7nUc9kY9Ar0mPaqxV0w4Gz_Gc";
const GOOGLE_CLIENT_ID =
  "136988486520-nsludfdq4836dnmj2vonebbt7un32ipe.apps.googleusercontent.com";
const SCOPES =
  "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarSetup() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [calendarId, setCalendarId] = useState("primary");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "googleCalendar"));
        setIsConfigured(
          settingsDoc.exists() && settingsDoc.data()?.isConnected
        );
        if (settingsDoc.exists()) {
          setCalendarId(settingsDoc.data()?.calendarId || "primary");
        }
      } catch (error) {
        console.error("Error checking configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfiguration();
  }, []);

  const handleConnect = async () => {
    try {
      // Load the Identity Services script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.body.appendChild(script);
      });

      // Load the Google API script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.body.appendChild(script);
      });

      // Initialize GAPI client
      await new Promise<void>((resolve) => {
        window.gapi.load("client", resolve);
      });

      await window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });

      // Initialize Google Identity Services
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error) {
            console.error("Authentication error:", response);
            return;
          }

          try {
            // Set the access token
            window.gapi.client.setToken(response);

            // Test calendar access
            await window.gapi.client.calendar.calendarList.list({
              maxResults: 1,
            });

            // Store configuration
            await setDoc(doc(db, "settings", "googleCalendar"), {
              isConnected: true,
              lastSync: new Date(),
              calendarId: "primary",
            });

            setIsConfigured(true);
            console.log("Google Calendar connected successfully");
          } catch (error) {
            console.error("Error setting up calendar:", error);
            window.gapi.client.setToken(null);
          }
        },
      });

      // Request token
      client.requestAccessToken();
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      window.gapi.client.setToken(null);

      await setDoc(doc(db, "settings", "googleCalendar"), {
        isConnected: false,
        lastSync: new Date(),
      });

      setIsConfigured(false);
    } catch (error) {
      console.error("Error disconnecting from Google Calendar:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">
        Google Calendar Integration
      </h2>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConfigured ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-gray-300">
            {isConfigured ? "Connected to Google Calendar" : "Not connected"}
          </span>
        </div>

        {isConfigured ? (
          <div className="space-y-4">
            <div className="text-gray-300">
              <p>Calendar ID: {calendarId}</p>
              <p className="text-sm text-gray-400 mt-2">
                Training sessions will be automatically synced with this
                calendar.
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Disconnect Google Calendar
            </button>
          </div>
        ) : (
          <button
            disabled
            className="bg-gray-600 text-gray-400 px-4 py-2 rounded cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 22c-5.514 0-10-4.486-10-10S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-15h-2v6l5.25 3.15.75-1.23-4-2.37V7z" />
            </svg>
            Connect Google Calendar
            <span className="text-sm">(Coming Soon)</span>
          </button>
        )}
      </div>
    </div>
  );
}
