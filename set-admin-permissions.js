/**
 * Script to set admin permissions for goooodjp@gmail.com
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'xbrush-moviemaker-mvp'
});

const auth = admin.auth();
const db = admin.firestore();

async function setAdminPermissions() {
    console.log('🔐 Setting admin permissions for goooodjp@gmail.com...\n');
    
    const adminEmail = 'goooodjp@gmail.com';
    
    try {
        // 1. Get user by email
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(adminEmail);
            console.log(`✅ Found user: ${adminEmail}`);
            console.log(`   UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`❌ User ${adminEmail} not found in Firebase Auth`);
                console.log('Creating user...');
                
                // Create the user
                userRecord = await auth.createUser({
                    email: adminEmail,
                    emailVerified: true,
                    displayName: 'Super Admin'
                });
                console.log(`✅ Created user: ${adminEmail} with UID: ${userRecord.uid}`);
            } else {
                throw error;
            }
        }
        
        // 2. Set custom claims (admin permissions)
        await auth.setCustomUserClaims(userRecord.uid, {
            admin: true,
            superAdmin: true,
            adminLevel: 'super',
            permissions: {
                manageUsers: true,
                manageModels: true,
                manageProjects: true,
                viewAnalytics: true,
                systemAdmin: true
            },
            grantedAt: Date.now(),
            grantedBy: 'system'
        });
        
        console.log('✅ Set custom claims for admin permissions');
        
        // 3. Add to Firestore admin collection
        await db.collection('admins').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: adminEmail,
            displayName: 'Super Admin',
            adminLevel: 'super',
            permissions: {
                manageUsers: true,
                manageModels: true,
                manageProjects: true,
                viewAnalytics: true,
                systemAdmin: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });
        
        console.log('✅ Added to admins collection in Firestore');
        
        // 4. Update or create user profile
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: adminEmail,
            displayName: 'Super Admin',
            role: 'super_admin',
            isAdmin: true,
            permissions: {
                manageUsers: true,
                manageModels: true,
                manageProjects: true,
                viewAnalytics: true,
                systemAdmin: true
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Updated user profile with admin status');
        
        // 5. Log the admin permission grant
        await db.collection('adminLogs').add({
            action: 'grant_super_admin',
            targetUserId: userRecord.uid,
            targetEmail: adminEmail,
            performedBy: 'system',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: {
                adminLevel: 'super',
                permissions: 'all'
            }
        });
        
        console.log('✅ Logged admin permission grant');
        
        // 6. Verify the permissions
        const updatedUser = await auth.getUser(userRecord.uid);
        console.log('\n📋 Verification:');
        console.log('Custom Claims:', JSON.stringify(updatedUser.customClaims, null, 2));
        
        console.log('\n🎉 Successfully granted super admin permissions to goooodjp@gmail.com!');
        console.log('\n📝 Admin Access Details:');
        console.log(`   • Email: ${adminEmail}`);
        console.log(`   • UID: ${userRecord.uid}`);
        console.log(`   • Admin Level: Super Admin`);
        console.log(`   • Permissions: Full system access`);
        console.log(`   • Admin Panel Access: Enabled`);
        
    } catch (error) {
        console.error('❌ Error setting admin permissions:', error);
        throw error;
    }
}

setAdminPermissions().then(() => {
    console.log('\n✅ Admin permissions setup complete!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Failed to set admin permissions:', error);
    process.exit(1);
});