// Auth Modal Component
class AuthModal {
    constructor() {
        this.isOpen = false;
        this.mode = 'login'; // 'login' or 'signup'
        this.onSuccess = null;
        this.onCancel = null;
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="authModal" class="auth-modal-overlay" style="display: none;">
                <div class="auth-modal">
                    <div class="auth-modal-header">
                        <h2 id="authModalTitle">로그인</h2>
                        <button class="auth-modal-close" onclick="window.authModal && window.authModal.close()" title="닫기">×</button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-mode="login" onclick="window.authModal && window.authModal.switchMode('login')">로그인</button>
                        <button class="auth-tab" data-mode="signup" onclick="window.authModal && window.authModal.switchMode('signup')">회원가입</button>
                    </div>
                    
                    <form id="authForm" class="auth-form">
                        <div class="auth-form-group">
                            <label for="authEmail">이메일</label>
                            <input type="email" id="authEmail" class="auth-input" required placeholder="example@email.com">
                            <span class="auth-error" id="emailError"></span>
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="authPassword">비밀번호</label>
                            <input type="password" id="authPassword" class="auth-input" required placeholder="6자 이상 입력">
                            <span class="auth-error" id="passwordError"></span>
                        </div>
                        
                        <div class="auth-form-group" id="nameGroup" style="display: none;">
                            <label for="authName">이름</label>
                            <input type="text" id="authName" class="auth-input" placeholder="실명을 입력해주세요">
                            <span class="auth-error" id="nameError"></span>
                        </div>
                        
                        <div class="auth-form-group" id="phoneGroup" style="display: none;">
                            <label for="authPhone">전화번호 (선택)</label>
                            <input type="tel" id="authPhone" class="auth-input" placeholder="010-1234-5678">
                        </div>
                        
                        <div class="auth-error-general" id="authGeneralError"></div>
                        
                        <div class="auth-actions">
                            <button type="submit" class="btn btn-primary auth-submit" id="authSubmitBtn">
                                <span class="btn-text">로그인</span>
                            </button>
                            <button type="button" class="btn btn-outline" onclick="window.authModal && window.authModal.close()">
                                취소
                            </button>
                        </div>
                        
                        <div class="auth-footer">
                            <p id="authFooterText">
                                계정이 없으신가요? 
                                <a href="#" onclick="window.authModal && window.authModal.switchMode('signup'); return false;">회원가입</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Store references
        this.modal = document.getElementById('authModal');
        this.form = document.getElementById('authForm');
        this.emailInput = document.getElementById('authEmail');
        this.passwordInput = document.getElementById('authPassword');
        this.nameInput = document.getElementById('authName');
        this.phoneInput = document.getElementById('authPhone');
        this.submitBtn = document.getElementById('authSubmitBtn');
    }

    attachEventListeners() {
        // Form submit
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Clear errors on input
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearError(input.id);
            });
        });
    }

    switchMode(mode) {
        this.mode = mode;
        
        // Update UI
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Update form
        const isSignup = mode === 'signup';
        document.getElementById('authModalTitle').textContent = isSignup ? '회원가입' : '로그인';
        document.getElementById('nameGroup').style.display = isSignup ? 'block' : 'none';
        document.getElementById('phoneGroup').style.display = isSignup ? 'block' : 'none';
        const submitBtnText = document.querySelector('#authSubmitBtn .btn-text') || document.getElementById('authSubmitBtn');
        submitBtnText.textContent = isSignup ? '회원가입' : '로그인';
        
        // Update footer with animation
        const footerText = document.getElementById('authFooterText');
        footerText.style.opacity = '0';
        setTimeout(() => {
            footerText.innerHTML = isSignup
                ? '이미 계정이 있으신가요? <a href="#" onclick="window.authModal && window.authModal.switchMode(\'login\'); return false;">로그인</a>'
                : '계정이 없으신가요? <a href="#" onclick="window.authModal && window.authModal.switchMode(\'signup\'); return false;">회원가입</a>';
            footerText.style.opacity = '1';
        }, 150);

        // Clear errors
        this.clearAllErrors();
        
        // Reset form but keep email if switching
        const email = this.emailInput.value;
        this.form.reset();
        this.emailInput.value = email;
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.auth && window.firebase.firestore) {
                resolve();
            } else {
                window.addEventListener('firebaseReady', () => resolve(), { once: true });
                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000);
            }
        });
    }

    async handleSubmit() {
        // Clear previous errors
        this.clearAllErrors();
        
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
            this.showError('authGeneralError', 'Firebase가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
            console.error('Firebase not initialized:', {
                firebase: !!window.firebase,
                auth: !!(window.firebase && window.firebase.auth),
                firestore: !!(window.firebase && window.firebase.firestore)
            });
            return;
        }
        
        // Disable submit button with loading state
        this.submitBtn.disabled = true;
        const btnText = this.submitBtn.querySelector('.btn-text') || this.submitBtn;
        const originalText = btnText.textContent;
        btnText.innerHTML = '<span style="display: inline-block; animation: pulse 1.5s infinite;">처리 중...</span>';

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const name = this.nameInput.value.trim();
        const phone = this.phoneInput.value.trim();

        console.log('Attempting authentication:', { email, mode: this.mode });

        try {
            if (this.mode === 'signup') {
                // Validate signup fields
                if (!name && this.mode === 'signup') {
                    this.showError('nameError', '이름을 입력해주세요.');
                    this.submitBtn.disabled = false;
                    const btnText = this.submitBtn.querySelector('.btn-text') || this.submitBtn;
                    btnText.textContent = this.mode === 'signup' ? '회원가입' : '로그인';
                    return;
                }
                
                if (password.length < 6) {
                    this.showError('passwordError', '비밀번호는 6자 이상이어야 합니다.');
                    this.submitBtn.disabled = false;
                    const btnText = this.submitBtn.querySelector('.btn-text') || this.submitBtn;
                    btnText.textContent = this.mode === 'signup' ? '회원가입' : '로그인';
                    return;
                }

                // Set persistence before creating user
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                
                // Create user with Firebase Auth
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update display name
                await user.updateProfile({
                    displayName: name
                });
                
                // Send email verification
                await user.sendEmailVerification();
                console.log('Verification email sent to:', email);

                // Save to Firestore users collection
                // Use batch write to ensure atomicity
                const batch = firebase.firestore().batch();
                const userDocRef = firebase.firestore().collection('users').doc(user.uid);
                
                batch.set(userDocRef, {
                    uid: user.uid,
                    email: email,
                    name: name,
                    phone: phone || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    role: 'user',
                    termsAgreed: false, // Will be set after terms agreement
                    termsAgreedAt: null,
                    termsAgreements: null,
                    videoCreations: [],
                    modelProfile: null
                });
                
                await batch.commit();

                console.log('User created successfully:', user);
                
                // Show success animation with verification message
                this.showSuccessAnimation();
                
                // Show verification message
                this.showError('authGeneralError', `가입이 완료되었습니다! ${email}로 전송된 확인 이메일을 확인해주세요.`);
                const errorElement = document.getElementById('authGeneralError');
                if (errorElement) {
                    errorElement.style.color = '#4CAF50'; // Green color for success
                }
                
                // Show success
                if (this.onSuccess) {
                    this.onSuccess(user);
                }
                
                // Keep modal open for user to see the message
                setTimeout(() => {
                    this.close();
                }, 3000);
                
            } else {
                // Login
                // First, set persistence for this session
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Check if email is verified (optional warning for now)
                if (!user.emailVerified && window.AppConfig && window.AppConfig.isFeatureEnabled('requireEmailVerification')) {
                    // Only block if email verification is required
                    await firebase.auth().signOut();
                    this.showError('authGeneralError', '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
                    
                    // Add resend verification button
                    const errorElement = document.getElementById('authGeneralError');
                    if (errorElement) {
                        errorElement.innerHTML += '<br><a href="#" onclick="window.authModal.resendVerification(\'' + email + '\', \'' + password + '\'); return false;">인증 이메일 다시 보내기</a>';
                    }
                    return;
                }

                // Verify user exists in database and update/create document
                const userDocRef = firebase.firestore().collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();
                
                if (userDoc.exists) {
                    // Update last login
                    await userDocRef.update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('User document updated');
                } else {
                    // For users created through Firebase Console or other means
                    // Create their user document
                    await userDocRef.set({
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || user.email.split('@')[0],
                        phone: null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'user',
                        termsAgreed: false,
                        termsAgreedAt: null,
                        termsAgreements: null,
                        videoCreations: [],
                        modelProfile: null
                    });
                    console.log('Created user document for existing Firebase user');
                }

                console.log('User logged in successfully:', user);
                
                // Show success animation
                this.showSuccessAnimation();
                
                if (this.onSuccess) {
                    this.onSuccess(user);
                }
                
                setTimeout(() => {
                    this.close();
                }, 300);
            }
            
        } catch (error) {
            console.error('Auth error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            
            // Show error message
            switch (error.code) {
                case 'auth/email-already-in-use':
                    this.showError('emailError', '이미 사용 중인 이메일입니다.');
                    break;
                case 'auth/invalid-email':
                    this.showError('emailError', '올바른 이메일 형식이 아닙니다.');
                    break;
                case 'auth/weak-password':
                    this.showError('passwordError', '비밀번호가 너무 약합니다.');
                    break;
                case 'auth/user-not-found':
                    this.showError('authGeneralError', '등록되지 않은 이메일입니다.');
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    this.showError('passwordError', '비밀번호가 올바르지 않습니다.');
                    break;
                case 'auth/network-request-failed':
                    this.showError('authGeneralError', '네트워크 연결을 확인해주세요.');
                    break;
                case 'auth/too-many-requests':
                    this.showError('authGeneralError', '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
                    break;
                case 'auth/user-disabled':
                    this.showError('authGeneralError', '이 계정은 비활성화되었습니다.');
                    break;
                case 'auth/operation-not-allowed':
                    this.showError('authGeneralError', '이메일/비밀번호 로그인이 비활성화되어 있습니다.');
                    break;
                default:
                    this.showError('authGeneralError', error.message || '오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            // Re-enable submit button
            this.submitBtn.disabled = false;
            const btnText = this.submitBtn.querySelector('.btn-text') || this.submitBtn;
            btnText.textContent = this.mode === 'signup' ? '회원가입' : '로그인';
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearError(inputId) {
        const errorMap = {
            'authEmail': 'emailError',
            'authPassword': 'passwordError',
            'authName': 'nameError'
        };
        
        const errorId = errorMap[inputId];
        if (errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }
    }

    clearAllErrors() {
        const errorElements = this.form.querySelectorAll('.auth-error, .auth-error-general');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
            el.style.color = ''; // Reset color
        });
    }
    
    async resendVerification(email, password) {
        try {
            // Sign in temporarily to resend verification
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                await user.sendEmailVerification();
                this.showError('authGeneralError', '인증 이메일이 다시 전송되었습니다. 이메일을 확인해주세요.');
                const errorElement = document.getElementById('authGeneralError');
                if (errorElement) {
                    errorElement.style.color = '#4CAF50'; // Green color for success
                }
            }
            
            // Sign out again
            await firebase.auth().signOut();
        } catch (error) {
            console.error('Error resending verification:', error);
            this.showError('authGeneralError', '인증 이메일 전송에 실패했습니다.');
        }
    }

    open(options = {}) {
        this.mode = options.mode || 'login';
        this.onSuccess = options.onSuccess || null;
        this.onCancel = options.onCancel || null;
        
        // Reset form
        this.form.reset();
        this.clearAllErrors();
        this.switchMode(this.mode);
        
        // Show modal with animation
        this.modal.style.display = 'flex';
        this.isOpen = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus email input
        setTimeout(() => {
            this.emailInput.focus();
            // Add entrance animation class
            this.modal.querySelector('.auth-modal').classList.add('modal-open');
        }, 50);
    }

    showSuccessAnimation() {
        const successOverlay = document.createElement('div');
        successOverlay.className = 'auth-success-overlay';
        document.body.appendChild(successOverlay);
        
        setTimeout(() => {
            if (successOverlay.parentNode) {
                successOverlay.remove();
            }
        }, 600);
    }

    close() {
        // Add exit animation
        const modalContent = this.modal.querySelector('.auth-modal');
        modalContent.style.animation = 'modalSlideOut 0.3s ease-in';
        this.modal.style.animation = 'fadeOut 0.3s ease-in';
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.isOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            if (this.onCancel) {
                this.onCancel();
            }
        }, 280);
    }
}

// Initialize global instance
let authModal;

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authModal = new AuthModal();
        window.authModal = authModal; // Make it globally accessible
    });
} else {
    // DOM is already loaded
    authModal = new AuthModal();
    window.authModal = authModal;
}

// Auth state management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userDoc = null;
        this.initAuthListener();
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.auth && window.firebase.firestore) {
                resolve();
            } else {
                window.addEventListener('firebaseReady', () => resolve(), { once: true });
                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000);
            }
        });
    }

    async initAuthListener() {
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        // Ensure Firebase is ready before setting up auth listener
        if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
            console.error('Firebase not available after waiting');
            return;
        }
        
        try {
            firebase.auth().onAuthStateChanged(async (user) => {
                this.currentUser = user;
                
                if (user) {
                    // Fetch user document
                    try {
                        const db = window.firebaseDB || firebase.firestore();
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            this.userDoc = doc.data();
                            console.log('User logged in:', this.userDoc);
                        } else {
                            console.log('User document not found, creating...');
                            // Create basic user doc if it doesn't exist
                            const userData = {
                                uid: user.uid,
                                email: user.email,
                                name: user.displayName || user.email.split('@')[0],
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                                role: 'user',
                                termsAgreed: false,
                                termsAgreedAt: null,
                                termsAgreements: null,
                                videoCreations: [],
                                modelProfile: null
                            };
                            await db.collection('users').doc(user.uid).set(userData);
                            this.userDoc = userData;
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
                
                // Dispatch event for other components to listen
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { user: this.currentUser, userDoc: this.userDoc } 
                }));
            });
        } catch (error) {
            console.error('Error setting up auth listener:', error);
            // Retry after a delay
            setTimeout(() => this.initAuthListener(), 500);
        }
    }

    async logout() {
        try {
            console.log('AuthManager: Starting logout...');
            
            // Sign out first
            await firebase.auth().signOut();
            
            // Then clear persistence for next session
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
            
            // Clear local state
            this.currentUser = null;
            this.userDoc = null;
            
            // Wait for auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('AuthManager: User logged out');
            
            // Reload page to reset state
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    async hasAgreedToTerms() {
        if (!this.userDoc) return false;
        return this.userDoc.termsAgreed === true;
    }

    async updateTermsAgreement(agreements) {
        if (!this.currentUser) return;
        
        try {
            await firebase.firestore().collection('users').doc(this.currentUser.uid).update({
                termsAgreed: true,
                termsAgreedAt: firebase.firestore.FieldValue.serverTimestamp(),
                termsAgreements: agreements
            });
            
            // Update local cache
            this.userDoc.termsAgreed = true;
            this.userDoc.termsAgreements = agreements;
        } catch (error) {
            console.error('Error updating terms agreement:', error);
            throw error;
        }
    }
}

// Initialize auth manager
let authManager;

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager = new AuthManager();
        window.authManager = authManager; // Make it globally accessible
    });
} else {
    // DOM is already loaded
    authManager = new AuthManager();
    window.authManager = authManager;
}