import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { format, parseISO } from "date-fns";
import GoogleCalendarSetup from "./GoogleCalendarSetup";
import { auth } from "../../firebase/config";
import { addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { addDays } from "date-fns";
import HeroImageManager from "./HeroImageManager";
import { gapi } from "gapi-script";

interface AvailableDate {
  id: string;
  date: string;
  slots: string[];
}

interface TrainingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "declined";
  createdAt: Date;
}

type TabType = "requests" | "dates" | "schedule" | "images";

// Add this interface for time change
interface TimeChangeData {
  training: TrainingRequest;
  newTime: string;
  newDate: string;
}

// Add this interface with existing interfaces
interface GoogleEvent {
  summary: string;
  location: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

const GOOGLE_API_KEY = "AIzaSyAtQNERdN7nUc9kY9Ar0mPaqxV0w4Gz_Gc";
const GOOGLE_CLIENT_ID =
  "136988486520-nsludfdq4836dnmj2vonebbt7un32ipe.apps.googleusercontent.com";
const CALENDAR_ID = "primary";

export default function AdminPanel() {
  const [dates, setDates] = useState<AvailableDate[]>([]);
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [trainings, setTrainings] = useState<TrainingRequest[]>([]);
  const [newDate, setNewDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] =
    useState<TrainingRequest | null>(null);
  const [showTimeChangeDialog, setShowTimeChangeDialog] =
    useState<TimeChangeData | null>(null);

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  useEffect(() => {
    loadDates();
    loadRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "schedule") {
      loadAllTrainings().then(setTrainings);
    }
  }, [activeTab]);

  const loadDates = async () => {
    const querySnapshot = await getDocs(collection(db, "availableDates"));
    const today = format(new Date(), "yyyy-MM-dd");

    const loadedDates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AvailableDate[];

    // Sort dates
    const sortedDates = loadedDates.sort((a, b) => {
      // Put past dates at the end
      if (a.date < today && b.date >= today) return 1;
      if (b.date < today && a.date >= today) return -1;

      // Sort future dates ascending (closest first)
      return a.date.localeCompare(b.date);
    });

    setDates(sortedDates);
  };

  const loadRequests = async () => {
    const q = query(
      collection(db, "trainingRequests"),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    const loadedRequests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as TrainingRequest[];

    setRequests(
      loadedRequests.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )
    );
  };

  const createGoogleCalendarEvent = async (training: TrainingRequest) => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "googleCalendar"));
      if (!settingsDoc.exists() || !settingsDoc.data().isConnected) {
        return; // Skip if not connected to Google Calendar
      }

      const startDateTime = `${training.date}T${training.time}:00`;
      const endDateTime = `${training.date}T${
        training.time.split(":")[0]
      }:50:00`; // 50 min duration

      const event = {
        summary: `Shooting Training - ${training.name}`,
        location: "Your Location",
        description: `Training session for ${training.name}\nPhone: ${training.phone}\nEmail: ${training.email}`,
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Nicosia",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Nicosia",
        },
      };

      await gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: event,
      });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      // Don't block the approval process if calendar sync fails
    }
  };

  const handleApproveRequest = async (request: TrainingRequest) => {
    try {
      // Update request status
      await updateDoc(doc(db, "trainingRequests", request.id), {
        status: "approved",
      });

      // Update available slots
      const dateDoc = dates.find((d) => d.date === request.date);
      if (dateDoc) {
        await updateDoc(doc(db, "availableDates", dateDoc.id), {
          slots: dateDoc.slots.filter((slot) => slot !== request.time),
        });
      }

      // Create Google Calendar event
      await createGoogleCalendarEvent(request);

      loadDates();
      loadRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request. Please try again.");
    }
  };

  const handleDeclineRequest = async (request: TrainingRequest) => {
    await updateDoc(doc(db, "trainingRequests", request.id), {
      status: "declined",
    });
    loadRequests();
  };

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || selectedSlots.length === 0) return;

    await addDoc(collection(db, "availableDates"), {
      date: newDate,
      slots: selectedSlots,
    });

    setNewDate("");
    setSelectedSlots([]);
    loadDates();
  };

  const handleDeleteDate = async (id: string) => {
    await deleteDoc(doc(db, "availableDates", id));
    loadDates();
  };

  const handleDeleteTimeSlot = async (dateId: string, slotToDelete: string) => {
    const dateDoc = dates.find((d) => d.id === dateId);
    if (!dateDoc) return;

    const updatedSlots = dateDoc.slots.filter((slot) => slot !== slotToDelete);

    if (updatedSlots.length === 0) {
      // If no slots left, delete the whole date
      await deleteDoc(doc(db, "availableDates", dateId));
    } else {
      // Update with remaining slots
      await updateDoc(doc(db, "availableDates", dateId), {
        slots: updatedSlots,
      });
    }

    loadDates();
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleQuickSchedule = async () => {
    const startDate = new Date();

    // Create an array of 10 dates starting from tomorrow
    const dates = Array.from({ length: 10 }, (_, i) =>
      format(addDays(startDate, i + 1), "yyyy-MM-dd")
    );

    try {
      // Get all existing dates first
      const querySnapshot = await getDocs(collection(db, "availableDates"));
      const existingDates = querySnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        return {
          ...acc,
          [data.date]: {
            id: doc.id,
            slots: data.slots,
          },
        };
      }, {} as Record<string, { id: string; slots: string[] }>);

      // Process each date
      for (const date of dates) {
        if (date in existingDates) {
          // Date exists, merge time slots
          const existingSlots = new Set(existingDates[date].slots);
          const newSlots = timeSlots.filter((slot) => !existingSlots.has(slot));

          if (newSlots.length > 0) {
            // Update existing document with merged slots
            await updateDoc(doc(db, "availableDates", existingDates[date].id), {
              slots: [...existingDates[date].slots, ...newSlots],
            });
          }
        } else {
          // Date doesn't exist, create new document
          await addDoc(collection(db, "availableDates"), {
            date,
            slots: timeSlots,
          });
        }
      }

      loadDates();
    } catch (error) {
      console.error("Error adding schedule:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "availableDates"));

      // Delete all documents
      await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      loadDates();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error deleting all dates:", error);
    }
  };

  const loadAllTrainings = async () => {
    const q = query(
      collection(db, "trainingRequests"),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    const loadedRequests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as TrainingRequest[];

    return loadedRequests.sort((a, b) => {
      // First sort by date
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // Then by time
      return a.time.localeCompare(b.time);
    });
  };

  const handleCancelTraining = async (training: TrainingRequest) => {
    try {
      // Update training status to declined
      await updateDoc(doc(db, "trainingRequests", training.id), {
        status: "declined",
      });

      // Add the time slot back to available dates
      const dateQuery = query(
        collection(db, "availableDates"),
        where("date", "==", training.date)
      );
      const dateSnapshot = await getDocs(dateQuery);

      if (!dateSnapshot.empty) {
        // Date exists, add time slot back
        const dateDoc = dateSnapshot.docs[0];
        const currentSlots = dateDoc.data().slots || [];
        await updateDoc(doc(db, "availableDates", dateDoc.id), {
          slots: [...currentSlots, training.time].sort(),
        });
      } else {
        // Date doesn't exist, create new one
        await addDoc(collection(db, "availableDates"), {
          date: training.date,
          slots: [training.time],
        });
      }

      // Refresh data
      loadAllTrainings().then(setTrainings);
      setShowCancelDialog(null);
    } catch (error) {
      console.error("Error canceling training:", error);
    }
  };

  // Add function to check if time slot is available
  const isTimeSlotAvailable = (
    date: string,
    time: string,
    excludeTrainingId?: string
  ) => {
    // Check if time exists in available dates
    const dateDoc = dates.find((d) => d.date === date);
    const isSlotAvailable = dateDoc?.slots.includes(time);

    // Check if time is not taken by another training
    const isSlotTaken = trainings.some(
      (t) =>
        t.id !== excludeTrainingId && // Exclude current training
        t.date === date &&
        t.time === time &&
        t.status === "approved"
    );

    return isSlotAvailable && !isSlotTaken;
  };

  const updateGoogleCalendarEvent = async (
    training: TrainingRequest,
    newTime: string,
    newDate: string
  ) => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "googleCalendar"));
      if (!settingsDoc.exists() || !settingsDoc.data().isConnected) {
        return;
      }

      // Find existing event
      const response = await gapi.client.calendar.events.list({
        calendarId: CALENDAR_ID,
        q: `Shooting Training - ${training.name}`,
        timeMin: `${training.date}T00:00:00Z`,
        timeMax: `${training.date}T23:59:59Z`,
      });

      const event = response.result.items?.[0];
      if (event) {
        const startDateTime = `${newDate}T${newTime}:00`;
        const endDateTime = `${newDate}T${newTime.split(":")[0]}:50:00`;

        await gapi.client.calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: event.id,
          resource: {
            ...event,
            start: {
              dateTime: startDateTime,
              timeZone: "Asia/Nicosia",
            },
            end: {
              dateTime: endDateTime,
              timeZone: "Asia/Nicosia",
            },
          },
        });
      }
    } catch (error) {
      console.error("Error updating calendar event:", error);
    }
  };

  const handleTimeChange = async (
    training: TrainingRequest,
    newTime: string,
    newDate: string
  ) => {
    try {
      // Check if new time slot is available
      if (!isTimeSlotAvailable(newDate, newTime, training.id)) {
        alert("This time slot is not available");
        return;
      }

      // Remove old time slot from available dates
      const oldDateQuery = query(
        collection(db, "availableDates"),
        where("date", "==", training.date)
      );
      const oldDateSnapshot = await getDocs(oldDateQuery);

      if (!oldDateSnapshot.empty) {
        const dateDoc = oldDateSnapshot.docs[0];
        const currentSlots = dateDoc.data().slots || [];
        // Add old time back to available slots only if it's not already there
        if (!currentSlots.includes(training.time)) {
          await updateDoc(doc(db, "availableDates", dateDoc.id), {
            slots: [...currentSlots, training.time].sort(),
          });
        }
      }

      // Remove new time from available dates
      const newDateQuery = query(
        collection(db, "availableDates"),
        where("date", "==", newDate)
      );
      const newDateSnapshot = await getDocs(newDateQuery);

      if (!newDateSnapshot.empty) {
        const dateDoc = newDateSnapshot.docs[0];
        const currentSlots = dateDoc.data().slots || [];
        // Remove new time from available slots
        await updateDoc(doc(db, "availableDates", dateDoc.id), {
          slots: currentSlots.filter((slot) => slot !== newTime).sort(),
        });
      }

      // Update training time and date
      await updateDoc(doc(db, "trainingRequests", training.id), {
        time: newTime,
        date: newDate,
      });

      // Update Google Calendar event
      await updateGoogleCalendarEvent(training, newTime, newDate);

      // Refresh data
      loadAllTrainings().then(setTrainings);
      loadDates();
      setShowTimeChangeDialog(null);
    } catch (error) {
      console.error("Error changing training time:", error);
      alert("Error changing training time. Please try again.");
    }
  };

  // Add Time Change Dialog component
  const TimeChangeDialog = () => {
    if (!showTimeChangeDialog) return null;

    const { training } = showTimeChangeDialog;
    const [selectedTime, setSelectedTime] = useState(training.time);
    const [selectedDate, setSelectedDate] = useState(training.date);
    const [isCustomTime, setIsCustomTime] = useState(false);
    const [customTime, setCustomTime] = useState("");

    // Get available dates (excluding past dates)
    const availableDates = dates
      .filter((d) => d.date >= format(new Date(), "yyyy-MM-dd"))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get available times for selected date
    const availableTimes = timeSlots.filter(
      (time) =>
        time === training.time ||
        (selectedDate === training.date
          ? isTimeSlotAvailable(selectedDate, time, training.id)
          : isTimeSlotAvailable(selectedDate, time))
    );

    // Validate custom time format (HH:mm)
    const isValidTimeFormat = (time: string) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    };

    const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomTime(value);
    };

    const handleTimeSubmit = () => {
      if (isCustomTime) {
        if (!isValidTimeFormat(customTime)) {
          alert("Please enter a valid time in HH:mm format (e.g., 09:30)");
          return;
        }
        handleTimeChange(training, customTime, selectedDate);
      } else {
        handleTimeChange(training, selectedTime, selectedDate);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl text-white mb-4">Change Training Time</h3>
          <p className="text-gray-300 mb-4">
            Change schedule for {training.name}'s training
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-300 mb-2">
                Select New Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (!isCustomTime) {
                    setSelectedTime(timeSlots[0]); // Reset time when date changes
                  }
                }}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                {availableDates.map((date) => (
                  <option key={date.date} value={date.date}>
                    {new Date(date.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-gray-300">Time Selection</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-300">
                  <input
                    type="radio"
                    checked={!isCustomTime}
                    onChange={() => setIsCustomTime(false)}
                    className="mr-2"
                  />
                  Preset Times
                </label>
                <label className="flex items-center text-gray-300">
                  <input
                    type="radio"
                    checked={isCustomTime}
                    onChange={() => setIsCustomTime(true)}
                    className="mr-2"
                  />
                  Custom Time
                </label>
              </div>

              {isCustomTime ? (
                <div>
                  <input
                    type="text"
                    value={customTime}
                    onChange={handleCustomTimeChange}
                    placeholder="HH:mm (e.g., 09:30)"
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Enter time in 24-hour format (HH:mm)
                  </p>
                </div>
              ) : (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                >
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowTimeChangeDialog(null)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleTimeSubmit}
              className="px-4 py-2 bg-amber-500 text-gray-900 rounded hover:bg-amber-400"
              disabled={
                (!isCustomTime &&
                  selectedTime === training.time &&
                  selectedDate === training.date) ||
                (isCustomTime && !isValidTimeFormat(customTime))
              }
            >
              Change Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  const initializeGoogleApi = () => {
    gapi.load("client:auth2", () => {
      gapi.client
        .init({
          apiKey: GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/calendar.events",
        })
        .then(() => {
          console.log("Google API initialized");
        })
        .catch((error) => {
          console.error("Error initializing Google API:", error);
        });
    });
  };

  const handleGoogleSync = async () => {
    try {
      // Check if user is signed in
      if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        await gapi.auth2.getAuthInstance().signIn();
      }

      // Convert trainings to Google Calendar events
      const events = trainings
        .filter((training) => training.status === "approved")
        .map((training) => {
          const startDateTime = `${training.date}T${training.time}:00`;
          const endDateTime = `${training.date}T${
            training.time.split(":")[0]
          }:50:00`; // Assuming 50 min duration

          return {
            summary: `Shooting Training - ${training.name}`,
            location: "Your Location",
            description: `Training session for ${training.name}\nPhone: ${training.phone}\nEmail: ${training.email}`,
            start: {
              dateTime: startDateTime,
              timeZone: "Your/Timezone", // e.g. 'Europe/London'
            },
            end: {
              dateTime: endDateTime,
              timeZone: "Your/Timezone",
            },
          };
        });

      // Batch create events
      for (const event of events) {
        await gapi.client.calendar.events.insert({
          calendarId: CALENDAR_ID,
          resource: event,
        });
      }

      alert("Successfully synced with Google Calendar!");
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      alert("Error syncing with Google Calendar. Please try again.");
    }
  };

  // Add useEffect to initialize Google API
  useEffect(() => {
    initializeGoogleApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-gray-800 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded ${
              activeTab === "requests"
                ? "bg-amber-500 text-gray-900"
                : "bg-gray-800 text-white"
            }`}
          >
            Pending {requests.length > 0 && `(${requests.length})`}
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded ${
              activeTab === "schedule"
                ? "bg-amber-500 text-gray-900"
                : "bg-gray-800 text-white"
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("dates")}
            className={`px-4 py-2 rounded ${
              activeTab === "dates"
                ? "bg-amber-500 text-gray-900"
                : "bg-gray-800 text-white"
            }`}
          >
            Dates
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`px-4 py-2 rounded ${
              activeTab === "images"
                ? "bg-amber-500 text-gray-900"
                : "bg-gray-800 text-white"
            }`}
          >
            Hero Images
          </button>
        </div>

        {activeTab === "dates" ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl text-white">Manage Dates</h2>
              <button
                onClick={handleQuickSchedule}
                className="w-full sm:w-auto bg-amber-500 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-amber-400 transition-colors"
              >
                Add Next 10 Days
              </button>
            </div>

            <form
              onSubmit={handleAddDate}
              className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-8"
            >
              <h2 className="text-xl text-white mb-4">Add Date</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Time Slots</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <label
                        key={slot}
                        className="flex items-center text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSlots.includes(slot)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSlots([...selectedSlots, slot]);
                            } else {
                              setSelectedSlots(
                                selectedSlots.filter((s) => s !== slot)
                              );
                            }
                          }}
                          className="mr-2"
                        />
                        {slot}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 w-full sm:w-auto bg-amber-500 text-gray-900 px-6 py-2 rounded font-semibold"
              >
                Add Date
              </button>
            </form>

            {/* Available Dates List */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-white">Available Dates</h2>
                {dates.length > 0 && (
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Delete All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {dates.map((date) => (
                  <div key={date.id} className="bg-gray-700 p-4 rounded">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-white font-semibold">{date.date}</p>
                      <button
                        onClick={() => handleDeleteDate(date.id)}
                        className="text-red-500 hover:text-red-400 text-sm"
                      >
                        Delete Day
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {date.slots.map((slot) => (
                        <div
                          key={slot}
                          className="bg-gray-800 px-3 py-1 rounded flex items-center gap-2"
                        >
                          <span className="text-gray-300">{slot}</span>
                          <button
                            onClick={() => handleDeleteTimeSlot(date.id, slot)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {dates.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    No available dates
                  </p>
                )}
              </div>
            </div>
          </>
        ) : activeTab === "schedule" ? (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white">Training Schedule</h2>
              <GoogleCalendarSetup />
            </div>

            <div className="space-y-6 min-w-[300px]">
              {Object.entries(
                trainings.reduce((acc, training) => {
                  const date = training.date;
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(training);
                  return acc;
                }, {} as Record<string, TrainingRequest[]>)
              )
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, dayTrainings]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-lg text-white font-medium border-b border-gray-700 pb-2">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="grid gap-3">
                      {dayTrainings
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((training) => (
                          <div
                            key={training.id}
                            className="p-4 rounded-lg bg-green-900/20 border border-green-500/30"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">
                                  {training.time}
                                </p>
                                <p className="text-gray-300">{training.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {training.phone}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="inline-block px-2 py-1 rounded text-sm bg-green-500/20 text-green-400">
                                  Approved
                                </span>
                                <button
                                  onClick={() =>
                                    setShowTimeChangeDialog({
                                      training,
                                      newTime: training.time,
                                      newDate: training.date,
                                    })
                                  }
                                  className="text-amber-400 hover:text-amber-300 text-sm"
                                >
                                  Change Schedule
                                </button>
                                <button
                                  onClick={() => setShowCancelDialog(training)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Cancel Training
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : activeTab === "images" ? (
          <HeroImageManager />
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-gray-700 p-4 rounded">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="text-white font-semibold">{request.name}</p>
                      <p className="text-gray-400 text-sm">{request.email}</p>
                      <p className="text-gray-400 text-sm">{request.phone}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-white">{request.date}</p>
                      <p className="text-amber-500">{request.time}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => handleDeclineRequest(request)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveRequest(request)}
                      className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  No pending requests
                </p>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl text-white mb-4">Confirm Delete All</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete all available dates? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl text-white mb-4">Confirm Cancellation</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to cancel the training for{" "}
                {showCancelDialog.name} on{" "}
                {new Date(showCancelDialog.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {showCancelDialog.time}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelDialog(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Keep Training
                </button>
                <button
                  onClick={() => handleCancelTraining(showCancelDialog)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel Training
                </button>
              </div>
            </div>
          </div>
        )}

        {showTimeChangeDialog && <TimeChangeDialog />}
      </div>
    </div>
  );
}
