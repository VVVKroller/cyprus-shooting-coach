import React, { useEffect, useState } from "react";
import {
  format,
  parse,
  isAfter,
  isBefore,
  startOfDay,
  parseISO,
  addHours,
} from "date-fns";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useTranslation } from "react-i18next";

// Function to immediately delete all passed approved requests
const deletePassedApprovedRequests = async () => {
  try {
    const today = startOfDay(new Date());
    const requestsRef = collection(db, "trainingRequests");
    const q = query(requestsRef, where("status", "==", "approved"));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs
      .filter((document) => {
        const trainingDate = parseISO(document.data().date);
        return isBefore(trainingDate, today);
      })
      .map(async (document) => {
        console.log(
          `Deleting passed approved request for date: ${document.data().date}`
        );
        await deleteDoc(document.ref);
      });

    await Promise.all(deletePromises);
    console.log("Finished cleaning up passed approved requests");
  } catch (error) {
    console.error("Error deleting passed approved requests:", error);
  }
};

// Function to immediately delete all existing passed dates
const deleteExistingPassedDates = async () => {
  try {
    const today = startOfDay(new Date());
    const datesRef = collection(db, "availableDates");
    const querySnapshot = await getDocs(datesRef);

    const deletePromises = querySnapshot.docs
      .filter((document) => {
        const dateStr = document.data().date;
        const date = parseISO(dateStr);
        return isBefore(date, today);
      })
      .map(async (document) => {
        console.log(`Deleting existing passed date: ${document.data().date}`);
        await deleteDoc(document.ref);
      });

    await Promise.all(deletePromises);
    console.log("Finished cleaning up existing passed dates");
  } catch (error) {
    console.error("Error deleting existing passed dates:", error);
  }
};

// Function to immediately delete all existing declined requests
const deleteExistingDeclinedRequests = async () => {
  try {
    const requestsRef = collection(db, "trainingRequests");
    const q = query(requestsRef, where("status", "==", "declined"));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map(async (document) => {
      console.log(`Deleting existing declined request: ${document.id}`);
      await deleteDoc(document.ref);
    });

    await Promise.all(deletePromises);
    console.log("Finished cleaning up existing declined requests");
  } catch (error) {
    console.error("Error deleting existing declined requests:", error);
  }
};

// Execute all cleanups immediately
Promise.all([
  deleteExistingPassedDates(),
  deleteExistingDeclinedRequests(),
  deletePassedApprovedRequests(),
]).then(() => {
  console.log("Initial cleanup completed");
});

interface TimeSlotsProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onTimeSelect: (time: string | null) => void;
}

export default function TimeSlots({
  selectedDate,
  selectedTime,
  onTimeSelect,
}: TimeSlotsProps) {
  const { t } = useTranslation();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Set up real-time listener for approved requests that have passed
  useEffect(() => {
    const requestsRef = collection(db, "trainingRequests");
    const q = query(requestsRef, where("status", "==", "approved"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const today = startOfDay(new Date());

      for (const doc of snapshot.docs) {
        try {
          const trainingDate = parseISO(doc.data().date);
          if (isBefore(trainingDate, today)) {
            console.log(
              `Deleting passed approved request for date: ${doc.data().date}`
            );
            await deleteDoc(doc.ref);
          }
        } catch (error) {
          console.error("Error deleting passed approved request:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for declined requests
  useEffect(() => {
    const requestsRef = collection(db, "trainingRequests");
    const q = query(requestsRef, where("status", "==", "declined"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const doc of snapshot.docs) {
        try {
          console.log(`Deleting declined request: ${doc.id}`);
          await deleteDoc(doc.ref);
        } catch (error) {
          console.error("Error deleting declined request:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Clean up declined requests
  const cleanupDeclinedRequests = async () => {
    try {
      const requestsRef = collection(db, "trainingRequests");
      const q = query(requestsRef, where("status", "==", "declined"));
      const querySnapshot = await getDocs(q);

      for (const document of querySnapshot.docs) {
        console.log(`Deleting declined request: ${document.id}`);
        await deleteDoc(document.ref);
      }
    } catch (error) {
      console.error("Error cleaning up declined requests:", error);
    }
  };

  // Clean up passed dates
  const cleanupPassedDates = async () => {
    try {
      const today = startOfDay(new Date());
      const datesRef = collection(db, "availableDates");
      const querySnapshot = await getDocs(datesRef);

      for (const document of querySnapshot.docs) {
        const dateStr = document.data().date;
        const date = parseISO(dateStr);

        if (isBefore(date, today)) {
          console.log(`Deleting passed date: ${dateStr}`);
          await deleteDoc(document.ref);
        }
      }
    } catch (error) {
      console.error("Error cleaning up passed dates:", error);
    }
  };

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoading(true);
      try {
        // Clean up passed dates and declined requests first
        await Promise.all([cleanupPassedDates(), cleanupDeclinedRequests()]);

        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const q = query(
          collection(db, "availableDates"),
          where("date", "==", formattedDate)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          let slots = doc.data().slots || [];

          // Filter out passed times and times within next hour
          const now = new Date();
          const oneHourFromNow = addHours(now, 1);
          const currentDate = new Date();
          const isToday = format(currentDate, "yyyy-MM-dd") === formattedDate;

          if (isToday) {
            // Filter and update slots
            const validSlots = slots.filter((timeStr: string) => {
              const timeDate = parse(timeStr, "HH:mm", selectedDate);
              return isAfter(timeDate, oneHourFromNow);
            });

            // If some slots were filtered out, update the document
            if (validSlots.length !== slots.length) {
              if (validSlots.length === 0) {
                // If no valid slots remain, delete the entire document
                await deleteDoc(doc.ref);
              } else {
                // Otherwise, update with remaining valid slots
                await updateDoc(doc.ref, {
                  slots: validSlots.sort(),
                });
              }
            }

            slots = validSlots;
          }

          setAvailableSlots(slots.sort());
        } else {
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setAvailableSlots([]);
      }
      setLoading(false);
    };

    fetchAvailableSlots();
  }, [selectedDate]);

  if (!selectedDate) {
    return (
      <p className="text-gray-400 text-center">
        {t("contact.form.calendar.selectDate")}
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-gray-400 text-center">
        {t("contact.form.calendar.loadingTimes")}
      </p>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <p className="text-gray-400 text-center">
        {t("contact.form.calendar.noSlots")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {availableSlots.map((time) => (
        <button
          key={time}
          onClick={(e) => {
            e.preventDefault();
            onTimeSelect(time);
          }}
          type="button"
          className={`py-2 px-4 rounded-md border transition-colors ${
            selectedTime === time
              ? "bg-amber-500 text-gray-900 border-amber-600"
              : "bg-gray-800 border-gray-700 text-gray-300 hover:border-amber-500"
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  );
}
