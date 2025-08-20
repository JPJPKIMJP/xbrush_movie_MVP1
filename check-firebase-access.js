/**
 * Script to test Firebase access and security rules
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const db = admin.firestore();

async function checkFirebaseAccess() {
    console.log('🔐 Testing Firebase Access and Security Rules...\n');
    
    try {
        // Test 1: Admin access (should work)
        console.log('1️⃣ Testing Admin SDK access...');
        const adminSnapshot = await db.collection('models').limit(1).get();
        console.log(`✅ Admin access works: Found ${adminSnapshot.size} document(s)`);
        
        // Test 2: Check if client-side would have access
        console.log('\n2️⃣ Checking security rules implications...');
        
        // Try to read a specific document to see structure
        const testDoc = await db.collection('models').limit(1).get();
        if (!testDoc.empty) {
            const model = testDoc.docs[0];
            console.log(`📄 Sample document ID: ${model.id}`);
            console.log(`📊 Document fields: ${Object.keys(model.data()).join(', ')}`);
        }
        
        // Test 3: Check collections that client needs access to
        const collections = ['models', 'users', 'config'];
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).limit(1).get();
                console.log(`✅ Collection '${collectionName}': ${snapshot.size} documents accessible`);
            } catch (error) {
                console.log(`❌ Collection '${collectionName}': ${error.message}`);
            }
        }
        
        console.log('\n🔍 DIAGNOSIS:');
        console.log('If models are not loading on the frontend but admin access works,');
        console.log('the issue is likely Firebase Security Rules blocking client access.');
        console.log('\nClient-side JavaScript runs with user permissions,');
        console.log('while this script runs with admin permissions.');
        
    } catch (error) {
        console.error('❌ Firebase access test failed:', error.message);
    }
}

checkFirebaseAccess().then(() => {
    console.log('\n✅ Access test complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});