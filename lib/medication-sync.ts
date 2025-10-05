import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBKeLntfFEDxdZGUfhtdUKvl58WrHt6TdM",
  authDomain: "medication-gamification.firebaseapp.com",
  projectId: "medication-gamification",
  storageBucket: "medication-gamification.firebasestorage.app",
  messagingSenderId: "164714302991",
  appId: "1:164714302991:web:e6cbb642539dc93cdcdd7a",
  measurementId: "G-VE9ZC0KSEG"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const functions = getFunctions(app);

/**
 * Sync medications to Firestore for Cloud Functions to access
 */
export async function syncMedicationsToFirestore(medications: any[]) {
  try {
    const syncMedications = httpsCallable(functions, 'syncMedications');
    const result = await syncMedications({ medications });
    console.log('✅ Medications synced to Firestore:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error syncing medications:', error);
    throw error;
  }
}
