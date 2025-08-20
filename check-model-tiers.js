/**
 * Script to check model tier distribution
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const db = admin.firestore();

async function checkModelTiers() {
    console.log('🔍 Checking model tier distribution...\n');
    
    try {
        const snapshot = await db.collection('models').where('status', '==', 'active').get();
        console.log(`Found ${snapshot.size} active models\n`);
        
        let basicCount = 0;
        let premiumCount = 0;
        let noTierCount = 0;
        
        console.log('Model Tier Analysis:');
        console.log('='.repeat(80));
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const tier = data.tier;
            const name = data.personalInfo?.name || 'No name';
            
            if (!tier) {
                noTierCount++;
                console.log(`📝 ${doc.id} (${name}) - NO TIER`);
            } else if (tier === 'basic') {
                basicCount++;
                console.log(`🟢 ${doc.id} (${name}) - BASIC`);
            } else if (tier === 'premium') {
                premiumCount++;
                console.log(`⭐ ${doc.id} (${name}) - PREMIUM`);
            } else {
                console.log(`❓ ${doc.id} (${name}) - ${tier.toUpperCase()}`);
            }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`Summary:`);
        console.log(`• Basic models: ${basicCount}`);
        console.log(`• Premium models: ${premiumCount}`);
        console.log(`• No tier (undefined): ${noTierCount}`);
        console.log(`• Total active: ${snapshot.size}`);
        
        console.log(`\n🔧 Current filtering logic: showing models where (!tier || tier === 'basic')`);
        console.log(`📊 Models that would be shown: ${basicCount + noTierCount}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkModelTiers().then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});