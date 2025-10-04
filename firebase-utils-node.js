import { db } from './firebase-config-node.js';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const MONSTERS_COLLECTION = 'monsters';

export async function getMonster(accountId, medId) {
  const docRef = doc(db, MONSTERS_COLLECTION, `${accountId}_${medId}`);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function saveMonster(monsterData) {
  const docId = `${monsterData.account_id}_${monsterData.med_id}`;
  const docRef = doc(db, MONSTERS_COLLECTION, docId);

  await setDoc(docRef, {
    account_id: monsterData.account_id,
    med_id: monsterData.med_id,
    med_name: monsterData.med_name,
    med_desc: monsterData.med_desc,
    streak: monsterData.streak,
    feature_1: monsterData.feature_1,
    feature_2: monsterData.feature_2,
    feature_3: monsterData.feature_3,
    feature_1_reason: monsterData.feature_1_reason,
    feature_2_reason: monsterData.feature_2_reason,
    feature_3_reason: monsterData.feature_3_reason,
    sprite_url: monsterData.sprite_url,
    created_at: new Date().toISOString()
  });

  return docId;
}
