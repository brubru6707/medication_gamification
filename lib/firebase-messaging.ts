import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKeLntfFEDxdZGUfhtdUKvl58WrHt6TdM",
  authDomain: "medication-gamification.firebaseapp.com",
  projectId: "medication-gamification",
  storageBucket: "medication-gamification.firebasestorage.app",
  messagingSenderId: "164714302991",
  appId: "1:164714302991:web:e6cbb642539dc93cdcdd7a",
  measurementId: "G-VE9ZC0KSEG"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Note: You'll need to get your VAPID key from Firebase Console
// Go to: Project Settings > Cloud Messaging > Web Push certificates
// Generate a new key pair if you don't have one
const VAPID_KEY = "YOUR_VAPID_KEY_HERE"; // TODO: Replace with actual VAPID key from Firebase Console

let messaging: any = null;

// Initialize messaging only in browser environment
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase messaging initialization error:", error);
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestFCMToken(userId: string): Promise<string | null> {
  if (!messaging) {
    console.log("Messaging not supported in this browser");
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Service Worker registered:", registration);

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("FCM Token:", token);
      
      // Save token to Firestore
      await saveFCMToken(userId, token);
      
      return token;
    } else {
      console.log("No FCM token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Save FCM token to Firestore for user
 */
async function saveFCMToken(userId: string, token: string) {
  try {
    const db = getFirestore(app);
    const userRef = doc(db, "users", userId);
    
    await setDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("FCM token saved to Firestore");
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

/**
 * Check if FCM is supported
 */
export function isFCMSupported(): boolean {
  return messaging !== null && "Notification" in window && "serviceWorker" in navigator;
}
