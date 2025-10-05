import { syncMedicationsToFirestore } from './medication-sync';

export type DoseEvent = { id: string; medId: string; when: number; who: "parent"|"child" };
export function medsKey(uid: string){ return `meds:${uid}`; }
export function loadMeds(uid: string){ try{ return JSON.parse(localStorage.getItem(medsKey(uid))||"[]"); }catch{ return []; } }
export async function saveMeds(uid: string, meds: any){ 
  localStorage.setItem(medsKey(uid), JSON.stringify(meds)); 
  // Auto-sync to Firestore for Cloud Functions
  try {
    await syncMedicationsToFirestore(meds);
  } catch (error) {
    console.warn('Failed to sync medications to Firestore:', error);
    // Continue even if sync fails - localStorage is source of truth
  }
}
export function eventsKey(uid: string){ return `doseEvents:${uid}`; }
export function pushEvent(uid: string, e: DoseEvent){ const arr = loadEvents(uid); arr.push(e); localStorage.setItem(eventsKey(uid), JSON.stringify(arr)); }
export function loadEvents(uid: string): DoseEvent[]{ try{ return JSON.parse(localStorage.getItem(eventsKey(uid))||"[]"); }catch{ return []; } }