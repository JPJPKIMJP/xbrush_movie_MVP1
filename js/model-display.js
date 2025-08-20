/**
 * Model Display Component
 * Handles rendering model cards and showcase on main page
 */

class ModelDisplay {
    constructor() {
        this.modelsContainer = null;
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentPage = 1;
        this.modelsPerPage = 12; // 3x4 grid on desktop
        this.allModels = [];
        this.filteredModels = [];
    }

    /**
     * Initialize the model display
     */
    init(containerId) {
        this.modelsContainer = document.getElementById(containerId);
        if (!this.modelsContainer) {
            console.error('Models container not found:', containerId);
            return;
        }

        this.loadAndDisplayModels();
        this.setupEventListeners();
        this.setupRealtimeUpdates();
    }

    /**
     * Load and display models
     */
    async loadAndDisplayModels() {
        if (!window.modelStorageAdapter) {
            console.error('ModelStorageAdapter not initialized');
            this.modelsContainer.innerHTML = '<div class="error-state">저장소가 초기화되지 않았습니다. 페이지를 새로고침해주세요.</div>';
            return;
        }

        try {
            // Show loading state
            this.modelsContainer.innerHTML = '<div class="loading-state">모델을 불러오는 중...</div>';
            
            // Wait for Firebase to initialize if needed
            let retries = 0;
            while ((!window.firebaseDB || !window.firebase || !window.firebase.firestore) && retries < 20) {
                console.log('Waiting for Firebase initialization... (attempt ' + (retries + 1) + ')');
                await new Promise(resolve => setTimeout(resolve, 200));
                retries++;
            }
            
            if (!window.firebaseDB && window.firebase && window.firebase.firestore) {
                // Initialize firebaseDB if firebase is ready but firebaseDB isn't set
                window.firebaseDB = firebase.firestore();
            }
            
            // Get active models using the adapter
            const allModels = await window.modelStorageAdapter.getActiveModels();
            
            // Filter out premium models (only show basic models)
            const models = allModels.filter(model => 
                !model.tier || model.tier === 'basic'
            );
            
            if (models.length === 0) {
                this.displayEmptyState();
                return;
            }

            // Sort models
            const sortedModels = this.sortModels(models, this.currentSort);
            
            // Filter models
            const filteredModels = this.filterModels(sortedModels, this.currentFilter);
            
            // Store filtered models for pagination
            this.allModels = sortedModels;
            this.filteredModels = filteredModels;
            
            // Reset to first page when loading new data
            this.currentPage = 1;
            
            // Display models with pagination
            await this.displayModelsWithPagination();
        } catch (error) {
            console.error('Error loading models:', error);
            console.error('Error details:', error.message);
            console.error('Firebase status:', window.firebaseDB ? 'initialized' : 'not initialized');
            this.modelsContainer.innerHTML = `<div class="error-state">
                모델을 불러오는 중 오류가 발생했습니다.<br>
                <small>${error.message}</small><br>
                <button onclick="window.modelDisplay.loadAndDisplayModels()" style="margin-top: 10px;">다시 시도</button>
            </div>`;
        }
    }

    /**
     * Display empty state
     */
    displayEmptyState() {
        this.modelsContainer.innerHTML = `
            <div class="empty-models-state">
                <div class="empty-icon">👥</div>
                <h3>아직 등록된 모델이 없습니다</h3>
                <p>첫 번째 AI 모델이 되어보세요!</p>
                <a href="model-register.html" class="btn btn-primary">모델 등록하기</a>
            </div>
        `;
    }

    /**
     * Display models with pagination
     */
    async displayModelsWithPagination() {
        const startIndex = (this.currentPage - 1) * this.modelsPerPage;
        const endIndex = startIndex + this.modelsPerPage;
        const modelsToDisplay = this.filteredModels.slice(startIndex, endIndex);
        
        // Create model cards
        const modelsHTML = [];
        for (const model of modelsToDisplay) {
            modelsHTML.push(await this.createModelCard(model));
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(this.filteredModels.length / this.modelsPerPage);
        
        const paginationHTML = this.createPaginationControls(totalPages);
        
        this.modelsContainer.innerHTML = `
            <div class="models-grid">
                ${modelsHTML.join('')}
            </div>
            ${paginationHTML}
        `;

        // Add click handlers
        this.attachCardClickHandlers();
        this.attachPaginationHandlers();
    }
    
    /**
     * Create pagination controls
     */
    createPaginationControls(totalPages) {
        if (totalPages <= 1) return '';
        
        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn pagination-prev" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    data-page="${this.currentPage - 1}">
                이전
            </button>
        `;
        
        // Page numbers
        paginationHTML += '<div class="pagination-numbers">';
        
        // Show first page always
        if (this.currentPage > 3) {
            paginationHTML += `
                <button class="pagination-btn pagination-number" data-page="1">1</button>
                ${this.currentPage > 4 ? '<span class="pagination-ellipsis">...</span>' : ''}
            `;
        }
        
        // Show pages around current page
        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
            paginationHTML += `
                <button class="pagination-btn pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `;
        }
        
        // Show last page always
        if (this.currentPage < totalPages - 2) {
            paginationHTML += `
                ${this.currentPage < totalPages - 3 ? '<span class="pagination-ellipsis">...</span>' : ''}
                <button class="pagination-btn pagination-number" data-page="${totalPages}">${totalPages}</button>
            `;
        }
        
        paginationHTML += '</div>';
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn pagination-next" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    data-page="${this.currentPage + 1}">
                다음
            </button>
        `;
        
        // Page info
        paginationHTML += `
            <div class="pagination-info">
                ${this.filteredModels.length}개 중 ${(this.currentPage - 1) * this.modelsPerPage + 1}-${Math.min(this.currentPage * this.modelsPerPage, this.filteredModels.length)}개 표시
            </div>
        `;
        
        paginationHTML += '</div>';
        
        return paginationHTML;
    }
    
    /**
     * Attach pagination handlers
     */
    attachPaginationHandlers() {
        const paginationButtons = document.querySelectorAll('.pagination-btn:not([disabled])');
        paginationButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const page = parseInt(e.target.getAttribute('data-page'));
                await this.goToPage(page);
            });
        });
    }
    
    /**
     * Go to specific page
     */
    async goToPage(page, updateURL = true) {
        this.currentPage = page;
        
        // Update URL state only if not called from URL state listener
        if (updateURL && window.urlStateManager) {
            window.urlStateManager.setPage(page);
        }
        
        await this.displayModelsWithPagination();
        
        // Scroll to top of models section
        const modelsSection = document.querySelector('.models-section');
        if (modelsSection) {
            modelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * Display models grid (legacy method for backward compatibility)
     */
    async displayModels(models) {
        this.filteredModels = models;
        this.currentPage = 1;
        await this.displayModelsWithPagination();
    }

    /**
     * Create model card HTML
     */
    async createModelCard(model) {
        const {
            id,
            personalInfo = {},
            profile = {},
            portfolio = {},
            pricing = {},
            ratings = {},
            stats = {},
            availability = {},
            flags = {},
            contract = {}
        } = model;

        // Extract data with enhanced schema support
        const name = personalInfo.name || profile?.displayName || '이름 없음';
        const tagline = profile?.tagline || personalInfo.intro || '프로페셔널 AI 모델';
        const specialties = profile?.specialties || personalInfo.categories || [];
        // Use multiple fallbacks for thumbnail
        let thumbnail = portfolio?.thumbnailUrl || personalInfo?.thumbnailUrl || personalInfo?.profileImage || profile?.profileImage;
        
        // Local fallback image
        const localFallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDQwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjdGQUZDIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iNjAiIGZpbGw9IiNFMkU4RjAiLz4KPHBhdGggZD0iTTEyMCAzMjBDMTIwIDI4MC42NTQgMTUxLjM0IDI0OSAxOTAgMjQ5SDIxMEMyNDkuMzQ2IDI0OSAyODEgMjgwLjY1NCAyODEgMzIwVjM4MEgxMjBWMzIwWiIgZmlsbD0iI0UyRThGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjQ1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjQTBBRUM0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BSSBNb2RlbDwvdGV4dD4KPC9zdmc+';
        
        if (!thumbnail) {
            thumbnail = localFallback;
        }
        
        // Skip caching for now - use original URLs
        // TODO: Fix blob URL persistence issue
        
        const basePrice = pricing?.basePrice || pricing?.packages?.[0]?.price || 100000;
        const rating = ratings?.overall || 0;
        const reviewCount = ratings?.totalReviews || 0;
        const completedProjects = stats?.completedProjects || 0;
        const responseTime = stats?.responseTime || 2;
        const isAvailable = availability?.status === 'available';
        
        // Extract social media links
        const socialMedia = model.socialMedia || {};
        const instagramHandle = socialMedia.instagram || `@${name.toLowerCase().replace(/\s+/g, '')}`;
        const isVerified = profile?.verificationStatus?.identity || false;
        const isPremium = profile?.verificationStatus?.premium || false;
        const isNew = flags?.newModel || false;
        const tier = model.tier || 'basic';

        // Format categories/specialties
        const specialtyTags = specialties.slice(0, 3).map(spec => {
            const specMap = {
                'fashion': '패션',
                'beauty': '뷰티',
                'lifestyle': '라이프스타일',
                'food': '푸드',
                'tech': '테크'
            };
            return `<span class="specialty-tag">${specMap[spec] || spec}</span>`;
        }).join('');

        // Trust badges
        const trustBadges = [];
        if (isVerified) trustBadges.push('<span class="trust-badge verified">✓ 인증</span>');
        if (tier === 'premium') trustBadges.push('<span class="trust-badge premium">⭐ 프리미엄</span>');
        if (tier === 'vip') trustBadges.push('<span class="trust-badge vip">💎 VIP</span>');
        if (rating >= 4.8 && reviewCount >= 10) trustBadges.push('<span class="trust-badge top-rated">🏆 우수</span>');
        
        const trustBadgesHTML = trustBadges.length > 0 ? 
            `<div class="model-trust-badges">${trustBadges.join('')}</div>` : '';

        // Pre-review status
        const hasPreReviewRights = contract.secondConfirm === true;
        const statusClass = hasPreReviewRights ? 'pre-review' : 'fast-response';
        const statusText = hasPreReviewRights ? '검토 필요' : '빠른 진행';
        const statusTooltip = hasPreReviewRights 
            ? '모든 결과물은 모델의 사전 승인이 필요합니다' 
            : `평균 ${responseTime}시간 내 응답`;

        // Format price
        const formattedPrice = new Intl.NumberFormat('ko-KR').format(basePrice);

        return `
            <div class="model-card model-card-commercial" data-model-id="${id}">
                <div class="model-card-image">
                    ${trustBadgesHTML}
                    <div class="model-status-badge ${statusClass}" title="${statusTooltip}"></div>
                    <img src="${thumbnail}" 
                         alt="${name}" 
                         loading="lazy"
                         class="model-thumbnail"
                         onload="this.classList.add('loaded'); this.style.opacity = '1';"
                         onerror="if(window.imageFallbackSystem) { window.imageFallbackSystem.handleImageError(this, '${name}', '${id}'); } else { this.style.display='none'; this.parentElement.innerHTML += '<div class=\\'elegant-image-placeholder\\'><div class=\\'placeholder-content\\'><div class=\\'placeholder-text\\'>${name}</div></div></div>'; }"
                         style="opacity: 0; transition: opacity 0.3s ease;">
                    <div class="model-card-overlay">
                        <div class="overlay-buttons">
                            <button class="overlay-btn primary" onclick="event.stopPropagation(); sessionStorage.setItem('selectedModelForMovie', '${id}'); sessionStorage.setItem('skipToStep2', 'true'); window.location.href = 'index.html#step2';">
                                <span>🎬</span> 동영상 제작
                            </button>
                            <button class="overlay-btn" onclick="event.stopPropagation(); if(window.simpleProfileModal) { window.simpleProfileModal.open('${id}'); } else { console.error('SimpleProfileModal not found'); }">
                                <span>👤</span> 프로필 보기
                            </button>
                        </div>
                    </div>
                    <div class="model-quick-stats">
                        <div class="quick-stat" title="${completedProjects}개 프로젝트 완료">
                            <span class="stat-icon-large">📷</span>
                        </div>
                        <div class="quick-stat" title="${instagramHandle}">
                            <a href="https://instagram.com/${instagramHandle.replace('@', '')}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="sns-link">
                                <img src="images/ig.png" alt="Instagram" class="ig-icon-img" />
                            </a>
                        </div>
                        <div class="quick-stat" title="평점 ${Number(rating || 0).toFixed(1)}">
                            <span class="stat-icon-large">⭐</span>
                        </div>
                    </div>
                </div>
                <div class="model-card-content model-card-content-enhanced">
                    <div class="model-meta-row">
                        <h3 class="model-name">${name}</h3>
                        <span class="model-pre-review-status ${statusClass}">${statusText}</span>
                    </div>
                    <p class="model-intro">${tagline}</p>
                    <div class="model-specialties">
                        ${specialtyTags}
                    </div>
                    <div class="model-card-footer">
                        <div class="model-price-enhanced">
                            <span class="price-currency">₩</span>
                            <span class="price-amount">${formattedPrice}</span>
                            <span class="price-period">부터</span>
                        </div>
                        <div class="model-rating-enhanced">
                            <span class="rating-score">${Number(rating || 0).toFixed(1)}</span>
                            <span class="rating-stars">★</span>
                            <span class="rating-reviews">(${reviewCount})</span>
                        </div>
                    </div>
                    <div class="model-card-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); if(window.showToast) window.showToast('저장 기능은 준비 중입니다.', 'info')">
                            <span>♡</span>
                            <span>저장</span>
                        </button>
                        <button class="action-btn primary" onclick="event.stopPropagation(); window.simpleProfileModal ? window.simpleProfileModal.open('${id}') : window.modelDetailModal.open('${id}')">
                            <span>👁️</span>
                            <span>상세보기</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Sort models
     */
    sortModels(models, sortBy) {
        const sortedModels = [...models];
        
        // Helper function to get tier priority
        const getTierPriority = (tier) => {
            if (tier === 'vip') return 3;
            if (tier === 'premium') return 2;
            return 1; // basic or no tier
        };
        
        switch (sortBy) {
            case 'newest':
                return sortedModels.sort((a, b) => {
                    // First sort by tier
                    const tierDiff = getTierPriority(b.tier) - getTierPriority(a.tier);
                    if (tierDiff !== 0) return tierDiff;
                    // Then by date
                    return new Date(b.registrationDate) - new Date(a.registrationDate);
                });
            case 'oldest':
                return sortedModels.sort((a, b) => {
                    // First sort by tier
                    const tierDiff = getTierPriority(b.tier) - getTierPriority(a.tier);
                    if (tierDiff !== 0) return tierDiff;
                    // Then by date
                    return new Date(a.registrationDate) - new Date(b.registrationDate);
                });
            case 'priceHigh':
                return sortedModels.sort((a, b) => {
                    const priceA = a.pricing?.packages?.find(p => p.id === 'standard')?.price || a.contract?.basePrice || 0;
                    const priceB = b.pricing?.packages?.find(p => p.id === 'standard')?.price || b.contract?.basePrice || 0;
                    return priceB - priceA;
                });
            case 'priceLow':
                return sortedModels.sort((a, b) => {
                    const priceA = a.pricing?.packages?.find(p => p.id === 'standard')?.price || a.contract?.basePrice || 0;
                    const priceB = b.pricing?.packages?.find(p => p.id === 'standard')?.price || b.contract?.basePrice || 0;
                    return priceA - priceB;
                });
            default:
                // Default sort by tier then by newest
                return sortedModels.sort((a, b) => {
                    const tierDiff = getTierPriority(b.tier) - getTierPriority(a.tier);
                    if (tierDiff !== 0) return tierDiff;
                    return new Date(b.registrationDate) - new Date(a.registrationDate);
                });
        }
    }

    /**
     * Filter models
     */
    filterModels(models, filter) {
        if (filter === 'all') {
            return models;
        }
        
        return models.filter(model => {
            const categories = model.personalInfo?.categories || [];
            return categories.includes(filter);
        });
    }

    /**
     * Attach click handlers to model cards
     */
    attachCardClickHandlers() {
        const cards = this.modelsContainer.querySelectorAll('.model-card');
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger on button clicks or overlay
                if (e.target.closest('.view-profile-btn') || e.target.closest('.model-card-overlay')) {
                    e.preventDefault();
                    return;
                }
                
                // Show selection confirmation modal
                const modelId = card.getAttribute('data-model-id');
                this.viewModelProfile(modelId);
            });
        });
    }

    /**
     * View model profile
     */
    viewModelProfile(modelId) {
        console.log('View profile for model:', modelId);
        
        // Store selected model ID
        sessionStorage.setItem('selectedModelId', modelId);
        
        // Create custom confirmation modal
        const modal = document.createElement('div');
        modal.className = 'model-use-confirm-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h3>모델 사용 확인</h3>
                    <p>이 모델을 사용하여 동영상을 제작하시겠습니까?</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="
                            sessionStorage.setItem('selectedModelForMovie', '${modelId}');
                            sessionStorage.setItem('skipToStep2', 'true');
                            window.location.href = 'index.html#step2';
                        ">동영상 제작하기</button>
                        <button class="btn btn-outline" onclick="
                            this.closest('.model-use-confirm-modal').remove();
                            if (window.simpleProfileModal) {
                                window.simpleProfileModal.open('${modelId}');
                            } else if (window.modelDetailModal) {
                                window.modelDetailModal.open('${modelId}');
                            } else {
                                console.error('Profile modal not initialized');
                                if (window.showToast) {
                                    window.showToast('프로필 로딩 중 오류가 발생했습니다.', 'error');
                                }
                            }
                        ">프로필 보기</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#model-use-confirm-styles')) {
            const styles = document.createElement('style');
            styles.id = 'model-use-confirm-styles';
            styles.textContent = `
                .model-use-confirm-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                }
                .model-use-confirm-modal .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .model-use-confirm-modal .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                }
                .model-use-confirm-modal h3 {
                    margin: 0 0 15px 0;
                    font-size: 1.4rem;
                    color: #2d3748;
                }
                .model-use-confirm-modal p {
                    margin: 0 0 25px 0;
                    color: #4a5568;
                    line-height: 1.5;
                }
                .model-use-confirm-modal .modal-actions {
                    display: flex;
                    gap: 12px;
                }
                .model-use-confirm-modal .btn {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .model-use-confirm-modal .btn-primary {
                    background: #667eea;
                    color: white;
                    border: none;
                }
                .model-use-confirm-modal .btn-primary:hover {
                    background: #5a67d8;
                }
                .model-use-confirm-modal .btn-outline {
                    background: white;
                    color: #667eea;
                    border: 2px solid #667eea;
                }
                .model-use-confirm-modal .btn-outline:hover {
                    background: #f7fafc;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
    }

    /**
     * Setup event listeners for filters and sorting
     */
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.currentFilter = filter;
                
                // Update active state
                document.querySelectorAll('[data-filter]').forEach(btn => 
                    btn.classList.remove('active')
                );
                e.target.classList.add('active');
                
                this.loadAndDisplayModels();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('modelSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadAndDisplayModels();
            });
        }
        
        // Per page dropdown
        const perPageSelect = document.getElementById('perPageSelect');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.modelsPerPage = parseInt(e.target.value);
                this.currentPage = 1; // Reset to first page
                if (this.filteredModels.length > 0) {
                    this.displayModelsWithPagination();
                }
            });
        }
    }

    /**
     * Setup real-time updates from Firebase
     */
    setupRealtimeUpdates() {
        if (!window.modelStorageAdapter || !window.modelStorageAdapter.firebaseStorage) {
            console.log('Firebase adapter not available for real-time updates');
            return;
        }

        // Subscribe to model changes through the adapter
        const unsubscribe = window.modelStorageAdapter.firebaseStorage.subscribeToModels((models) => {
            console.log('Real-time update: Models changed', models.length);
            
            // Filter only active models and basic tier
            const activeModels = models.filter(model => 
                model.status === 'active' && (!model.tier || model.tier === 'basic')
            );
            
            if (activeModels.length === 0) {
                this.displayEmptyState();
                return;
            }

            // Sort and display models
            const sortedModels = this.sortModels(activeModels, this.currentSort);
            this.displayModels(sortedModels);
        });

        // Store unsubscribe function for cleanup if needed
        this.unsubscribe = unsubscribe;
        console.log('Real-time updates initialized');
    }

    /**
     * Refresh display
     */
    refresh() {
        this.loadAndDisplayModels();
    }
}

// Create global instance
window.modelDisplay = new ModelDisplay();