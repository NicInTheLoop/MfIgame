// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA821UkL_YsC8jAWeeBlC-TsOE4m7mC6TI",
  authDomain: "mfigame-48c52.firebaseapp.com",
  databaseURL: "https://mfigame-48c52-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mfigame-48c52",
  storageBucket: "mfigame-48c52.firebasestorage.app",
  messagingSenderId: "924931703532",
  appId: "1:924931703532:web:7917661766a1f763b2dbc9",
  measurementId: "G-FXBJEP5SP1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Attach Firestore DB globally for debugging
window.db = db;
console.log("✅ Firebase Firestore initialized:", window.db);

// Export db for use in other scripts
export { db };

