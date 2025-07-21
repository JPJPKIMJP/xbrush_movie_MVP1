/**
 * Authentication Debug Helper
 * Provides debugging utilities for authentication issues
 */

window.debugAuth = function() {
    console.log('=== Authentication Debug Info ===');
    
    // Check Firebase status
    console.log('Firebase loaded:', !!window.firebase);
    console.log('Firebase Auth:', !!window.firebase?.auth);
    console.log('Firebase Firestore:', !!window.firebase?.firestore);
    console.log('App Config:', !!window.AppConfig);
    
    // Check auth modal
    console.log('Auth Modal:', !!window.authModal);
    console.log('Auth Manager:', !!window.authManager);
    
    // Current user
    if (window.firebase?.auth) {
        const user = firebase.auth().currentUser;
        console.log('Current User:', user ? user.email : 'None');
    }
    
    // Firebase config
    if (window.AppConfig) {
        console.log('Firebase Project ID:', window.AppConfig.getFirebaseConfig().projectId);
    }
    
    console.log('=== End Debug Info ===');
};

// Test sign in function
window.testSignIn = async function(email, password) {
    if (!window.firebase?.auth) {
        console.error('Firebase Auth not initialized');
        return;
    }
    
    try {
        console.log('Attempting sign in...');
        const result = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('Sign in successful:', result.user.email);
        return result;
    } catch (error) {
        console.error('Sign in error:', error.code, error.message);
        throw error;
    }
};

// Test sign up function
window.testSignUp = async function(email, password) {
    if (!window.firebase?.auth) {
        console.error('Firebase Auth not initialized');
        return;
    }
    
    try {
        console.log('Attempting sign up...');
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log('Sign up successful:', result.user.email);
        return result;
    } catch (error) {
        console.error('Sign up error:', error.code, error.message);
        throw error;
    }
};

// Check Firebase configuration
window.checkFirebaseConfig = function() {
    if (!window.AppConfig) {
        console.error('AppConfig not loaded');
        return;
    }
    
    const config = window.AppConfig.getFirebaseConfig();
    console.log('Firebase Configuration:');
    console.log('- API Key:', config.apiKey ? 'Set' : 'Missing');
    console.log('- Auth Domain:', config.authDomain);
    console.log('- Project ID:', config.projectId);
    console.log('- App ID:', config.appId ? 'Set' : 'Missing');
    
    // Check if running on authorized domain
    const currentDomain = window.location.hostname;
    console.log('Current Domain:', currentDomain);
    
    if (currentDomain !== 'localhost' && !config.authDomain.includes(currentDomain)) {
        console.warn('⚠️ Current domain may not be authorized in Firebase Console');
        console.warn('Add this domain to Firebase Console > Authentication > Settings > Authorized domains');
    }
};

// Auto-run debug on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('Auth Debug Helper loaded. Run debugAuth() for status.');
        }, 1000);
    });
} else {
    setTimeout(() => {
        console.log('Auth Debug Helper loaded. Run debugAuth() for status.');
    }, 1000);
}