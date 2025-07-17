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
        this.initialLoad = true; // Track if this is the first load
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

        // Check URL parameters for page number
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        if (pageParam && !isNaN(pageParam)) {
            this.currentPage = parseInt(pageParam);
        }

        // Listen for browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.currentPage = event.state.page;
                this.displayModelsWithPagination();
            } else {
                // No state, check URL
                const params = new URLSearchParams(window.location.search);
                const page = params.get('page');
                this.currentPage = page ? parseInt(page) : 1;
                this.displayModelsWithPagination();
            }
        });

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
            
            // Wait a bit for Firebase to initialize if needed
            if (!window.firebaseDB) {
                console.log('Waiting for Firebase initialization...');
                await new Promise(resolve => setTimeout(resolve, 2000));
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
            
            // Don't reset page if we're loading from URL parameter
            // Only reset to page 1 when filter/sort changes
            if (!this.initialLoad) {
                this.currentPage = 1;
            }
            this.initialLoad = false;
            
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
    async goToPage(page) {
        this.currentPage = page;
        
        // Update URL with page parameter
        const url = new URL(window.location);
        if (page > 1) {
            url.searchParams.set('page', page);
        } else {
            url.searchParams.delete('page'); // Remove page param for page 1
        }
        
        // Update browser history
        window.history.pushState({ page: page }, '', url);
        
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
            flags = {}
        } = model;

        // Extract data with enhanced schema support
        const name = personalInfo.name || profile?.displayName || '이름 없음';
        const tagline = profile?.tagline || personalInfo.intro || '프로페셔널 AI 모델';
        const specialties = profile?.specialties || personalInfo.categories || [];
        let thumbnail = portfolio?.thumbnailUrl || personalInfo?.thumbnailUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop';
        
        // Skip caching for now - use original URLs
        // TODO: Fix blob URL persistence issue
        
        const basePrice = pricing?.basePrice || pricing?.packages?.[0]?.price || 100000;
        const rating = ratings?.overall || 0;
        const reviewCount = ratings?.totalReviews || 0;
        const completedProjects = stats?.completedProjects || 0;
        const responseTime = stats?.responseTime || 2;
        const isAvailable = availability?.status === 'available';
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
        // Don't show tier badges in main page since we only show basic models
        if (rating >= 4.8 && reviewCount >= 10) trustBadges.push('<span class="trust-badge top-rated">🏆 우수</span>');
        
        const trustBadgesHTML = trustBadges.length > 0 ? 
            `<div class="model-trust-badges">${trustBadges.join('')}</div>` : '';

        // Status badge
        const statusClass = isAvailable ? '' : 'busy';
        const availabilityText = isAvailable ? '즉시 가능' : '예약 중';

        // Format price
        const formattedPrice = new Intl.NumberFormat('ko-KR').format(basePrice);

        return `
            <div class="model-card model-card-commercial" data-model-id="${id}">
                <div class="model-card-image">
                    ${trustBadgesHTML}
                    <div class="model-status-badge ${statusClass}"></div>
                    <img src="${thumbnail}" 
                         alt="${name}" 
                         loading="lazy"
                         onload="this.classList.add('loaded');"
                         onerror="this.style.display='none'; this.parentElement.innerHTML += '<div class=\\'image-error\\'><div class=\\'image-error-icon\\'>🖼️</div><div>이미지 로드 실패</div></div>';">
                    <div class="model-card-overlay">
                        <button class="view-profile-btn">프로필 보기</button>
                    </div>
                    <div class="model-quick-stats">
                        <div class="quick-stat">
                            <span>📷</span>
                            <span>${completedProjects}개 완료</span>
                        </div>
                        <div class="quick-stat">
                            <span>⏱️</span>
                            <span>${responseTime}시간 응답</span>
                        </div>
                        <div class="quick-stat">
                            <span>⭐</span>
                            <span>${Number(rating || 0).toFixed(1)}점</span>
                        </div>
                    </div>
                </div>
                <div class="model-card-content model-card-content-enhanced">
                    <div class="model-meta-row">
                        <h3 class="model-name">${name}</h3>
                        <span class="model-availability ${statusClass}">${availabilityText}</span>
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
                        <button class="action-btn" onclick="event.stopPropagation(); window.modelDetailModal.handleSave('${id}')">
                            <span>♡</span>
                            <span>저장</span>
                        </button>
                        <button class="action-btn primary" onclick="event.stopPropagation(); window.modelDetailModal.open('${id}')">
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
        
        switch (sortBy) {
            case 'newest':
                return sortedModels.sort((a, b) => 
                    new Date(b.registrationDate) - new Date(a.registrationDate)
                );
            case 'oldest':
                return sortedModels.sort((a, b) => 
                    new Date(a.registrationDate) - new Date(b.registrationDate)
                );
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
                return sortedModels;
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
                // Don't trigger on button clicks
                if (e.target.closest('.view-profile-btn')) {
                    e.preventDefault();
                    const modelId = card.getAttribute('data-model-id');
                    this.viewModelProfile(modelId);
                } else {
                    const modelId = card.getAttribute('data-model-id');
                    this.viewModelProfile(modelId);
                }
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
                            if (window.modelDetailModal) {
                                window.modelDetailModal.open('${modelId}');
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
                
                // Reset to page 1 and remove page param from URL
                this.currentPage = 1;
                const url = new URL(window.location);
                url.searchParams.delete('page');
                window.history.pushState({ page: 1 }, '', url);
                
                this.loadAndDisplayModels();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('modelSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                
                // Reset to page 1 and remove page param from URL
                this.currentPage = 1;
                const url = new URL(window.location);
                url.searchParams.delete('page');
                window.history.pushState({ page: 1 }, '', url);
                
                this.loadAndDisplayModels();
            });
        }
        
        // Per page dropdown
        const perPageSelect = document.getElementById('perPageSelect');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.modelsPerPage = parseInt(e.target.value);
                this.currentPage = 1; // Reset to first page
                
                // Remove page param from URL
                const url = new URL(window.location);
                url.searchParams.delete('page');
                window.history.pushState({ page: 1 }, '', url);
                
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