// Test file to debug export issues

export async function generateFeatures(medName, medDesc) {
  return {
    feature_1: "fireball",
    feature_1_reason: "Test",
    feature_2: "shield",
    feature_2_reason: "Test",
    feature_3: "poison_droplets",
    feature_3_reason: "Test"
  };
}

export async function generateCharacterSprite(medData, accountId) {
  return {
    localPath: "test.png",
    base64: "data:image/png;base64,test"
  };
}

console.log('sprite-generator-simple.js loaded successfully');
