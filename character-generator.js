import * as fs from 'node:fs';
import { getCharacter, saveCharacter, updateCharacterStats } from './firebase-utils.js';
import { calculateHP, calculateAttack, calculateScale, shouldUpdateStats } from './stat-calculator.js';
import { generateFeatures, generateCharacterSprite } from './sprite-generator.js';

export async function loadOrCreateCharacter(entryData) {
  const { account_id, med_id, med_name, med_desc, streak } = entryData;
  
  console.log(`🔍 Checking Firebase for character: ${account_id}_${med_id}`);
  
  let character = await getCharacter(account_id, med_id);
  
  if (character) {
    console.log(`✅ Found existing character: ${character.med_name}`);
    
    if (shouldUpdateStats(character.streak, streak)) {
      console.log(`📊 Streak changed, updating stats...`);
      const newHP = calculateHP(streak);
      const newAttack = calculateAttack(streak);
      const newScale = calculateScale(streak);
      
      await updateCharacterStats(account_id, med_id, streak, newHP, newAttack, newScale);
      
      character.streak = streak;
      character.hp = newHP;
      character.attack = newAttack;
      character.scale = newScale;
      
      console.log(`✅ Stats updated: HP=${newHP}, ATK=${newAttack}, Scale=${newScale}`);
    } else {
      console.log(`✅ Stats still valid for current streak`);
    }
    
    return character;
  }
  
  console.log(`🆕 Character not found, creating new one...`);
  
  const features = await generateFeatures(med_name, med_desc);
  
  const sprite = await generateCharacterSprite(entryData, account_id);
  
  const hp = calculateHP(streak);
  const attack = calculateAttack(streak);
  const scale = calculateScale(streak);
  
  const newCharacter = {
    account_id,
    med_id,
    med_name,
    med_desc,
    streak,
    sprite_base64: sprite.base64,
    feature_1: features.feature_1,
    feature_2: features.feature_2,
    feature_3: features.feature_3,
    feature_1_reason: features.feature_1_reason,
    feature_2_reason: features.feature_2_reason,
    feature_3_reason: features.feature_3_reason,
    hp,
    attack,
    scale
  };
  
  await saveCharacter(newCharacter);
  
  console.log(`✅ Character created and saved to Firebase!`);
  console.log(`   HP: ${hp}, Attack: ${attack}, Scale: ${scale}`);
  console.log(`   Features: ${features.feature_1}, ${features.feature_2}, ${features.feature_3}`);
  
  return newCharacter;
}

export function getRandomEntry() {
  const entriesPath = './entries.json';
  const entriesData = fs.readFileSync(entriesPath, 'utf-8');
  const entries = JSON.parse(entriesData);
  
  const randomIndex = Math.floor(Math.random() * entries.length);
  const selectedEntry = entries[randomIndex];
  
  console.log(`🎲 Randomly selected: ${selectedEntry.med_name} (Account: ${selectedEntry.account_id})`);
  
  return selectedEntry;
}

export async function initializeCharacter() {
  console.log('🚀 Medication Gamification - Character Initialization');
  console.log('=====================================================\n');
  
  const entry = getRandomEntry();
  
  const character = await loadOrCreateCharacter(entry);
  
  console.log('\n✨ Character ready for battle!');
  console.log('=====================================');
  console.log(`Name: ${character.med_name}`);
  console.log(`HP: ${character.hp}`);
  console.log(`Attack: ${character.attack}`);
  console.log(`Scale: ${character.scale}x`);
  console.log(`Features: ${character.feature_1}, ${character.feature_2}, ${character.feature_3}`);
  console.log(`Sprite: ${character.sprite_base64 ? 'Base64 encoded (in Firestore)' : 'Not available'}`);
  console.log('=====================================\n');
  
  return character;
}
