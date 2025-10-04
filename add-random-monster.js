import * as fs from 'node:fs';
import path from 'node:path';
import { generateFeatures, generateCharacterSprite } from './sprite-generator.js';
import { saveMonster } from './firebase-utils.js';

async function getRandomEntry() {
  const entriesPath = path.resolve('./entries.json');
  const entriesData = fs.readFileSync(entriesPath, 'utf-8');
  const entries = JSON.parse(entriesData);
  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
}

async function main() {
  try {
    console.log('🔍 Selecting a random entry from entries.json...');
    const entry = await getRandomEntry();
    console.log(`🎲 Selected: ${entry.med_name} (account: ${entry.account_id})`);

    console.log('🧠 Generating features via AI...');
    const features = await generateFeatures(entry.med_name, entry.med_desc);

    console.log('🎨 Generating sprite via AI (this may take a while)...');
    const spriteResult = await generateCharacterSprite(entry, entry.account_id);

    const monsterDoc = {
      account_id: entry.account_id,
      med_id: entry.med_id,
      med_name: entry.med_name,
      med_desc: entry.med_desc,
      streak: entry.streak,
      feature_1: features.feature_1,
      feature_2: features.feature_2,
      feature_3: features.feature_3,
      feature_1_reason: features.feature_1_reason,
      feature_2_reason: features.feature_2_reason,
      feature_3_reason: features.feature_3_reason,
      sprite_url: spriteResult.base64 // store data URL directly
    };

    console.log('💾 Saving monster document to Firestore...');
    const docId = await saveMonster(monsterDoc);
    console.log(`✅ Monster saved with document id: ${docId}`);
  } catch (error) {
    console.error('❌ Error adding monster:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
