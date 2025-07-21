/**
 * Demo Authentication Handler
 * Simplified auth for demo/mockup site
 * - Accepts any email format
 * - Minimal validation
 * - Still saves to Firebase for persistence
 */

class DemoAuth {
    constructor() {
        this.initialized = false;
        this.initializeFirebase();
    }

    async initializeFirebase() {
        // Wait for Firebase
        let attempts = 0;
        while (!window.firebase && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.firebase) {
            this.initialized = true;
            console.log('Demo Auth: Firebase ready');
        } else {
            console.error('Demo Auth: Firebase not available');
            // Fallback to localStorage for pure demo
            this.useFallback = true;
        }
    }

    /**
     * Demo-friendly email validation
     * Just check if it has @ symbol
     */
    isValidDemoEmail(email) {
        return email && email.includes('@');
    }

    /**
     * Generate demo password if user doesn't provide one
     */
    generateDemoPassword(email) {
        // Use email as base for consistent password
        return 'demo_' + email.split('@')[0] + '_2024';
    }

    /**
     * Simplified sign up
     */
    async signUp(email, password, name) {
        if (!this.isValidDemoEmail(email)) {
            throw new Error('Please include @ in your email');
        }

        // Use provided password or generate one
        const finalPassword = password || this.generateDemoPassword(email);
        
        try {
            if (this.initialized && window.firebase.auth) {
                // Try Firebase first
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, finalPassword);
                const user = userCredential.user;

                // Update display name
                if (name) {
                    await user.updateProfile({ displayName: name });
                }

                // Save to Firestore (ignore errors for demo)
                try {
                    await firebase.firestore().collection('users').doc(user.uid).set({
                        uid: user.uid,
                        email: email,
                        name: name || email.split('@')[0],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isDemoUser: true
                    });
                } catch (firestoreError) {
                    console.log('Demo Auth: Firestore save skipped', firestoreError);
                }

                return { success: true, user: user };
            } else {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('demoUsers') || '{}');
                if (users[email]) {
                    throw new Error('Email already exists');
                }
                
                users[email] = {
                    email: email,
                    password: finalPassword,
                    name: name || email.split('@')[0],
                    uid: 'demo_' + Date.now()
                };
                
                localStorage.setItem('demoUsers', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(users[email]));
                
                return { success: true, user: users[email] };
            }
        } catch (error) {
            // Simplify error messages for demo
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('This email is already registered');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password should be at least 6 characters');
            } else {
                throw new Error(error.message || 'Sign up failed');
            }
        }
    }

    /**
     * Simplified login
     */
    async login(email, password) {
        if (!this.isValidDemoEmail(email)) {
            throw new Error('Please include @ in your email');
        }

        try {
            if (this.initialized && window.firebase.auth) {
                // Try Firebase first
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } else {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('demoUsers') || '{}');
                const user = users[email];
                
                if (!user || user.password !== password) {
                    throw new Error('Invalid email or password');
                }
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                return { success: true, user: user };
            }
        } catch (error) {
            // Simplify error messages for demo
            if (error.code === 'auth/user-not-found') {
                throw new Error('Email not found. Please sign up first');
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('Incorrect password');
            } else {
                throw new Error(error.message || 'Login failed');
            }
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (this.initialized && window.firebase.auth) {
            return firebase.auth().currentUser;
        } else {
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        }
    }

    /**
     * Logout
     */
    async logout() {
        if (this.initialized && window.firebase.auth) {
            await firebase.auth().signOut();
        } else {
            localStorage.removeItem('currentUser');
        }
    }
}

// Initialize demo auth
window.demoAuth = new DemoAuth();

// Helper function for testing
window.quickSignUp = async (email) => {
    try {
        const result = await window.demoAuth.signUp(
            email || `test${Date.now()}@demo.com`,
            'demo123',
            'Demo User'
        );
        console.log('Quick sign up successful:', result);
        return result;
    } catch (error) {
        console.error('Quick sign up failed:', error);
        throw error;
    }
};