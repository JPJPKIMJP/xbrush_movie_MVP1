/**
 * Firebase Model Storage Service
 * Handles all model data operations using Firestore
 */

class FirebaseModelStorage {
    constructor() {
        this.db = window.firebaseDB;
        this.storage = window.firebaseStorage;
        this.collection = 'models';
        this.initialized = false;
        this.initPromise = this.init();
    }

    /**
     * Initialize the storage
     */
    async init() {
        try {
            // Check if Firebase is loaded
            if (!this.db) {
                console.error('Firebase not initialized');
                return false;
            }
            
            this.initialized = true;
            console.log('Firebase Model Storage initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Firebase Model Storage:', error);
            return false;
        }
    }

    /**
     * Ensure Firebase is ready
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
        if (!this.db) {
            throw new Error('Firebase not initialized');
        }
    }

    /**
     * Upload image to Firebase Storage
     */
    async uploadImage(base64Data, fileName) {
        try {
            // Convert base64 to blob
            const response = await fetch(base64Data);
            const blob = await response.blob();
            
            // Create a reference to the file
            const storageRef = this.storage.ref();
            const imageRef = storageRef.child(`models/${Date.now()}_${fileName}`);
            
            // Upload the file
            const snapshot = await imageRef.put(blob);
            
            // Get the download URL
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
            // Return original base64 as fallback
            return base64Data;
        }
    }

    /**
     * Save a new model
     */
    async saveModel(modelData) {
        try {
            console.log('[FirebaseModelStorage] Starting saveModel...');
            await this.ensureInitialized();
            console.log('[FirebaseModelStorage] Firebase initialized');
            
            // Generate ID if not present
            if (!modelData.id) {
                modelData.id = 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            console.log('[FirebaseModelStorage] Model ID:', modelData.id);
            
            // Upload thumbnail if it's base64
            if (modelData.portfolio?.thumbnailUrl?.startsWith('data:')) {
                console.log('Uploading thumbnail to Firebase Storage...');
                try {
                    modelData.portfolio.thumbnailUrl = await this.uploadImage(
                        modelData.portfolio.thumbnailUrl,
                        `thumbnail_${modelData.id}.jpg`
                    );
                } catch (error) {
                    console.error('Thumbnail upload failed (CORS issue), keeping base64:', error);
                    // Keep base64 for now - will work but less efficient
                }
            }
            
            // Upload portfolio images if they're base64
            if (modelData.portfolio?.images?.length > 0) {
                console.log('Uploading portfolio images...');
                const uploadedImages = [];
                for (let i = 0; i < modelData.portfolio.images.length; i++) {
                    const img = modelData.portfolio.images[i];
                    if (img.url?.startsWith('data:')) {
                        try {
                            const uploadedUrl = await this.uploadImage(
                                img.url,
                                `portfolio_${modelData.id}_${i}.jpg`
                            );
                            uploadedImages.push({
                                ...img,
                                url: uploadedUrl
                            });
                        } catch (error) {
                            console.error(`Portfolio image ${i} upload failed (CORS), keeping base64:`, error);
                            uploadedImages.push(img); // Keep base64 version
                        }
                    } else {
                        uploadedImages.push(img);
                    }
                }
                modelData.portfolio.images = uploadedImages;
            }
            
            // Add timestamps
            modelData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            modelData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            console.log('[FirebaseModelStorage] Saving to Firestore...');
            console.log('[FirebaseModelStorage] Collection:', this.collection);
            console.log('[FirebaseModelStorage] Document ID:', modelData.id);
            console.log('[FirebaseModelStorage] Model status:', modelData.status);
            
            // Save to Firestore
            await this.db.collection(this.collection).doc(modelData.id).set(modelData);
            
            console.log('[FirebaseModelStorage] ✅ Model saved successfully!');
            console.log('[FirebaseModelStorage] Model ID:', modelData.id);
            return modelData.id;
            
        } catch (error) {
            console.error('Error saving model to Firebase:', error);
            throw error;
        }
    }

    /**
     * Get a model by ID
     */
    async getModel(id) {
        try {
            await this.ensureInitialized();
            
            const doc = await this.db.collection(this.collection).doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting model:', error);
            return null;
        }
    }

    /**
     * Get all models
     */
    async getAllModels() {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection(this.collection)
                .orderBy('createdAt', 'desc')
                .get();
            
            const models = [];
            snapshot.forEach(doc => {
                models.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return models;
        } catch (error) {
            console.error('Error getting all models:', error);
            return [];
        }
    }

    /**
     * Get active models (status = active)
     */
    async getActiveModels() {
        try {
            console.log('[FirebaseModelStorage] Getting active models...');
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection(this.collection)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .get();
            
            console.log('[FirebaseModelStorage] Query complete. Found:', snapshot.size, 'documents');
            
            const models = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('[FirebaseModelStorage] Model found:', {
                    id: doc.id,
                    status: data.status,
                    name: data.personalInfo?.name
                });
                models.push({
                    id: doc.id,
                    ...data
                });
            });
            
            console.log('[FirebaseModelStorage] Returning', models.length, 'active models');
            return models;
        } catch (error) {
            console.error('Error getting active models:', error);
            return [];
        }
    }

    /**
     * Get pending models (status = pending)
     */
    async getPendingModels() {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection(this.collection)
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();
            
            const models = [];
            snapshot.forEach(doc => {
                models.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return models;
        } catch (error) {
            console.error('Error getting pending models:', error);
            return [];
        }
    }

    /**
     * Update a model
     */
    async updateModel(id, updates) {
        try {
            await this.ensureInitialized();
            
            // Add updated timestamp
            updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            await this.db.collection(this.collection).doc(id).update(updates);
            
            console.log('Model updated:', id);
            return true;
        } catch (error) {
            console.error('Error updating model:', error);
            return false;
        }
    }

    /**
     * Delete a model
     */
    async deleteModel(id) {
        try {
            await this.ensureInitialized();
            
            await this.db.collection(this.collection).doc(id).delete();
            
            console.log('Model deleted:', id);
            return true;
        } catch (error) {
            console.error('Error deleting model:', error);
            return false;
        }
    }

    /**
     * Search models by name or category
     */
    async searchModels(query) {
        try {
            await this.ensureInitialized();
            
            // For now, we'll get all active models and filter client-side
            // Firestore doesn't support full-text search natively
            const models = await this.getActiveModels();
            
            const searchTerm = query.toLowerCase();
            return models.filter(model => {
                const name = model.personalInfo?.name?.toLowerCase() || '';
                const intro = model.personalInfo?.intro?.toLowerCase() || '';
                const categories = model.personalInfo?.categories || [];
                
                return name.includes(searchTerm) || 
                       intro.includes(searchTerm) ||
                       categories.some(cat => cat.toLowerCase().includes(searchTerm));
            });
            
        } catch (error) {
            console.error('Error searching models:', error);
            return [];
        }
    }

    /**
     * Get models by category
     */
    async getModelsByCategory(category) {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection(this.collection)
                .where('personalInfo.categories', 'array-contains', category)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .get();
            
            const models = [];
            snapshot.forEach(doc => {
                models.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return models;
        } catch (error) {
            console.error('Error getting models by category:', error);
            return [];
        }
    }

    /**
     * Listen to real-time updates
     */
    subscribeToModels(callback) {
        try {
            return this.db.collection(this.collection)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    const models = [];
                    snapshot.forEach(doc => {
                        models.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    callback(models);
                });
        } catch (error) {
            console.error('Error subscribing to models:', error);
            return () => {}; // Return empty unsubscribe function
        }
    }
}

// Create global instance after Firebase is ready
function initializeFirebaseModelStorage() {
    if (!window.firebaseDB) {
        console.log('Waiting for Firebase to initialize before creating FirebaseModelStorage...');
        setTimeout(initializeFirebaseModelStorage, 100);
        return;
    }
    
    console.log('Creating FirebaseModelStorage instance...');
    window.firebaseModelStorage = new FirebaseModelStorage();
}

// Start initialization
initializeFirebaseModelStorage();