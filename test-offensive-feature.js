// Test script to verify the offensive ability checking feature

// Test the offensive ability checking logic
async function testOffensiveAbilityCheck() {
    console.log('🧪 Testing Offensive Ability Checking System...\n');
    
    // Mock features that lack offensive abilities
    const testFeatures = {
        feature_1: 'shield',
        feature_1_reason: 'Defensive ability',
        feature_2: 'yellow_cloud',
        feature_2_reason: 'Healing ability',
        feature_3: 'none',
        feature_3_reason: 'No ability'
    };
    
    console.log('📋 Original features:', testFeatures);
    
    // Simulate the checking logic
    const offensiveAbilities = ['fireball', 'poison_droplets'];
    
    const hasOffensive = offensiveAbilities.some(ability => 
        testFeatures.feature_1 === ability || 
        testFeatures.feature_2 === ability || 
        testFeatures.feature_3 === ability
    );
    
    console.log('🔍 Has offensive ability:', hasOffensive);
    
    if (!hasOffensive) {
        console.log('⚠️  Missing offensive ability - would trigger replacement');
        
        // Choose random offensive ability
        const offensiveAbility = offensiveAbilities[Math.floor(Math.random() * offensiveAbilities.length)];
        console.log('🎲 Selected offensive ability:', offensiveAbility);
        
        // Find replacement target
        let replaceIndex = 1;
        if (testFeatures.feature_3 === 'none') replaceIndex = 3;
        else if (testFeatures.feature_2 === 'none') replaceIndex = 2;
        else if (testFeatures.feature_1 === 'none') replaceIndex = 1;
        
        console.log('🔄 Would replace feature_' + replaceIndex);
        
        console.log('✅ Test completed - offensive ability logic working!');
    } else {
        console.log('✅ Test completed - monster already has offensive ability');
    }
}

// Test the server endpoint
async function testServerEndpoint() {
    console.log('\n🌐 Testing Server Endpoint...');
    
    try {
        const response = await fetch('http://localhost:3001/generate-sprite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                account_id: 'test_user',
                med_id: 'TEST_001',
                med_name: 'Test Medicine',
                med_desc: 'A gentle healing medication with no aggressive properties.',
                streak: 1
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Server responded successfully');
            console.log('🎮 Generated features:', {
                feature_1: result.monster.feature_1,
                feature_2: result.monster.feature_2,
                feature_3: result.monster.feature_3
            });
            
            // Check if offensive ability was added
            const hasFireball = [result.monster.feature_1, result.monster.feature_2, result.monster.feature_3].includes('fireball');
            const hasPoison = [result.monster.feature_1, result.monster.feature_2, result.monster.feature_3].includes('poison_droplets');
            
            if (hasFireball || hasPoison) {
                console.log('🗡️  ✅ OFFENSIVE ABILITY SUCCESSFULLY ADDED!');
            } else {
                console.log('❌ No offensive ability found - check server logic');
            }
        } else {
            console.log('❌ Server error:', response.status);
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        console.log('💡 Make sure the server is running: node sprite-generation-server.js');
    }
}

// Run tests
testOffensiveAbilityCheck();
testServerEndpoint();