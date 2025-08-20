/**
 * Script to check Firebase users and auth configuration
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const auth = admin.auth();
const db = admin.firestore();

async function checkFirebaseUsers() {
    console.log('👥 Checking Firebase Authentication users...\n');
    
    try {
        // List all users
        console.log('1️⃣ Listing all Firebase Auth users...');
        const listUsersResult = await auth.listUsers(1000);
        
        console.log(`Found ${listUsersResult.users.length} total users in Firebase Auth:`);
        
        if (listUsersResult.users.length === 0) {
            console.log('❌ No users found in Firebase Authentication!');
            console.log('This means no one has signed up yet.');
        } else {
            listUsersResult.users.forEach((userRecord, index) => {
                console.log(`\n👤 User ${index + 1}:`);
                console.log(`   Email: ${userRecord.email || 'No email'}`);
                console.log(`   UID: ${userRecord.uid}`);
                console.log(`   Email Verified: ${userRecord.emailVerified}`);
                console.log(`   Disabled: ${userRecord.disabled}`);
                console.log(`   Created: ${new Date(userRecord.metadata.creationTime).toLocaleString()}`);
                console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString() : 'Never'}`);
                console.log(`   Provider: ${userRecord.providerData.map(p => p.providerId).join(', ') || 'password'}`);
            });
        }
        
        // Check users collection in Firestore
        console.log('\n2️⃣ Checking users collection in Firestore...');
        const usersSnapshot = await db.collection('users').get();
        console.log(`Found ${usersSnapshot.size} user documents in Firestore:`);
        
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`   • ${doc.id}: ${data.email || 'No email'} (${data.displayName || 'No name'})`);
        });
        
        // Check if email/password is enabled
        console.log('\n3️⃣ Auth Configuration Analysis:');
        console.log('To enable email/password authentication, go to:');
        console.log('https://console.firebase.google.com/project/xbrush-moviemaker-mvp/authentication/providers');
        console.log('And ensure "Email/Password" provider is enabled.');
        
        console.log('\n4️⃣ Troubleshooting Tips:');
        if (listUsersResult.users.length === 0) {
            console.log('❌ No users exist - someone needs to sign up first');
            console.log('🔧 Solution: Use the registration form to create an account');
        } else {
            console.log('✅ Users exist - check password and email spelling');
            console.log('🔧 If login fails, the password might be incorrect');
        }
        
    } catch (error) {
        console.error('❌ Error checking Firebase users:', error);
        
        if (error.code === 'auth/insufficient-permission') {
            console.log('\n🔧 Permission issue detected:');
            console.log('Make sure you have proper admin permissions for this project.');
        }
    }
}

checkFirebaseUsers().then(() => {
    console.log('\n✅ User check complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});