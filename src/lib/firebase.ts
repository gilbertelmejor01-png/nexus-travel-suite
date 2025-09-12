import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVS9-YdMm4RivVZ3TaGulWyyYy_Ff_M8s",
  authDomain: "proyeclatan.firebaseapp.com",
  projectId: "proyeclatan",
  storageBucket: "proyeclatan.firebasestorage.app",
  messagingSenderId: "850301771174",
  appId: "1:850301771174:web:9c5a59b4f01a9ba5218367"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);