/**
 * Admin Authentication and Authorization Module
 * Provides secure admin access controls
 */

class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.isAdminUser = false;
        this.adminLevel = null;
        this.permissions = {};
        this.initPromise = null;
    }

    /**
     * Initialize admin authentication
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._initializeAuth();
        return this.initPromise;
    }

    async _initializeAuth() {
        try {
            // Wait for Firebase auth to be ready
            await this.waitForFirebaseAuth();

            // Set up auth state listener
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    await this.handleUserSignIn(user);
                } else {
                    this.handleUserSignOut();
                }
            });

            console.log('Admin Auth initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Admin Auth:', error);
            return false;
        }
    }

    /**
     * Wait for Firebase Auth to be ready
     */
    async waitForFirebaseAuth() {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.auth) {
                resolve();
            } else {
                window.addEventListener('firebaseReady', () => resolve(), { once: true });
                setTimeout(() => resolve(), 5000); // Timeout after 5 seconds
            }
        });
    }

    /**
     * Handle user sign in and check admin status
     */
    async handleUserSignIn(user) {
        try {
            this.currentUser = user;

            // Get custom claims to check admin status
            const idTokenResult = await user.getIdTokenResult();
            const claims = idTokenResult.claims;

            this.isAdminUser = claims.admin === true;
            this.adminLevel = claims.adminLevel || 'none';
            this.permissions = claims.permissions || {};

            console.log('Admin Auth - User signed in:', {
                email: user.email,
                isAdmin: this.isAdminUser,
                adminLevel: this.adminLevel,
                permissions: this.permissions
            });

            // Trigger admin status change event
            window.dispatchEvent(new CustomEvent('adminStatusChanged', {
                detail: {
                    isAdmin: this.isAdminUser,
                    adminLevel: this.adminLevel,
                    permissions: this.permissions
                }
            }));

        } catch (error) {
            console.error('Error handling user sign in:', error);
            this.isAdminUser = false;
            this.adminLevel = null;
            this.permissions = {};
        }
    }

    /**
     * Handle user sign out
     */
    handleUserSignOut() {
        this.currentUser = null;
        this.isAdminUser = false;
        this.adminLevel = null;
        this.permissions = {};

        console.log('Admin Auth - User signed out');

        // Trigger admin status change event
        window.dispatchEvent(new CustomEvent('adminStatusChanged', {
            detail: {
                isAdmin: false,
                adminLevel: null,
                permissions: {}
            }
        }));
    }

    /**
     * Check if current user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if current user has admin privileges
     */
    isAdmin() {
        return this.isAdminUser === true;
    }

    /**
     * Check if current user is super admin
     */
    isSuperAdmin() {
        return this.adminLevel === 'super';
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        return this.permissions[permission] === true;
    }

    /**
     * Require admin access - redirect if not admin
     */
    async requireAdmin(redirectUrl = '/index.html') {
        await this.init();

        if (!this.isAuthenticated()) {
            console.warn('Admin access required - user not authenticated');
            this.redirectToLogin();
            return false;
        }

        if (!this.isAdmin()) {
            console.warn('Admin access required - user not admin');
            this.showAccessDenied();
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
            return false;
        }

        return true;
    }

    /**
     * Require super admin access
     */
    async requireSuperAdmin(redirectUrl = '/admin.html') {
        const hasAdmin = await this.requireAdmin(redirectUrl);
        if (!hasAdmin) return false;

        if (!this.isSuperAdmin()) {
            console.warn('Super admin access required');
            this.showAccessDenied('Super admin privileges required');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
            return false;
        }

        return true;
    }

    /**
     * Require specific permission
     */
    async requirePermission(permission, redirectUrl = '/admin.html') {
        const hasAdmin = await this.requireAdmin(redirectUrl);
        if (!hasAdmin) return false;

        if (!this.hasPermission(permission)) {
            console.warn(`Permission required: ${permission}`);
            this.showAccessDenied(`Permission required: ${permission}`);
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
            return false;
        }

        return true;
    }

    /**
     * Show access denied message
     */
    showAccessDenied(message = 'Access denied. Admin privileges required.') {
        // Create modal or alert
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
            ">
                <h2 style="color: #ff4444; margin-bottom: 20px;">🚫 Access Denied</h2>
                <p style="margin-bottom: 20px; color: #666;">${message}</p>
                <p style="font-size: 14px; color: #999;">Redirecting in 3 seconds...</p>
            </div>
        `;

        document.body.appendChild(modal);

        // Remove modal after 3 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 3000);
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        console.log('Redirecting to login...');
        // You can customize this based on your auth modal implementation
        if (window.authModal) {
            window.authModal.open('login');
        } else {
            alert('Please log in to access admin features');
            window.location.href = '/index.html';
        }
    }

    /**
     * Get current admin status
     */
    getAdminStatus() {
        return {
            isAuthenticated: this.isAuthenticated(),
            isAdmin: this.isAdmin(),
            isSuperAdmin: this.isSuperAdmin(),
            adminLevel: this.adminLevel,
            permissions: { ...this.permissions },
            user: this.currentUser ? {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName
            } : null
        };
    }

    /**
     * Log admin action
     */
    async logAdminAction(action, details = {}) {
        if (!this.isAdmin()) {
            console.warn('Cannot log admin action - user is not admin');
            return;
        }

        try {
            await firebase.firestore().collection('adminLogs').add({
                action: action,
                adminId: this.currentUser.uid,
                adminEmail: this.currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: details,
                userAgent: navigator.userAgent,
                ip: 'client-side' // Note: Real IP would need server-side logging
            });

            console.log('Admin action logged:', action);
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }
}

// Create global instance
window.adminAuth = new AdminAuth();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminAuth.init();
    });
} else {
    window.adminAuth.init();
}

console.log('Admin Auth module loaded');