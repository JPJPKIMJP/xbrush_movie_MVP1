/**
 * Firebase Initialization Monitor
 * Helps debug Firebase initialization timing issues
 */

(function() {
    'use strict';
    
    let startTime = Date.now();
    let checkInterval;
    
    function logStatus(message, isError = false) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const prefix = `[Firebase Monitor ${elapsed}s]`;
        if (isError) {
            console.error(prefix, message);
        } else {
            console.log(prefix, message);
        }
    }
    
    function checkFirebaseStatus() {
        const status = {
            firebase: !!window.firebase,
            firebaseAuth: !!(window.firebase && window.firebase.auth),
            firebaseFirestore: !!(window.firebase && window.firebase.firestore),
            firebaseStorage: !!(window.firebase && window.firebase.storage),
            firebaseDB: !!window.firebaseDB,
            firebaseStorageWindow: !!window.firebaseStorage,
            firebaseAuthWindow: !!window.firebaseAuth,
            appConfig: !!window.AppConfig
        };
        
        return status;
    }
    
    function startMonitoring() {
        logStatus('Starting Firebase initialization monitoring...');
        
        // Check status every 100ms
        checkInterval = setInterval(() => {
            const status = checkFirebaseStatus();
            
            // Check if everything is ready
            const allReady = Object.values(status).every(v => v === true);
            
            if (allReady) {
                logStatus('✅ All Firebase services initialized successfully!');
                logStatus('Status: ' + JSON.stringify(status));
                clearInterval(checkInterval);
                
                // Dispatch a custom event
                window.dispatchEvent(new Event('firebaseFullyReady'));
            } else {
                // Log what's still missing
                const missing = Object.entries(status)
                    .filter(([key, value]) => !value)
                    .map(([key]) => key);
                
                if (missing.length > 0 && Date.now() - startTime < 5000) {
                    // Only log during first 5 seconds
                    logStatus('Waiting for: ' + missing.join(', '));
                }
            }
            
            // Timeout after 10 seconds
            if (Date.now() - startTime > 10000) {
                logStatus('⚠️ Firebase initialization timeout. Final status:', true);
                logStatus(JSON.stringify(status, null, 2), true);
                clearInterval(checkInterval);
            }
        }, 100);
    }
    
    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
    
    // Also listen for the firebaseReady event
    window.addEventListener('firebaseReady', () => {
        logStatus('Received firebaseReady event');
        setTimeout(() => {
            const status = checkFirebaseStatus();
            logStatus('Status after firebaseReady: ' + JSON.stringify(status));
        }, 100);
    });
    
    // Export for debugging
    window.firebaseMonitor = {
        checkStatus: checkFirebaseStatus,
        logStatus: logStatus
    };
})();