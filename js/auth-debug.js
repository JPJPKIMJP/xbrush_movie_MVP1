/**
 * Auth Debug Helper
 * Helps diagnose Firebase authentication issues
 */

function debugAuth() {
    console.log('=== Firebase Auth Debug Info ===');
    
    // Check Firebase initialization
    console.log('Firebase loaded:', !!window.firebase);
    console.log('Firebase Auth loaded:', !!(window.firebase && window.firebase.auth));
    console.log('Firebase Firestore loaded:', !!(window.firebase && window.firebase.firestore));
    
    // Check Firebase config
    if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
        const app = window.firebase.apps[0];
        console.log('Firebase App Name:', app.name);
        console.log('Firebase Project ID:', app.options.projectId);
        console.log('Firebase Auth Domain:', app.options.authDomain);
    }
    
    // Check auth state
    if (window.firebase && window.firebase.auth) {
        const auth = window.firebase.auth();
        console.log('Current User:', auth.currentUser);
        
        // Check auth settings
        auth.onAuthStateChanged((user) => {
            console.log('Auth State Changed:', user ? user.email : 'No user');
        });
        
        // Test auth methods availability
        console.log('signInWithEmailAndPassword available:', typeof auth.signInWithEmailAndPassword === 'function');
        console.log('createUserWithEmailAndPassword available:', typeof auth.createUserWithEmailAndPassword === 'function');
    }
    
    // Check if auth modal is loaded
    console.log('Auth Modal loaded:', !!window.authModal);
    console.log('Auth Manager loaded:', !!window.authManager);
    
    console.log('=== End Debug Info ===');
}

// Test sign in
async function testSignIn(email, password) {
    console.log('Testing sign in with:', email);
    
    try {
        if (!window.firebase || !window.firebase.auth) {
            console.error('Firebase Auth not available');
            return;
        }
        
        const auth = window.firebase.auth();
        const result = await auth.signInWithEmailAndPassword(email, password);
        console.log('Sign in successful:', result.user.email);
        console.log('User UID:', result.user.uid);
        
    } catch (error) {
        console.error('Sign in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Check if it's a network error
        if (error.code === 'auth/network-request-failed') {
            console.error('Network error - check Firebase console and domain whitelist');
        }
        
        // Check if email/password auth is enabled
        if (error.code === 'auth/operation-not-allowed') {
            console.error('Email/Password authentication is not enabled in Firebase Console');
            console.error('Go to: https://console.firebase.google.com/project/xbrush-moviemaker-mvp/authentication/providers');
        }
    }
}

// Export for console use
window.debugAuth = debugAuth;
window.testSignIn = testSignIn;

// Run debug on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugAuth);
} else {
    debugAuth();
}