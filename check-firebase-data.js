/**
 * Script to check Firebase Firestore data and Storage
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const db = admin.firestore();
const storage = admin.storage();

async function checkFirebaseData() {
    console.log('🔍 Checking Firebase Firestore and Storage...\n');
    
    try {
        // Check Firestore collections
        console.log('📊 FIRESTORE DATABASE:');
        console.log('='.repeat(50));
        
        // List all collections
        const collections = await db.listCollections();
        console.log(`Found ${collections.length} collections:`);
        
        for (const collection of collections) {
            console.log(`\n📁 Collection: ${collection.id}`);
            
            if (collection.id === 'models') {
                // Get all models
                const snapshot = await collection.get();
                console.log(`   Total documents: ${snapshot.size}`);
                
                if (snapshot.size > 0) {
                    console.log('   Sample documents:');
                    let count = 0;
                    snapshot.forEach(doc => {
                        if (count < 3) { // Show first 3 models
                            const data = doc.data();
                            console.log(`   • ${doc.id}: ${data.personalInfo?.name || 'No name'} (status: ${data.status})`);
                            console.log(`     - Thumbnail: ${data.portfolio?.thumbnailUrl ? '✅' : '❌'}`);
                            console.log(`     - Categories: ${data.personalInfo?.categories?.join(', ') || 'None'}`);
                            count++;
                        }
                    });
                    
                    if (snapshot.size > 3) {
                        console.log(`   ... and ${snapshot.size - 3} more models`);
                    }
                    
                    // Check model statuses
                    const activeModels = await collection.where('status', '==', 'active').get();
                    const pendingModels = await collection.where('status', '==', 'pending').get();
                    console.log(`   Active models: ${activeModels.size}`);
                    console.log(`   Pending models: ${pendingModels.size}`);
                }
            } else {
                // For other collections, just count
                const snapshot = await collection.get();
                console.log(`   Total documents: ${snapshot.size}`);
            }
        }
        
        console.log('\n');
        console.log('💾 FIREBASE STORAGE:');
        console.log('='.repeat(50));
        
        // Check Storage buckets
        const [buckets] = await storage.getBuckets();
        console.log(`Found ${buckets.length} storage buckets:`);
        
        for (const bucket of buckets) {
            console.log(`\n🪣 Bucket: ${bucket.name}`);
            
            // List files in bucket
            const [files] = await bucket.getFiles({ maxResults: 10 });
            console.log(`   Files found: ${files.length} (showing max 10)`);
            
            files.forEach(file => {
                console.log(`   • ${file.name} (${Math.round(file.metadata.size / 1024)}KB)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking Firebase data:', error);
    }
}

checkFirebaseData().then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});