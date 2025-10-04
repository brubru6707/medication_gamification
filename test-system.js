import { getRandomEntry } from './character-generator.js';
import { calculateHP, calculateAttack, calculateScale } from './stat-calculator.js';

console.log('🧪 Testing Character System...\n');

console.log('1️⃣ Testing Random Entry Selection:');
const entry = getRandomEntry();
console.log('   Selected:', entry.med_name);
console.log('   Streak:', entry.streak, 'days\n');

console.log('2️⃣ Testing Stat Calculations:');
const hp = calculateHP(entry.streak);
const attack = calculateAttack(entry.streak);
const scale = calculateScale(entry.streak);
console.log('   HP:', hp);
console.log('   Attack:', attack);
console.log('   Scale:', scale + 'x\n');

console.log('3️⃣ Testing Different Streak Levels:');
const testStreaks = [0, 30, 90, 120, 240, 365];
testStreaks.forEach(streak => {
  const months = (streak / 30).toFixed(1);
  console.log(`   ${streak} days (${months} months):`);
  console.log(`     HP: ${calculateHP(streak)}`);
  console.log(`     ATK: ${calculateAttack(streak)}`);
  console.log(`     Scale: ${calculateScale(streak)}x`);
});

console.log('\n✅ Basic tests complete!');
console.log('\n💡 To test full character generation (with Firebase + Gemini):');
console.log('   Run: npm run load-character');
