import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const CHARACTERS_COLLECTION = 'characters';

export async function getCharacter(accountId, medId) {
  const docRef = doc(db, CHARACTERS_COLLECTION, `${accountId}_${medId}`);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function saveCharacter(characterData) {
  const docId = `${characterData.account_id}_${characterData.med_id}`;
  const docRef = doc(db, CHARACTERS_COLLECTION, docId);
  
  await setDoc(docRef, {
    account_id: characterData.account_id,
    med_id: characterData.med_id,
    med_name: characterData.med_name,
    med_desc: characterData.med_desc,
    streak: characterData.streak,
    sprite_base64: characterData.sprite_base64,
    feature_1: characterData.feature_1,
    feature_2: characterData.feature_2,
    feature_3: characterData.feature_3,
    feature_1_reason: characterData.feature_1_reason,
    feature_2_reason: characterData.feature_2_reason,
    feature_3_reason: characterData.feature_3_reason,
    hp: characterData.hp,
    attack: characterData.attack,
    scale: characterData.scale,
    created_at: new Date().toISOString()
  });
  
  return docId;
}

export async function updateCharacterStats(accountId, medId, streak, hp, attack, scale) {
  const docId = `${accountId}_${medId}`;
  const docRef = doc(db, CHARACTERS_COLLECTION, docId);
  
  await updateDoc(docRef, {
    streak: streak,
    hp: hp,
    attack: attack,
    scale: scale,
    updated_at: new Date().toISOString()
  });
}
