/**
 * xBrush Database Module
 * Handles all database operations for model registration and main app integration
 */

class XBrushDB {
    constructor() {
        this.DB_NAME = 'xbrush_models';
        this.DB_VERSION = 1;
        this.db = null;
        
        this.STORES = {
            models: 'models',        // Basic model profiles
            details: 'modelDetails', // Detailed model data
            images: 'modelImages',   // Portfolio images
            usage: 'modelUsage'      // Usage tracking
        };
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create models store
                if (!db.objectStoreNames.contains(this.STORES.models)) {
                    const modelStore = db.createObjectStore(this.STORES.models, { keyPath: 'id' });
                    modelStore.createIndex('status', 'status', { unique: false });
                    modelStore.createIndex('tier', 'tier', { unique: false });
                    modelStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Create model details store
                if (!db.objectStoreNames.contains(this.STORES.details)) {
                    db.createObjectStore(this.STORES.details, { keyPath: 'modelId' });
                }
                
                // Create images store
                if (!db.objectStoreNames.contains(this.STORES.images)) {
                    const imageStore = db.createObjectStore(this.STORES.images, { keyPath: 'id' });
                    imageStore.createIndex('modelId', 'modelId', { unique: false });
                    imageStore.createIndex('isPrimary', 'isPrimary', { unique: false });
                }
                
                // Create usage store
                if (!db.objectStoreNames.contains(this.STORES.usage)) {
                    db.createObjectStore(this.STORES.usage, { keyPath: 'modelId' });
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     */
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    /**
     * Save model profile
     */
    async saveModel(modelData) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.models], 'readwrite');
        const store = transaction.objectStore(this.STORES.models);
        
        return new Promise((resolve, reject) => {
            const request = store.put(modelData);
            request.onsuccess = () => resolve(modelData.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save model details
     */
    async saveModelDetails(detailsData) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.details], 'readwrite');
        const store = transaction.objectStore(this.STORES.details);
        
        return new Promise((resolve, reject) => {
            const request = store.put(detailsData);
            request.onsuccess = () => resolve(detailsData.modelId);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save portfolio images
     */
    async savePortfolioImages(modelId, images) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.images], 'readwrite');
        const store = transaction.objectStore(this.STORES.images);
        
        const promises = images.map(image => {
            return new Promise((resolve, reject) => {
                const imageData = {
                    ...image,
                    modelId: modelId
                };
                const request = store.put(imageData);
                request.onsuccess = () => resolve(imageData.id);
                request.onerror = () => reject(request.error);
            });
        });
        
        return Promise.all(promises);
    }

    /**
     * Get all approved models
     */
    async getApprovedModels() {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.models], 'readonly');
        const store = transaction.objectStore(this.STORES.models);
        const index = store.index('status');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll('approved');
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get model by ID
     */
    async getModel(modelId) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.models], 'readonly');
        const store = transaction.objectStore(this.STORES.models);
        
        return new Promise((resolve, reject) => {
            const request = store.get(modelId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get model details
     */
    async getModelDetails(modelId) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.details], 'readonly');
        const store = transaction.objectStore(this.STORES.details);
        
        return new Promise((resolve, reject) => {
            const request = store.get(modelId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get model portfolio images
     */
    async getModelImages(modelId) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.images], 'readonly');
        const store = transaction.objectStore(this.STORES.images);
        const index = store.index('modelId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(modelId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update model status
     */
    async updateModelStatus(modelId, status) {
        const model = await this.getModel(modelId);
        if (!model) throw new Error('Model not found');
        
        model.status = status;
        model.updatedAt = new Date().toISOString();
        
        return this.saveModel(model);
    }

    /**
     * Track model usage
     */
    async trackUsage(modelId, videoId) {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.usage], 'readwrite');
        const store = transaction.objectStore(this.STORES.usage);
        
        // Get existing usage data
        const getRequest = store.get(modelId);
        
        return new Promise((resolve, reject) => {
            getRequest.onsuccess = () => {
                const usage = getRequest.result || {
                    modelId: modelId,
                    usageCount: 0,
                    revenue: 0,
                    videoIds: []
                };
                
                usage.usageCount++;
                usage.lastUsedAt = new Date().toISOString();
                if (videoId) usage.videoIds.push(videoId);
                
                const putRequest = store.put(usage);
                putRequest.onsuccess = () => resolve(usage);
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Get all models (for admin)
     */
    async getAllModels() {
        const db = await this.ensureDB();
        const transaction = db.transaction([this.STORES.models], 'readonly');
        const store = transaction.objectStore(this.STORES.models);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete model and all related data
     */
    async deleteModel(modelId) {
        const db = await this.ensureDB();
        const transaction = db.transaction([
            this.STORES.models,
            this.STORES.details,
            this.STORES.images,
            this.STORES.usage
        ], 'readwrite');
        
        const promises = [];
        
        // Delete from models store
        promises.push(new Promise((resolve, reject) => {
            const request = transaction.objectStore(this.STORES.models).delete(modelId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        }));
        
        // Delete from details store
        promises.push(new Promise((resolve, reject) => {
            const request = transaction.objectStore(this.STORES.details).delete(modelId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        }));
        
        // Delete from usage store
        promises.push(new Promise((resolve, reject) => {
            const request = transaction.objectStore(this.STORES.usage).delete(modelId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        }));
        
        // Delete all images
        const imageStore = transaction.objectStore(this.STORES.images);
        const imageIndex = imageStore.index('modelId');
        const imageRequest = imageIndex.getAllKeys(modelId);
        
        promises.push(new Promise((resolve, reject) => {
            imageRequest.onsuccess = () => {
                const keys = imageRequest.result;
                const deletePromises = keys.map(key => {
                    return new Promise((res, rej) => {
                        const delRequest = imageStore.delete(key);
                        delRequest.onsuccess = () => res();
                        delRequest.onerror = () => rej(delRequest.error);
                    });
                });
                Promise.all(deletePromises).then(resolve).catch(reject);
            };
            imageRequest.onerror = () => reject(imageRequest.error);
        }));
        
        return Promise.all(promises);
    }

    /**
     * Add mock data for testing
     */
    async addMockData() {
        // Mock model 1
        const mockModel1 = {
            id: 'model_mock_1',
            name: '김지은',
            tier: 'premium',
            status: 'approved',
            profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Add actual base64 image
            description: '프로페셔널 모델 김지은',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            updatedAt: new Date().toISOString()
        };
        
        await this.saveModel(mockModel1);
        
        await this.saveModelDetails({
            modelId: mockModel1.id,
            kyc: {
                verified: true,
                verifiedAt: mockModel1.createdAt,
                attemptCount: 1
            },
            contract: {
                pricingType: 'flat',
                flatRate: 100000,
                shareRate: null,
                period: 12,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                allowedScopes: ['commercial', 'sns', 'search'],
                highRiskScopes: [],
                requiresReview: false,
                signatureUrl: 'data:image/png;base64,...'
            },
            portfolio: []
        });
        
        // Mock model 2
        const mockModel2 = {
            id: 'model_mock_2',
            name: '박서준',
            tier: 'premium',
            status: 'approved',
            profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Add actual base64 image
            description: '차세대 AI 모델 박서준',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            updatedAt: new Date().toISOString()
        };
        
        await this.saveModel(mockModel2);
        
        await this.saveModelDetails({
            modelId: mockModel2.id,
            kyc: {
                verified: true,
                verifiedAt: mockModel2.createdAt,
                attemptCount: 1
            },
            contract: {
                pricingType: 'share',
                flatRate: null,
                shareRate: 30,
                period: 24,
                expiresAt: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
                allowedScopes: ['commercial', 'sns', 'search'],
                highRiskScopes: ['medical'],
                requiresReview: true,
                signatureUrl: 'data:image/png;base64,...'
            },
            portfolio: []
        });
        
        console.log('Mock data added successfully');
    }
}

// Create singleton instance
const xbrushDB = new XBrushDB();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = xbrushDB;
} else {
    window.xbrushDB = xbrushDB;
}