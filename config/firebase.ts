import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAKjyluVJdmArLaHshZUTc8-7DLXhF9H_o",
  authDomain: "radia-4bcc4.firebaseapp.com",
  projectId: "radia-4bcc4",
  storageBucket: "radia-4bcc4.firebasestorage.app",
  messagingSenderId: "992028180323",
  appId: "1:992028180323:web:7bfc46ab939bf769391d56",
  measurementId: "G-7PD3MQ6WF9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics = Platform.OS === 'web' ? getAnalytics(app) : null;

export default app;
