/**
 * Auth Header Component
 * Shared authentication UI for all pages
 */

class AuthHeader {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.userDoc = null;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Wait for Firebase to be ready
        if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Also wait for Firebase to be fully initialized
        try {
            // Test if Firebase is actually initialized by checking auth
            const auth = firebase.auth();
            if (!auth) {
                setTimeout(() => this.init(), 100);
                return;
            }
        } catch (error) {
            console.log('Firebase not ready yet, retrying...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                try {
                    // Ensure Firestore is ready
                    if (window.firebaseDB || firebase.firestore) {
                        const db = window.firebaseDB || firebase.firestore();
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            this.userDoc = doc.data();
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user doc:', error);
                    // Retry once after a delay if it's an initialization error
                    if (error.message && error.message.includes('Firebase')) {
                        setTimeout(async () => {
                            try {
                                const db = window.firebaseDB || firebase.firestore();
                                const doc = await db.collection('users').doc(user.uid).get();
                                if (doc.exists) {
                                    this.userDoc = doc.data();
                                    this.updateHeaderUI();
                                }
                            } catch (retryError) {
                                console.error('Retry failed:', retryError);
                            }
                        }, 1000);
                    }
                }
            } else {
                this.userDoc = null;
            }
            
            this.updateHeaderUI();
        });
        
        // Add resize listener for mobile menu
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    updateHeaderUI() {
        // Find the header nav
        const headerNav = document.querySelector('.header-nav');
        if (!headerNav) return;
        
        // Remove existing auth UI
        const existingAuthUI = document.getElementById('headerAuthUI');
        if (existingAuthUI) {
            existingAuthUI.remove();
        }
        
        // Create auth UI HTML
        let authHTML = '';
        
        if (this.currentUser) {
            // User is logged in
            const displayName = this.userDoc?.name || 
                               this.currentUser.displayName || 
                               this.currentUser.email?.split('@')[0] || 
                               '사용자';
            
            authHTML = `
                <div id="headerAuthUI" class="header-auth-ui">
                    <div class="user-menu">
                        <button class="user-menu-toggle" onclick="authHeader.toggleUserMenu(event)">
                            <span class="user-avatar">${displayName.charAt(0).toUpperCase()}</span>
                            <span class="user-name">${displayName}</span>
                            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 12 12">
                                <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            </svg>
                        </button>
                        <div class="user-dropdown" id="userDropdown">
                            <div class="user-info">
                                <div class="user-email">${this.currentUser.email}</div>
                                <div class="user-role">${this.userDoc?.role === 'model' ? '등록 모델' : '일반 사용자'}</div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="my-videos.html" class="dropdown-item">내 영상</a>
                            <a href="account.html" class="dropdown-item">계정 설정</a>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item logout" onclick="authHeader.logout()">로그아웃</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // User is not logged in
            authHTML = `
                <div id="headerAuthUI" class="header-auth-ui">
                    <button class="btn-login" onclick="authHeader.showLogin()">로그인</button>
                </div>
            `;
        }
        
        // Insert auth UI into header
        headerNav.insertAdjacentHTML('beforeend', authHTML);
        
        // For mobile, also update mobile menu if it exists
        this.updateMobileMenu();
    }

    updateMobileMenu() {
        const mobileNav = document.getElementById('headerNav');
        if (!mobileNav) return;
        
        // Remove existing mobile auth UI
        const existingMobileAuth = document.getElementById('mobileAuthUI');
        if (existingMobileAuth) {
            existingMobileAuth.remove();
        }
        
        // Create mobile auth UI
        let mobileAuthHTML = '';
        
        if (this.currentUser) {
            const displayName = this.userDoc?.name || 
                               this.currentUser.displayName || 
                               this.currentUser.email?.split('@')[0] || 
                               '사용자';
            
            mobileAuthHTML = `
                <div id="mobileAuthUI" class="mobile-auth-ui">
                    <div class="mobile-user-info">
                        <div class="user-avatar-large">${displayName.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <div class="user-name">${displayName}</div>
                            <div class="user-email">${this.currentUser.email}</div>
                        </div>
                    </div>
                    <div class="mobile-menu-divider"></div>
                    <a href="my-videos.html" class="nav-link">내 영상</a>
                    <a href="account.html" class="nav-link">계정 설정</a>
                    <div class="mobile-menu-divider"></div>
                    <button class="btn-logout-mobile" onclick="authHeader.logout()">로그아웃</button>
                </div>
            `;
        } else {
            mobileAuthHTML = `
                <div id="mobileAuthUI" class="mobile-auth-ui">
                    <button class="btn-login-mobile" onclick="authHeader.showLogin()">로그인</button>
                </div>
            `;
        }
        
        // Append to mobile nav
        mobileNav.insertAdjacentHTML('beforeend', mobileAuthHTML);
    }

    toggleUserMenu(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            // Close on outside click
            const closeDropdown = (e) => {
                if (!e.target.closest('.user-menu')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            if (dropdown.classList.contains('show')) {
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 0);
            }
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('headerNav');
        const menuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenu && menuToggle) {
            mobileMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    }

    showLogin() {
        // Close mobile menu if open
        this.closeMobileMenu();
        
        // Show auth modal
        if (window.authModal) {
            window.authModal.open({
                mode: 'login',
                onSuccess: (user) => {
                    console.log('Login successful');
                    // UI will update automatically via auth state listener
                }
            });
        } else {
            console.error('Auth modal not loaded');
        }
    }

    async logout() {
        if (confirm('로그아웃 하시겠습니까?')) {
            try {
                console.log('Starting logout process...');
                
                // Clear any auth persistence
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
                
                // Sign out
                await firebase.auth().signOut();
                
                // Wait a moment for auth state to propagate
                await new Promise(resolve => setTimeout(resolve, 500));
                
                console.log('User logged out successfully');
                
                // Clear any cached data
                if (window.authManager) {
                    window.authManager.currentUser = null;
                    window.authManager.userDoc = null;
                }
                
                // Redirect to home page
                window.location.href = 'index.html';
                
            } catch (error) {
                console.error('Logout error:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserDoc() {
        return this.userDoc;
    }
}

// Initialize global instance
const authHeader = new AuthHeader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authHeader.init());
} else {
    authHeader.init();
}