import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAX6Un7swuFxcLthB_IgM_1nQl6C6j273Q",
  authDomain: "cyprus-shooting-coach.firebaseapp.com",
  projectId: "cyprus-shooting-coach",
  storageBucket: "cyprus-shooting-coach.appspot.com",
  messagingSenderId: "136988486520",
  appId: "1:136988486520:web:7cf019a5dd7d8b14ebf68d",
  measurementId: "G-9NK2L7B9CJ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;
export const storage = getStorage(app);
