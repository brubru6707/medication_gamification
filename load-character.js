import { initializeCharacter } from './character-generator.js';

async function main() {
  try {
    const character = await initializeCharacter();
    
    console.log('💡 To use this character in your game:');
    console.log(`   1. Load sprite from base64: character.sprite_base64`);
    console.log(`   2. Set character HP to: ${character.hp}`);
    console.log(`   3. Set character attack to: ${character.attack}`);
    console.log(`   4. Set sprite scale to: ${character.scale}`);
    console.log(`   5. Available features: ${character.feature_1}, ${character.feature_2}, ${character.feature_3}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize character:', error);
  }
}

main();
