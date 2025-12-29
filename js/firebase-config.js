import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8mRkzQ_XrKR-IUYWLmMHUDhOUophLX-U",
  authDomain: "smartrent-httt3.firebaseapp.com",
  databaseURL: "https://smartrent-httt3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartrent-httt3",
  storageBucket: "smartrent-httt3.appspot.com",
  messagingSenderId: "758879786728",
  appId: "1:758879786728:web:94cc95552f4211637a9b5d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
