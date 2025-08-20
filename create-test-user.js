/**
 * Script to create a test user with known credentials
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const auth = admin.auth();

async function createTestUser() {
    console.log('👤 Creating test user for login testing...\n');
    
    const testEmail = 'test@xbrush.com';
    const testPassword = 'test123456';
    
    try {
        // Check if user already exists
        try {
            const existingUser = await auth.getUserByEmail(testEmail);
            console.log(`✅ User ${testEmail} already exists with UID: ${existingUser.uid}`);
            console.log(`📝 You can try logging in with:`);
            console.log(`   Email: ${testEmail}`);
            console.log(`   Password: ${testPassword} (if password was set to this)`);
            return;
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }
        
        // Create new user
        const userRecord = await auth.createUser({
            email: testEmail,
            password: testPassword,
            emailVerified: true,
            displayName: 'Test User'
        });
        
        console.log(`✅ Successfully created test user:`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email Verified: ${userRecord.emailVerified}`);
        
        console.log(`\n🔧 You can now test login with these credentials on the website.`);
        
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        
        if (error.code === 'auth/email-already-exists') {
            console.log('\n🔧 User already exists. Try logging in with existing credentials.');
        }
    }
}

createTestUser().then(() => {
    console.log('\n✅ Test user creation complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});