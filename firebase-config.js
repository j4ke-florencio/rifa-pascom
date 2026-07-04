import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTHRO81uatDghlOuFJ5xPFvUxHjlWN5-U",
    authDomain: "rifa-pascom.firebaseapp.com",
    projectId: "rifa-pascom",
    storageBucket: "rifa-pascom.firebasestorage.app",
    messagingSenderId: "510537541182",
    appId: "1:510537541182:web:f30abe52fd1da34c67536f",
    measurementId: "G-9NZC9Y9D2R"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const dbRef = ref(db, 'rifa_pascom_dados/');