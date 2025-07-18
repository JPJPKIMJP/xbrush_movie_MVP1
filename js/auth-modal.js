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
                        <button class="auth-modal-close" onclick="authModal.close()">×</button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-mode="login" onclick="authModal.switchMode('login')">로그인</button>
                        <button class="auth-tab" data-mode="signup" onclick="authModal.switchMode('signup')">회원가입</button>
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
                                로그인
                            </button>
                            <button type="button" class="btn btn-outline" onclick="authModal.close()">
                                취소
                            </button>
                        </div>
                        
                        <div class="auth-footer">
                            <p id="authFooterText">
                                계정이 없으신가요? 
                                <a href="#" onclick="authModal.switchMode('signup'); return false;">회원가입</a>
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
        document.getElementById('authSubmitBtn').textContent = isSignup ? '회원가입' : '로그인';
        
        // Update footer
        document.getElementById('authFooterText').innerHTML = isSignup
            ? '이미 계정이 있으신가요? <a href="#" onclick="authModal.switchMode(\'login\'); return false;">로그인</a>'
            : '계정이 없으신가요? <a href="#" onclick="authModal.switchMode(\'signup\'); return false;">회원가입</a>';

        // Clear errors
        this.clearAllErrors();
        
        // Reset form but keep email if switching
        const email = this.emailInput.value;
        this.form.reset();
        this.emailInput.value = email;
    }

    async handleSubmit() {
        // Clear previous errors
        this.clearAllErrors();
        
        // Disable submit button
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = '처리 중...';

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const name = this.nameInput.value.trim();
        const phone = this.phoneInput.value.trim();

        try {
            if (this.mode === 'signup') {
                // Validate signup fields
                if (!name && this.mode === 'signup') {
                    this.showError('nameError', '이름을 입력해주세요.');
                    return;
                }
                
                if (password.length < 6) {
                    this.showError('passwordError', '비밀번호는 6자 이상이어야 합니다.');
                    return;
                }

                // Create user with Firebase Auth
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update display name
                await user.updateProfile({
                    displayName: name
                });

                // Save to Firestore users collection
                await firebase.firestore().collection('users').doc(user.uid).set({
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

                console.log('User created successfully:', user);
                
                // Show success
                if (this.onSuccess) {
                    this.onSuccess(user);
                }
                this.close();
                
            } else {
                // Login
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update last login
                await firebase.firestore().collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log('User logged in successfully:', user);
                
                if (this.onSuccess) {
                    this.onSuccess(user);
                }
                this.close();
            }
            
        } catch (error) {
            console.error('Auth error:', error);
            
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
                    this.showError('passwordError', '비밀번호가 올바르지 않습니다.');
                    break;
                default:
                    this.showError('authGeneralError', error.message || '오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            // Re-enable submit button
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.mode === 'signup' ? '회원가입' : '로그인';
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
        });
    }

    open(options = {}) {
        this.mode = options.mode || 'login';
        this.onSuccess = options.onSuccess || null;
        this.onCancel = options.onCancel || null;
        
        // Reset form
        this.form.reset();
        this.clearAllErrors();
        this.switchMode(this.mode);
        
        // Show modal
        this.modal.style.display = 'flex';
        this.isOpen = true;
        
        // Focus email input
        setTimeout(() => this.emailInput.focus(), 100);
    }

    close() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        
        if (this.onCancel) {
            this.onCancel();
        }
    }
}

// Initialize global instance
let authModal;
document.addEventListener('DOMContentLoaded', () => {
    authModal = new AuthModal();
});

// Auth state management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userDoc = null;
        this.initAuthListener();
    }

    initAuthListener() {
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                // Fetch user document
                try {
                    const doc = await firebase.firestore().collection('users').doc(user.uid).get();
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
                        await firebase.firestore().collection('users').doc(user.uid).set(userData);
                        this.userDoc = userData;
                    }
                } catch (error) {
                    console.error('Error fetching user doc:', error);
                }
            } else {
                this.userDoc = null;
            }
            
            // Dispatch event for other components to listen
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { user: this.currentUser, userDoc: this.userDoc } 
            }));
        });
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            console.log('User logged out');
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
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});