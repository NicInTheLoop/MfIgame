// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA821UkL_YsC8jAWeeBlC-TsOE4m7mC6TI",
  authDomain: "mfigame-48c52.firebaseapp.com",
  databaseURL: "https://mfigame-48c52-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mfigame-48c52",
  storageBucket: "mfigame-48c52.appspot.com",
  messagingSenderId: "1048612426840",
  appId: "1:1048612426840:web:0c3c6e8b9b8b8b8b8b8b8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
