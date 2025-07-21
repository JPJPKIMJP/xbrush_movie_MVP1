/**
 * Application Configuration
 * Centralizes all configuration including Firebase settings
 */

(function() {
    'use strict';
    
    // Configuration object
    const Config = {
        // Environment detection
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isProduction: window.location.hostname.includes('github.io') || window.location.hostname.includes('firebaseapp.com'),
        
        // Firebase configuration
        // In production, these should be loaded from environment variables or a secure config service
        firebase: {
            // Updated to use xbrush-moviemaker-mvp
            apiKey: "AIzaSyCsQzvoYysNkHcxR4NztCdqTVkD_HgtJEU",
            authDomain: "xbrush-moviemaker-mvp.firebaseapp.com",
            projectId: "xbrush-moviemaker-mvp",
            storageBucket: "xbrush-moviemaker-mvp.firebasestorage.app",
            messagingSenderId: "138732810619",
            appId: "1:138732810619:web:a35c938d2d3b2880db4dde"
        },
        
        // Application settings
        app: {
            name: 'xBrush MovieMaker',
            version: '1.0.0',
            defaultLanguage: 'ko',
            maxImageSize: 5 * 1024 * 1024, // 5MB
            maxVideoSize: 50 * 1024 * 1024, // 50MB
            supportedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            supportedVideoTypes: ['video/mp4', 'video/webm']
        },
        
        // Storage settings
        storage: {
            modelImagesPath: 'models/images/',
            modelVideosPath: 'models/videos/',
            portfolioPath: 'models/portfolio/',
            tempPath: 'temp/',
            cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
        },
        
        // API endpoints (for future use)
        api: {
            baseUrl: window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api' 
                : 'https://api.xbrush.com',
            timeout: 30000
        },
        
        // Feature flags
        features: {
            enableAnonymousAuth: false, // Disabled to allow proper login/logout
            enableImageOptimization: true,
            enableVideoPreview: true,
            enablePremiumModels: true,
            enableAdvancedSearch: false,
            requireEmailVerification: false, // Set to true to require email verification
            debugMode: window.location.hostname === 'localhost'
        },
        
        // Performance settings
        performance: {
            lazyLoadOffset: 50, // pixels before viewport
            imageCompressionQuality: 0.85,
            thumbnailMaxWidth: 400,
            thumbnailMaxHeight: 500,
            debounceDelay: 300,
            throttleDelay: 100
        },
        
        // Security settings
        security: {
            maxLoginAttempts: 5,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            enableCSRFProtection: true,
            allowedOrigins: [
                'https://jpjpkimjp.github.io',
                'https://xbrush-moviemaker-mvp.firebaseapp.com',
                'http://localhost:8080',
                'http://localhost:8000'
            ]
        }
    };
    
    // Method to get Firebase config with environment variable support
    Config.getFirebaseConfig = function() {
        // In production, this could check for environment variables
        // For GitHub Pages, we'll use the default config
        if (typeof process !== 'undefined' && process.env) {
            return {
                apiKey: process.env.FIREBASE_API_KEY || this.firebase.apiKey,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN || this.firebase.authDomain,
                projectId: process.env.FIREBASE_PROJECT_ID || this.firebase.projectId,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || this.firebase.storageBucket,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || this.firebase.messagingSenderId,
                appId: process.env.FIREBASE_APP_ID || this.firebase.appId
            };
        }
        return this.firebase;
    };
    
    // Method to check if a feature is enabled
    Config.isFeatureEnabled = function(featureName) {
        return this.features[featureName] === true;
    };
    
    // Method to get storage URL
    Config.getStorageUrl = function(path) {
        return `https://firebasestorage.googleapis.com/v0/b/${this.firebase.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
    };
    
    // Freeze the configuration to prevent modifications
    Object.freeze(Config);
    Object.freeze(Config.firebase);
    Object.freeze(Config.app);
    Object.freeze(Config.storage);
    Object.freeze(Config.api);
    Object.freeze(Config.features);
    Object.freeze(Config.performance);
    Object.freeze(Config.security);
    
    // Export to global scope
    window.AppConfig = Config;
    
    // Log configuration in debug mode
    if (Config.features.debugMode) {
        console.log('Application Configuration Loaded:', {
            environment: Config.isDevelopment ? 'development' : 'production',
            features: Config.features,
            version: Config.app.version
        });
    }
})();