import { StorageManager } from './storage.js';

/**
 * Authentication Manager Class
 * Handles user authentication, registration, and session management
 */
export class AuthManager {
    constructor() {
        this.storage = new StorageManager();
        this.initializeAuth();
        this.addFormValidation();
    }

     // Initializes authentication system and event listeners
    initializeAuth() {
        // Handle register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Register form submitted');
                this.handleRegister(registerForm);
            });
        }

        // Handle login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Login form submitted');
                this.handleLogin(loginForm);
            });
        }

        // Handle logout
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Update navigation display
        this.updateAuthDisplay();
    }

      //Adds real-time form validation to registration inputs
    addFormValidation() {
        // Register form validation
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            const username = registerForm.querySelector('#username');
            const email = registerForm.querySelector('#email');
            const password = registerForm.querySelector('#password');
            const memorableWord = registerForm.querySelector('#memorable-word');

            // Username validation
            username?.addEventListener('input', () => {
                const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username.value);
                this.showValidationFeedback(username, isValid, 
                    'Username must be 3-20 characters, using only letters, numbers, and underscores');
            });

            // Email validation
            email?.addEventListener('input', () => {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
                this.showValidationFeedback(email, isValid, 
                    'Please enter a valid email address');
            });

            // Password validation
            password?.addEventListener('input', () => {
                const isValid = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(password.value);
                this.showValidationFeedback(password, isValid, 
                    'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character');
            });

            // Memorable word validation
            memorableWord?.addEventListener('input', () => {
                const isValid = memorableWord.value.length >= 6;
                this.showValidationFeedback(memorableWord, isValid, 
                    'Memorable word must be at least 6 characters');
            });
        }
    }

    /**
     * Shows real-time validation feedback for form inputs
     * @param {HTMLElement} inputElement - Input element being validated
     * @param {boolean} isValid - Whether input is valid
     * @param {string} message - Validation message to display
     */
    showValidationFeedback(inputElement, isValid, message) {
        const feedbackElement = inputElement.nextElementSibling;
        if (feedbackElement) {
            feedbackElement.textContent = isValid ? '✓' : message;
            feedbackElement.style.color = isValid ? 'green' : 'red';
            inputElement.classList.toggle('valid', isValid);
            inputElement.classList.toggle('invalid', !isValid);
        }
    }

    /**
     * Handles user registration process
     * @param {HTMLFormElement} form - Registration form element
     */
    handleRegister(form) {
        try {
            const username = form.querySelector('#username').value;
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const memorableWord = form.querySelector('#memorable-word').value;

            console.log('Processing registration for:', username);

            // Validate input
            if (!this.validateRegistration(username, email, password, memorableWord)) {
                return;
            }

            // Check if user exists
            if (this.storage.getUserByEmail(email) || this.storage.getUserByUsername(username)) {
                this.showMessage('Username or email already exists', 'error');
                return;
            }

            // Create user object with initial stats and metadata
            const userData = {
                id: crypto.randomUUID(),
                username,
                email,
                password: this.hashPassword(password),
                memorableWord: this.hashPassword(memorableWord),
                stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    highScore: 0,
                    totalWordsCompleted: 0,
                    expertWordsCompleted: 0,
                    survivalGamesWon: 0,
                    timeAttackHighScore: 0,
                    currentStreak: 0,
                    maxStreak: 0,
                    lastPlayed: null,
                    lastUpdated: new Date().toISOString()
                },
                achievements: [],
                createdAt: new Date().toISOString()
            };

            // Save user and initialize session
            this.storage.saveUser(userData);
            this.storage.setCurrentUser(userData);

            console.log('User created successfully:', userData);
            this.showMessage('Account created successfully!', 'success');

            // Redirect after success
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Registration failed: ' + error.message, 'error');
        }
    }

    /**
     * Handles user login process
     * @param {HTMLFormElement} form - Login form element
     */
    handleLogin(form) {
        try {
            const identifier = form.querySelector('#login-identifier').value;
            const password = form.querySelector('#login-password').value;

            // Find user by email or username
            const user = this.storage.getUserByEmail(identifier) || 
                        this.storage.getUserByUsername(identifier);

            if (!user) {
                this.showMessage('User not found', 'error');
                return;
            }

            // Verify password
            const hashedPassword = this.hashPassword(password);
            if (hashedPassword !== user.password) {
                this.showMessage('Invalid password', 'error');
                return;
            }

            // Set current user and redirect
            this.storage.setCurrentUser(user);
            this.showMessage('Login successful!', 'success');

            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed: ' + error.message, 'error');
        }
    }

    // Handles user logout process
    handleLogout() {
        this.storage.clearCurrentUser();
        this.showMessage('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    /**
     * Validates registration form inputs
     * @param {string} username - User's chosen username
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @param {string} memorableWord - User's memorable word
     * @returns {boolean} Whether all inputs are valid
     */
    validateRegistration(username, email, password, memorableWord) {
        const validations = {
            username: /^[a-zA-Z0-9_]{3,20}$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            password: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/,
            memorableWord: (word) => word.length >= 6
        };

        if (!validations.username.test(username)) {
            this.showMessage('Invalid username format', 'error');
            return false;
        }

        if (!validations.email.test(email)) {
            this.showMessage('Invalid email format', 'error');
            return false;
        }

        if (!validations.password.test(password)) {
            this.showMessage('Invalid password format', 'error');
            return false;
        }

        if (!validations.memorableWord(memorableWord)) {
            this.showMessage('Memorable word must be at least 6 characters', 'error');
            return false;
        }

        return true;
    }

    /**
     * Simple password hashing function (for demo purposes)
     * @param {string} password - Password to hash
     * @returns {string} Hashed password fot security
     */
    hashPassword(password) {
        // Simple hash for demo purposes - in production use proper hashing
        return btoa(password);
    }

     ///Updates UI elements based on authentication state
     //
    updateAuthDisplay() {
        const currentUser = this.storage.getCurrentUser();
        const registerLink = document.getElementById('registerLink');
        const loginLink = document.getElementById('loginLink');
        const logoutLink = document.getElementById('logoutLink');
        const userDisplay = document.getElementById('currentUserName');
        const highScoreDisplay = document.getElementById('globalHighScore');

        if (currentUser) {
            if (registerLink) registerLink.style.display = 'none';
            if (loginLink) loginLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'block';
            if (userDisplay) userDisplay.textContent = currentUser.username;
            if (highScoreDisplay) highScoreDisplay.textContent = 
                Math.round(currentUser.stats?.highScore || 0);
        } else {
            if (registerLink) registerLink.style.display = 'block';
            if (loginLink) loginLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'none';
            if (userDisplay) userDisplay.textContent = '';
            if (highScoreDisplay) highScoreDisplay.textContent = '0';
        }
    }

    /**
     * Shows toast messages for user feedback
     * @param {string} message - Message to display
     * @param {string} type - Message type (success/error)
     */
    showMessage(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.querySelector('.toast-container') || 
            (() => {
                const newContainer = document.createElement('div');
                newContainer.className = 'toast-container';
                document.body.appendChild(newContainer);
                return newContainer;
            })();
            
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            if (!container.hasChildNodes()) {
                container.remove();
            }
        }, 3000);
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AuthManager');
    new AuthManager();
});