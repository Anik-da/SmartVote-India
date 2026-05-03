import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7qemx31vboXKguwrPP2rtp9YsNgkWFNk",
    authDomain: "smart-maintenance-494503.firebaseapp.com",
    projectId: "smart-maintenance-494503",
    storageBucket: "smart-maintenance-494503.firebasestorage.app",
    messagingSenderId: "812446110775",
    appId: "1:812446110775:web:55cf4badd4dc7c19829bb2",
    measurementId: "G-B34JEHQYYY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
