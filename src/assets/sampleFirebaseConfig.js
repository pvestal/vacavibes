// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithPopup , GoogleAuthProvider as googleProvider} from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "FROM GOOGLE CLOUD CONSOLE",
  authDomain: "FROM GOOGLE CLOUD CONSOLE",
  projectId: "FROM GOOGLE CLOUD CONSOLE",
  storageBucket: "FROM GOOGLE CLOUD CONSOLE",
  messagingSenderId: "FROM GOOGLE CLOUD CONSOLE",
  appId: "FROM GOOGLE CLOUD CONSOLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, signInWithPopup, googleProvider};