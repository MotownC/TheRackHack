import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC22Pxr1LuOeL3zH5TXhXsJFNlm5IV1fA8",
  authDomain: "the-rack-hack.firebaseapp.com",
  projectId: "the-rack-hack",
  storageBucket: "the-rack-hack.firebasestorage.app",
  messagingSenderId: "894889052388",
  appId: "1:894889052388:web:c6f155746f6ebbd950c4f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;