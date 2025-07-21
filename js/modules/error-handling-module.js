/**
 * Error Handling Module
 * Provides consistent error handling and logging across the application
 */

(function(window) {
    'use strict';

    const ErrorHandlingModule = {
        /**
         * Configuration
         */
        config: {
            logToConsole: true,
            logToServer: false,
            showUserNotifications: true,
            retryAttempts: 3,
            retryDelay: 1000
        },

        /**
         * Error types
         */
        ErrorTypes: {
            NETWORK: 'NETWORK_ERROR',
            VALIDATION: 'VALIDATION_ERROR',
            PERMISSION: 'PERMISSION_ERROR',
            NOT_FOUND: 'NOT_FOUND_ERROR',
            SERVER: 'SERVER_ERROR',
            CLIENT: 'CLIENT_ERROR',
            UNKNOWN: 'UNKNOWN_ERROR'
        },

        /**
         * Initialize error handling
         */
        initialize: function() {
            // Global error handler
            window.addEventListener('error', (e) => {
                this.handleError({
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    error: e.error
                });
            });

            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (e) => {
                this.handleError({
                    message: 'Unhandled Promise Rejection',
                    error: e.reason,
                    promise: e.promise
                });
                e.preventDefault();
            });

            // Override console.error to capture all errors
            const originalError = console.error;
            console.error = (...args) => {
                // Create proper error object for logError
                const errorObj = {
                    type: 'Console Error',
                    message: args.join(' '),
                    context: 'console.error',
                    timestamp: new Date().toISOString(),
                    details: args
                };
                
                // Only log to our system if not already logging
                if (!this._isLogging) {
                    this._isLogging = true;
                    this.logError(errorObj);
                    this._isLogging = false;
                }
                
                // Always call original console.error
                originalError.apply(console, args);
            };
        },

        /**
         * Main error handler
         */
        handleError: function(error, context = '', type = this.ErrorTypes.UNKNOWN) {
            // Create error object
            const errorObj = this.createErrorObject(error, context, type);

            // Log error
            this.logError(errorObj);

            // Show user notification if appropriate
            if (this.shouldNotifyUser(errorObj)) {
                this.notifyUser(errorObj);
            }

            // Report to server if configured
            if (this.config.logToServer) {
                this.reportToServer(errorObj);
            }

            return errorObj;
        },

        /**
         * Create standardized error object
         */
        createErrorObject: function(error, context, type) {
            return {
                type: type,
                message: error.message || error.toString(),
                context: context,
                stack: error.stack || new Error().stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                details: error
            };
        },

        /**
         * Log error
         */
        logError: function(errorObj) {
            if (!this.config.logToConsole) return;
            
            // Handle both error objects and plain objects
            const type = errorObj.type || 'Error';
            const message = errorObj.message || 'Unknown error';
            const context = errorObj.context || '';
            const details = errorObj.details || errorObj;
            const stack = errorObj.stack || '';

            console.group(`🚨 ${type}`);
            console.error('Message:', message);
            if (context) console.error('Context:', context);
            if (details && details !== errorObj) console.error('Details:', details);
            if (stack) console.error('Stack:', stack);
            console.groupEnd();
        },

        /**
         * Determine if user should be notified
         */
        shouldNotifyUser: function(errorObj) {
            if (!this.config.showUserNotifications) return false;

            // Don't show technical errors to users
            const silentErrors = [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured'
            ];

            return !silentErrors.some(msg => errorObj.message.includes(msg));
        },

        /**
         * Notify user of error
         */
        notifyUser: function(errorObj) {
            const userMessage = this.getUserFriendlyMessage(errorObj);
            
            if (window.showToast && typeof window.showToast === 'function') {
                try {
                    window.showToast(userMessage, 'error');
                } catch (e) {
                    console.error('User notification:', userMessage);
                }
            } else {
                console.error('User notification:', userMessage);
            }
        },

        /**
         * Get user-friendly error message
         */
        getUserFriendlyMessage: function(errorObj) {
            const messages = {
                [this.ErrorTypes.NETWORK]: '네트워크 연결을 확인해주세요.',
                [this.ErrorTypes.VALIDATION]: '입력한 정보를 다시 확인해주세요.',
                [this.ErrorTypes.PERMISSION]: '권한이 없습니다.',
                [this.ErrorTypes.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
                [this.ErrorTypes.SERVER]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                [this.ErrorTypes.CLIENT]: '오류가 발생했습니다. 페이지를 새로고침해주세요.',
                [this.ErrorTypes.UNKNOWN]: '예기치 않은 오류가 발생했습니다.'
            };

            return messages[errorObj.type] || messages[this.ErrorTypes.UNKNOWN];
        },

        /**
         * Report error to server
         */
        reportToServer: async function(errorObj) {
            try {
                // In production, this would send to error tracking service
                console.log('Would report to server:', errorObj);
            } catch (e) {
                console.error('Failed to report error to server:', e);
            }
        },

        /**
         * Wrap function with error handling
         */
        wrapFunction: function(fn, context = '') {
            return (...args) => {
                try {
                    const result = fn.apply(this, args);
                    
                    // Handle promises
                    if (result && typeof result.catch === 'function') {
                        return result.catch(error => {
                            this.handleError(error, context);
                            throw error;
                        });
                    }
                    
                    return result;
                } catch (error) {
                    this.handleError(error, context);
                    throw error;
                }
            };
        },

        /**
         * Wrap async function with error handling
         */
        wrapAsync: function(fn, context = '') {
            return async (...args) => {
                try {
                    return await fn.apply(this, args);
                } catch (error) {
                    this.handleError(error, context);
                    throw error;
                }
            };
        },

        /**
         * Retry failed operation
         */
        retry: async function(fn, options = {}) {
            const {
                attempts = this.config.retryAttempts,
                delay = this.config.retryDelay,
                onRetry = () => {},
                context = 'Retry Operation'
            } = options;

            let lastError;

            for (let i = 0; i < attempts; i++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;
                    
                    if (i < attempts - 1) {
                        onRetry(i + 1, error);
                        await this.delay(delay * Math.pow(2, i)); // Exponential backoff
                    }
                }
            }

            this.handleError(lastError, context);
            throw lastError;
        },

        /**
         * Delay helper
         */
        delay: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        /**
         * Handle network errors specifically
         */
        handleNetworkError: function(error, context) {
            return this.handleError(error, context, this.ErrorTypes.NETWORK);
        },

        /**
         * Handle validation errors specifically
         */
        handleValidationError: function(error, context) {
            return this.handleError(error, context, this.ErrorTypes.VALIDATION);
        },

        /**
         * Create custom error
         */
        createCustomError: function(message, type = this.ErrorTypes.CLIENT) {
            const error = new Error(message);
            error.type = type;
            return error;
        }
    };

    // Export to global scope
    window.ErrorHandlingModule = ErrorHandlingModule;

    // Initialize
    ErrorHandlingModule.initialize();

    // Export convenience functions
    window.handleError = ErrorHandlingModule.handleError.bind(ErrorHandlingModule);
    window.wrapAsync = ErrorHandlingModule.wrapAsync.bind(ErrorHandlingModule);
    window.retry = ErrorHandlingModule.retry.bind(ErrorHandlingModule);

})(window);