export class StorageManager {
    constructor() {
        this.prefix = 'hangman_'; // Storage namespace prefix
        this.initialiseStorage();
    }
 
    /**
     * Validates and initialises localStorage schema
     * @private
     */
    initialiseStorage() {
        if (!localStorage.getItem(this.prefix + 'users')) {
            localStorage.setItem(this.prefix + 'users', '[]');
        }
        console.log('Storage schema initialised:', this.getAllUsers());
    }
 
    /**
     * Persists new user with initialised metrics schema
     * @param {Object} userData - User profile data
     * @returns {Object} Persisted user object with metrics
     */
    saveUser(userData) {
        // Initialise metrics schema
        userData.stats = {
            // Runtime metrics
            gamesPlayed: 0,
            wins: 0,
            highScore: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalWordsCompleted: 0,
            
            // Segmented mode metrics
            expertWordsCompleted: 0,
            survivalGamesWon: 0,
            timeAttackHighScore: 0,
            
            // Mode engagement metrics  
            classicGamesPlayed: 0,
            survivalGamesPlayed: 0,
            timeAttackGamesPlayed: 0,
            
            // Difficulty progression metrics
            easyWordsCompleted: 0,
            mediumWordsCompleted: 0,
            hardWordsCompleted: 0,
            expertWordsCompleted: 0,
            
            // Temporal metadata
            lastPlayed: null,
            lastUpdated: new Date().toISOString(),
            dateJoined: new Date().toISOString(),
            
            // Runtime state
            currentMode: null,
            currentDifficulty: null
        };
 
        const users = this.getAllUsers();
        users.push(userData);
        localStorage.setItem(this.prefix + 'users', JSON.stringify(users));
        return userData;
    }
 
    /**
     * Updates user metrics maintaining data integrity
     * @param {Object} userData - Updated user object
     */
    updateUser(userData) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userData.id);
        
        if (index !== -1) {
            // Preserve metric integrity
            userData.stats = {
                gamesPlayed: userData.stats?.gamesPlayed || 0,
                wins: userData.stats?.wins || 0,
                highScore: userData.stats?.highScore || 0,
                totalWordsCompleted: userData.stats?.totalWordsCompleted || 0,
                expertWordsCompleted: userData.stats?.expertWordsCompleted || 0,
                survivalGamesWon: userData.stats?.survivalGamesWon || 0,
                timeAttackHighScore: userData.stats?.timeAttackHighScore || 0,
                lastPlayed: userData.stats?.lastPlayed || null,
                ...userData.stats
            };
 
            users[index] = userData;
            localStorage.setItem(this.prefix + 'users', JSON.stringify(users));
            
            // Sync session state if applicable
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userData.id) {
                this.setCurrentUser(userData);
            }
        }
    }
 
    /**
     * Retrieves all persisted users
     * @returns {Array} User objects array
     */
    getAllUsers() {
        const usersJson = localStorage.getItem(this.prefix + 'users');
        try {
            return JSON.parse(usersJson || '[]');
        } catch (e) {
            console.error('Schema parsing error:', e);
            return [];
        }
    }
 
    /**
     * Retrieves current session user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        const userJson = sessionStorage.getItem(this.prefix + 'currentUser');
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Session parsing error:', e);
            return null;
        }
    }
 
    /**
     * Queries user by email
     * @param {string} email 
     * @returns {Object|undefined}
     */
    getUserByEmail(email) {
        return this.getAllUsers().find(u => 
            u.email.toLowerCase() === email.toLowerCase()
        );
    }
 
    /**
     * Queries user by username
     * @param {string} username 
     * @returns {Object|undefined}
     */
    getUserByUsername(username) {
        return this.getAllUsers().find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );
    }
 
    /**
     * Sets current session user
     * @param {Object} user 
     */
    setCurrentUser(user) {
        sessionStorage.setItem(this.prefix + 'currentUser', JSON.stringify(user));
    }
 
    /**
     * Terminates current user session
     */
    clearCurrentUser() {
        sessionStorage.removeItem(this.prefix + 'currentUser');
    }
 }