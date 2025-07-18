/**
 * Safari Performance Optimization for Firebase
 * Addresses slow loading issues in Safari browser
 */

(function() {
    'use strict';
    
    // Detect Safari browser
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
        console.log('[Safari Fix] Applying Safari-specific optimizations');
        
        // 1. Disable Firebase persistence in Safari (major performance issue)
        window.DISABLE_FIREBASE_PERSISTENCE = true;
        
        // 2. Add Safari-specific fetch optimizations
        if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                // Add cache control headers for Safari
                if (args[1] && typeof args[1] === 'object') {
                    args[1].cache = 'no-cache';
                }
                return originalFetch.apply(this, args);
            };
        }
        
        // 3. Optimize Promise handling for Safari
        // Safari has issues with Promise.all in some versions
        const originalPromiseAll = Promise.all;
        Promise.all = function(promises) {
            if (!Array.isArray(promises)) {
                return originalPromiseAll.call(this, promises);
            }
            
            // For Safari, add small delays between promise resolutions
            // to prevent blocking the main thread
            const delayedPromises = promises.map((promise, index) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        Promise.resolve(promise).then(resolve);
                    }, index * 10); // 10ms delay between each
                });
            });
            
            return originalPromiseAll.call(this, delayedPromises);
        };
    }
    
    // 4. Preconnect to Firebase domains early
    function addPreconnect() {
        const domains = [
            'https://firebaseapp.com',
            'https://firebasestorage.googleapis.com',
            'https://firestore.googleapis.com',
            'https://identitytoolkit.googleapis.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    // Add preconnect links as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addPreconnect);
    } else {
        addPreconnect();
    }
    
    // 5. Optimize Firestore queries for Safari
    window.optimizeFirestoreQuery = function(query) {
        if (!isSafari) return query;
        
        // In Safari, limit initial queries to reduce load
        return query.limit(5);
    };
    
    // 6. Add progressive loading for Safari
    window.progressiveLoadModels = async function(loadFunction, containerId) {
        if (!isSafari) {
            return loadFunction();
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Show immediate feedback
        container.innerHTML = '<div class="loading-placeholder"><p>모델을 불러오는 중...</p></div>';
        
        try {
            // Load in smaller batches for Safari
            await loadFunction(5); // Load first 5
            
            // Load rest after a delay
            setTimeout(async () => {
                await loadFunction(); // Load all
            }, 100);
        } catch (error) {
            console.error('[Safari Fix] Error loading models:', error);
        }
    };
    
    console.log('[Safari Fix] Performance optimizations applied');
})();