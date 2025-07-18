/**
 * Firebase Configuration and Initialization
 * For xBrush MovieMaker MVP
 */

// Function to initialize Firebase when SDK is ready
function initializeFirebaseServices() {
    // Check if Firebase SDK is loaded
    if (!window.firebase) {
        console.log('Waiting for Firebase SDK...');
        setTimeout(initializeFirebaseServices, 100);
        return;
    }
    
    // Check if AppConfig is loaded
    if (!window.AppConfig) {
        console.log('Waiting for AppConfig...');
        setTimeout(initializeFirebaseServices, 100);
        return;
    }

    console.log('Firebase SDK detected, initializing...');

    // Get Firebase configuration from centralized config
    const firebaseConfig = window.AppConfig.getFirebaseConfig();

    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase app initialized');

        // Initialize Firestore with cache settings
        const db = firebase.firestore();
        
        // Configure Firestore settings with cache
        const settings = {
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        };
        db.settings(settings);
        
        window.firebaseDB = db;
        console.log('Firestore initialized with cache settings');

        // Initialize Storage for images
        const storage = firebase.storage();
        window.firebaseStorage = storage;
        console.log('Storage initialized');

        // Initialize Auth
        const auth = firebase.auth();
        window.firebaseAuth = auth;
        console.log('Auth initialized');

        // Enable Firestore offline persistence using the newer method
        // Skip persistence for Safari due to performance issues
        if (!window.DISABLE_FIREBASE_PERSISTENCE) {
            firebase.firestore().enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log('Offline persistence enabled');
                })
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                    } else if (err.code === 'unimplemented') {
                        console.warn('The current browser does not support offline persistence');
                    }
                });
        } else {
            console.log('Offline persistence disabled for performance optimization');
        }

        // Initialize anonymous authentication if enabled
        if (window.AppConfig.isFeatureEnabled('enableAnonymousAuth')) {
            auth.signInAnonymously()
                .then(() => {
                    console.log('Anonymous authentication successful');
                })
                .catch((error) => {
                    if (error.code === 'auth/operation-not-allowed') {
                        console.warn('Anonymous auth not enabled in Firebase Console. Please enable it at:');
                        console.warn('https://console.firebase.google.com/project/xbrush-moviemaker-mvp/authentication/providers');
                    } else {
                        console.error('Authentication error:', error);
                    }
                    // Continue without auth for now
                });
        } else {
            console.log('Anonymous authentication is disabled in configuration');
        }

        // Monitor auth state
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                window.firebaseUser = user;
            } else {
                console.log('User not authenticated');
                window.firebaseUser = null;
            }
        });

        console.log('Firebase initialized successfully');
        
        // Trigger event to notify other scripts
        window.dispatchEvent(new Event('firebaseReady'));
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Start initialization
initializeFirebaseServices();