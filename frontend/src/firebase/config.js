// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Replace these values with your Firebase project configuration
// You can find these values in your Firebase project settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

/*
SETUP INSTRUCTIONS:
1. Go to https://console.firebase.google.com/
2. Create a new project (or use an existing one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section and click the web icon (</>)
5. Register your app with a nickname
6. Copy the firebaseConfig object and replace the values above
7. Go to "Storage" in the Firebase console
8. Set up Storage with appropriate rules (start in test mode for development)
9. Update the rules to allow read/write access as needed
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage, app };
