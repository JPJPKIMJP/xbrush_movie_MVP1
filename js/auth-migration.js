/**
 * Authentication Migration Helper
 * Helps migrate existing Firebase Auth users to have proper Firestore documents
 */

class AuthMigration {
    constructor() {
        this.db = null;
        this.auth = null;
    }

    async initialize() {
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        
        console.log('AuthMigration initialized');
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.auth && window.firebase.firestore) {
                resolve();
            } else {
                window.addEventListener('firebaseReady', () => resolve(), { once: true });
                setTimeout(() => resolve(), 5000);
            }
        });
    }

    /**
     * Check if a user has a Firestore document
     */
    async checkUserDocument(uid) {
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            return doc.exists;
        } catch (error) {
            console.error('Error checking user document:', error);
            return false;
        }
    }

    /**
     * Create a Firestore document for an existing Auth user
     */
    async createUserDocument(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                phone: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user',
                termsAgreed: false,
                termsAgreedAt: null,
                termsAgreements: null,
                videoCreations: [],
                modelProfile: null,
                emailVerified: user.emailVerified,
                migrated: true,
                migratedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('users').doc(user.uid).set(userData);
            console.log('User document created for:', user.email);
            return true;
        } catch (error) {
            console.error('Error creating user document:', error);
            return false;
        }
    }

    /**
     * Migrate current logged-in user
     */
    async migrateCurrentUser() {
        const user = this.auth.currentUser;
        if (!user) {
            console.log('No user currently logged in');
            return false;
        }

        const hasDoc = await this.checkUserDocument(user.uid);
        if (!hasDoc) {
            console.log('User missing Firestore document, creating...');
            return await this.createUserDocument(user);
        } else {
            console.log('User already has Firestore document');
            return true;
        }
    }

    /**
     * Listen for auth state changes and auto-migrate
     */
    enableAutoMigration() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                const hasDoc = await this.checkUserDocument(user.uid);
                if (!hasDoc) {
                    console.log('Auto-migrating user:', user.email);
                    await this.createUserDocument(user);
                }
            }
        });
    }
}

// Initialize migration helper
let authMigration;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        authMigration = new AuthMigration();
        await authMigration.initialize();
        authMigration.enableAutoMigration();
        window.authMigration = authMigration;
    });
} else {
    (async () => {
        authMigration = new AuthMigration();
        await authMigration.initialize();
        authMigration.enableAutoMigration();
        window.authMigration = authMigration;
    })();
}