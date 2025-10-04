// Browser-compatible Firebase setup for loading monsters
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Embedded entries data (since we can't use fs in browser)
const entries = [
  {
    "account_id": "user_alpha73",
    "med_id": "MED_101A",
    "med_name": "Claritinex Forte",
    "med_desc": "A potent anti-inflammatory. Its **Purity/Clarity** attack manifests as a brilliant, crystalline laser, dealing high, true damage that slices through and ignores any active status effects (debuffs) on the enemy.",
    "streak": 55
  },
  {
    "account_id": "user_beta48",
    "med_id": "MED_202B",
    "med_name": "Nitro-Boost 400mg",
    "med_desc": "A high-octane stimulant. Its **Overload/Burn** attack is a volatile thermal blast, causing extreme burst fire damage but inflicting a temporary 'Fatigue' debuff on the user due to the rapid energy depletion.",
    "streak": 14
  },
  {
    "account_id": "user_gamma22",
    "med_id": "MED_303C",
    "med_name": "Somnilax Ultra",
    "med_desc": "A deep anesthetic. Its **Drain/Lethargy** power projects slow, swirling violet energy tendrils that inflict the 'Sleep' status on the target. The user then absorbs a portion of the target's missing energy as self-healing.",
    "streak": 90
  },
  {
    "account_id": "user_delta65",
    "med_id": "MED_404D",
    "med_name": "Kardio-Guard 80",
    "med_desc": "A dedicated beta-blocker. Its **Block/Barrier** effect materializes a thick, shimmering silver force field that absorbs a massive amount of incoming damage and automatically retaliates with low counter-damage upon being struck.",
    "streak": 21
  },
  {
    "account_id": "user_epsilon91",
    "med_id": "MED_505E",
    "med_name": "Vita-Complex Z",
    "med_desc": "A broad-spectrum multivitamin. Its **Mend/Support** ability releases a warm, pulsing golden aura, instantly removing all negative status effects from the target and providing a continuous, gentle regeneration (HoT) effect.",
    "streak": 365
  },
  {
    "account_id": "user_zeta11",
    "med_id": "MED_206F",
    "med_name": "Ferro-Poison",
    "med_desc": "A synthetic toxin. This **Overload/Burn** attack creates a dense, corrosive green mist that deals high, persistent damage over time (Poison) and significantly lowers the target's armor for the duration.",
    "streak": 7
  },
  {
    "account_id": "user_eta03",
    "med_id": "MED_407G",
    "med_name": "Acu-Shield Pro",
    "med_desc": "An advanced antihistamine. The **Block/Barrier** creates an external 'Shell' of resistance, granting the user immunity to any status effect while the barrier holds, but prevents the user from moving or attacking.",
    "streak": 180
  },
  {
    "account_id": "user_theta88",
    "med_id": "MED_108H",
    "med_name": "Neo-Penicillin 50",
    "med_desc": "A foundational antibiotic. Its **Purity/Clarity** takes the form of rapid, accurate white energy shards that pierce the target's defenses, dealing damage based on the enemy's own maximum health.",
    "streak": 62
  },
  {
    "account_id": "user_iota54",
    "med_id": "MED_309I",
    "med_name": "Tranquil-Haze",
    "med_desc": "A fast-acting sedative mist. The **Drain/Lethargy** deploys a heavy, smoky blue gas that dramatically slows the movement and reaction speed of all enemies caught in its radius, making them an easy target.",
    "streak": 45
  },
  {
    "account_id": "user_kappa33",
    "med_id": "MED_510J",
    "med_name": "Roto-Heal Patch",
    "med_desc": "An emergency dermal patch. This **Mend/Support** move is a powerful, instantaneous burst of green light that provides the highest possible burst healing, immediately stabilizing a critical ally's health.",
    "streak": 30
  }
];

const MONSTERS_COLLECTION = 'monsters';

async function getMonster(accountId, medId) {
  const docRef = doc(db, MONSTERS_COLLECTION, `${accountId}_${medId}`);
  
  // Force fresh data from server, bypassing cache
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

async function saveMonster(monsterData) {
  const docId = `${monsterData.account_id}_${monsterData.med_id}`;
  const docRef = doc(db, MONSTERS_COLLECTION, docId);

  await setDoc(docRef, {
    account_id: monsterData.account_id,
    med_id: monsterData.med_id,
    med_name: monsterData.med_name,
    med_desc: monsterData.med_desc,
    streak: monsterData.streak,
    feature_1: monsterData.feature_1 || 'none',
    feature_2: monsterData.feature_2 || 'none',
    feature_3: monsterData.feature_3 || 'none',
    feature_1_reason: monsterData.feature_1_reason || 'Placeholder',
    feature_2_reason: monsterData.feature_2_reason || 'Placeholder',
    feature_3_reason: monsterData.feature_3_reason || 'Placeholder',
    sprite_url: monsterData.sprite_url || '',
    created_at: new Date().toISOString()
  });

  return docId;
}

function getRandomEntry() {
  const randomIndex = Math.floor(Math.random() * entries.length);
  return entries[randomIndex];
}

async function createRandomMonster() {
  console.log('🔍 Selecting a random entry from embedded data...');
  const entry = getRandomEntry();
  console.log(entry)
  console.log(`🎲 Selected: ${entry.med_name} (account: ${entry.account_id})`);

  console.log('🔎 Checking if monster already exists in Firestore...');
  let monster = await getMonster(entry.account_id, entry.med_id);

  if (monster) {
    console.log(`✅ Found existing monster: ${monster.med_name}`);
    
    if (monster.sprite_url == '') {
      console.log('⚠️  Monster found but sprite is missing or is a placeholder!');
      console.log('� Requesting AI sprite generation from backend...');
      
      try {
        const response = await fetch('http://localhost:3000/generate-sprite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_id: entry.account_id,
            med_id: entry.med_id,
            med_name: entry.med_name,
            med_desc: entry.med_desc,
            streak: entry.streak
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Sprite generated successfully!');
          console.log('🎮 Using newly generated sprite...');
          
          // Return the newly generated monster directly (no reload needed!)
          return result.monster;
        } else {
          console.error('❌ Failed to generate sprite:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling sprite generation backend:', error);
        console.log('⚠️  Make sure the backend server is running:');
        console.log('   Run: node sprite-generation-server.js');
      }
    }
    
    return monster;
  }

  console.log('🆕 Monster not found in Firestore.');
  console.log('🎨 Requesting AI sprite generation from backend...');

  try {
    const response = await fetch('http://localhost:3000/generate-sprite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: entry.account_id,
        med_id: entry.med_id,
        med_name: entry.med_name,
        med_desc: entry.med_desc,
        streak: entry.streak
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Monster and sprite created successfully!');
      console.log('🎮 Loading new sprite into game...');
      
      // Return the monster directly - no need to reload!
      return result.monster;
    } else {
      console.error('❌ Failed to generate sprite:', result.error);
      
      // Create placeholder monster if backend fails
      console.log('⚠️  Creating placeholder monster instead...');
      const placeholderMonster = {
        account_id: entry.account_id,
        med_id: entry.med_id,
        med_name: entry.med_name,
        med_desc: entry.med_desc,
        streak: entry.streak,
        feature_1: 'fireball',
        feature_2: 'shield',
        feature_3: 'yellow_cloud',
        feature_1_reason: 'Default offensive ability',
        feature_2_reason: 'Default defensive ability',
        feature_3_reason: 'Default support ability',
        sprite_url: ''
      };

      await saveMonster(placeholderMonster);
      return placeholderMonster;
    }
  } catch (error) {
    console.error('❌ Error calling sprite generation backend:', error);
    console.log('⚠️  Make sure the backend server is running:');
    console.log('   Run: node sprite-generation-server.js');
    
    // Create placeholder monster if backend is not available
    console.log('⚠️  Creating placeholder monster instead...');
    const placeholderMonster = {
      account_id: entry.account_id,
      med_id: entry.med_id,
      med_name: entry.med_name,
      med_desc: entry.med_desc,
      streak: entry.streak,
      feature_1: 'fireball',
      feature_2: 'shield',
      feature_3: 'yellow_cloud',
      feature_1_reason: 'Default offensive ability',
      feature_2_reason: 'Default defensive ability',
      feature_3_reason: 'Default support ability',
      sprite_url: ''
    };

    await saveMonster(placeholderMonster);
    return placeholderMonster;
  }
}

// Initialize Firebase and create/load a monster
console.log('🚀 Firebase Monster System Initialized');

// Export for use in game.js
window.FirebaseMonsters = {
  createRandomMonster,
  getMonster
};
