/**
 * Image Fallback System
 * Provides elegant fallback solutions for failed image loads
 */

class ImageFallbackSystem {
    constructor() {
        this.avatarApiBaseUrl = 'https://ui-avatars.com/api/';
        this.backupAvatarService = 'https://robohash.org/';
        this.placeholderImages = [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face'
        ];
        this.retryCount = new Map();
        this.maxRetries = 2;
    }

    /**
     * Generate avatar URL based on name
     */
    generateAvatarUrl(name, size = 400) {
        if (!name || name === '이름 없음') {
            name = 'AI Model';
        }
        
        // Clean name for URL
        const cleanName = encodeURIComponent(name.trim());
        
        // Generate a nice color scheme based on name
        const colors = [
            { bg: '667eea', color: 'ffffff' },
            { bg: '764ba2', color: 'ffffff' },
            { bg: 'f093fb', color: 'ffffff' },
            { bg: 'ffecd2', color: '333333' },
            { bg: 'fcb69f', color: 'ffffff' },
            { bg: 'a8edea', color: '333333' },
            { bg: 'fed6e3', color: '333333' },
            { bg: 'c2e9fb', color: '333333' }
        ];
        
        const colorIndex = name.charCodeAt(0) % colors.length;
        const selectedColor = colors[colorIndex];
        
        return `${this.avatarApiBaseUrl}?name=${cleanName}&size=${size}&background=${selectedColor.bg}&color=${selectedColor.color}&bold=true&format=png`;
    }

    /**
     * Generate backup avatar URL
     */
    generateBackupAvatar(identifier, size = 400) {
        return `${this.backupAvatarService}${encodeURIComponent(identifier || 'default')}.png?size=${size}x${size}&set=set4`;
    }

    /**
     * Get random placeholder image
     */
    getRandomPlaceholder() {
        const randomIndex = Math.floor(Math.random() * this.placeholderImages.length);
        return this.placeholderImages[randomIndex];
    }

    /**
     * Handle image load error with progressive fallback
     */
    handleImageError(imgElement, modelName, modelId) {
        const imageKey = imgElement.src || modelId;
        const currentRetries = this.retryCount.get(imageKey) || 0;
        
        console.log(`Image load failed for ${modelName}, attempt ${currentRetries + 1}`);
        
        if (currentRetries === 0) {
            // First failure: Try generated avatar
            const avatarUrl = this.generateAvatarUrl(modelName);
            this.retryCount.set(imageKey, 1);
            imgElement.src = avatarUrl;
            
        } else if (currentRetries === 1) {
            // Second failure: Try backup avatar service
            const backupUrl = this.generateBackupAvatar(modelId || modelName);
            this.retryCount.set(imageKey, 2);
            imgElement.src = backupUrl;
            
        } else {
            // Final failure: Show elegant placeholder
            this.showElegantPlaceholder(imgElement, modelName);
        }
    }

    /**
     * Show elegant placeholder instead of error message
     */
    showElegantPlaceholder(imgElement, modelName) {
        // Hide the img element
        imgElement.style.display = 'none';
        
        // Create elegant placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'elegant-image-placeholder';
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </div>
                <div class="placeholder-text">${modelName || 'AI Model'}</div>
                <div class="placeholder-subtext">프로필 이미지</div>
            </div>
        `;
        
        // Insert placeholder after the image
        imgElement.parentNode.insertBefore(placeholder, imgElement.nextSibling);
    }

    /**
     * Preload image with fallback
     */
    async preloadImageWithFallback(originalUrl, modelName, modelId) {
        return new Promise((resolve) => {
            // Try original image first
            if (originalUrl && originalUrl !== 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop') {
                const img = new Image();
                img.onload = () => resolve(originalUrl);
                img.onerror = () => {
                    // If original fails, try avatar
                    const avatarUrl = this.generateAvatarUrl(modelName);
                    const avatarImg = new Image();
                    avatarImg.onload = () => resolve(avatarUrl);
                    avatarImg.onerror = () => {
                        // If avatar fails, try backup
                        const backupUrl = this.generateBackupAvatar(modelId || modelName);
                        const backupImg = new Image();
                        backupImg.onload = () => resolve(backupUrl);
                        backupImg.onerror = () => resolve(this.getRandomPlaceholder());
                        backupImg.src = backupUrl;
                    };
                    avatarImg.src = avatarUrl;
                };
                img.src = originalUrl;
            } else {
                // If no original URL, start with avatar
                resolve(this.generateAvatarUrl(modelName));
            }
        });
    }

    /**
     * Enhanced image element with fallback
     */
    createEnhancedImage(originalUrl, modelName, modelId, altText, className = '') {
        const img = document.createElement('img');
        img.alt = altText || modelName || 'Model Image';
        img.className = className;
        img.loading = 'lazy';
        
        // Set up error handling
        img.onerror = () => this.handleImageError(img, modelName, modelId);
        
        // Set up success handling
        img.onload = () => {
            img.classList.add('loaded');
            // Remove any existing placeholder
            const placeholder = img.parentNode?.querySelector('.elegant-image-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
        };
        
        // Start loading with fallback
        this.preloadImageWithFallback(originalUrl, modelName, modelId)
            .then(url => {
                img.src = url;
            });
        
        return img;
    }

    /**
     * Initialize fallback system styles
     */
    initializeStyles() {
        if (document.getElementById('image-fallback-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'image-fallback-styles';
        style.textContent = `
            .elegant-image-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }
            
            .placeholder-content {
                text-align: center;
                padding: 20px;
            }
            
            .placeholder-icon {
                margin-bottom: 12px;
                opacity: 0.9;
            }
            
            .placeholder-icon svg {
                width: 48px;
                height: 48px;
            }
            
            .placeholder-text {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
                line-height: 1.2;
            }
            
            .placeholder-subtext {
                font-size: 12px;
                opacity: 0.8;
                font-weight: 400;
            }
            
            .model-image-container {
                position: relative;
                overflow: hidden;
            }
            
            .model-image-container img {
                transition: opacity 0.3s ease;
                opacity: 0;
            }
            
            .model-image-container img.loaded {
                opacity: 1;
            }
            
            @media (max-width: 768px) {
                .placeholder-icon svg {
                    width: 40px;
                    height: 40px;
                }
                
                .placeholder-text {
                    font-size: 14px;
                }
                
                .placeholder-subtext {
                    font-size: 11px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance
window.imageFallbackSystem = new ImageFallbackSystem();

// Initialize styles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageFallbackSystem.initializeStyles();
    });
} else {
    window.imageFallbackSystem.initializeStyles();
}

console.log('Image Fallback System loaded');