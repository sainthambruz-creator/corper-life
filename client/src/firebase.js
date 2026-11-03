import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeZi1Rg2UYz9qF3hIDP9Qsxd_HP1rsCTU",
  authDomain: "corper-life.firebaseapp.com",
  projectId: "corper-life",
  storageBucket: "corper-life.firebasestorage.app",
  messagingSenderId: "217250835201",
  appId: "1:217250835201:web:a761758aa552f583d70900"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);