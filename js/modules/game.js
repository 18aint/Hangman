import { StorageManager } from './storage.js';
import { RankingsManager } from './rankings.js';
import { AchievementsManager } from './achievements.js';
class HangmanGame {
    constructor() {
        // External modules
        this.storage = new StorageManager();
        this.rankings = new RankingsManager(this.storage);
        this.achievements = new AchievementsManager(this.storage);
        this.words = {
            easy: ['cat', 'dog', 'rat', 'hat', 'bat', 'sun', 'map', 'run', 'cup', 'pen', 'box', 'fox'],
            medium: ['house', 'mouse', 'horse', 'plane', 'train', 'smile', 'cloud', 'dance', 'phone', 'beach'],
            hard: ['elephant', 'computer', 'birthday', 'hangman', 'keyboard', 'mountain', 'rainbow', 'bicycle'],
            expert: ['javascript', 'programming', 'developer', 'algorithm', 'framework', 'innovation', 'challenge']
        };

        //Session Management, tracks active game session state
        this.gameSession = {
            isActive: false,
            startTime: null,
            gameNumber: 0
        };
        // Game modes configuration, Defines different gameplay modes
        this.gameModes = {
            classic: {
                name: 'Classic Mode',
                description: 'Traditional hangman with progressive difficulty',
                icon: '🎯',
                lives: 7,
                timeLimit: 60,
                scoreMultiplier: 2,
                color: '#4a90e2',
                progressInterval: 3 // Words before difficulty increase
            },
            timeAttack: {
                name: 'Time Attack',
                description: 'Race against time with bonus seconds for correct guesses',
                icon: '⏱️',
                lives: 7,
                timeLimit: 30,
                scoreMultiplier: 5,
                timeBonus: 5,
                color: '#e74c3c',
                progressInterval: 2
            },
            survival: {
                name: 'Survival Mode',
                description: 'Endless mode with one life - how long can you survive?',
                icon: '💀',
                lives: 1,
                timeLimit: Infinity,
                scoreMultiplier: 10,
                color: '#2ecc71',
                progressInterval: 1
            }
        };
        /**
         * Power-ups System
         * Special abilities and their implementations
         */
        this.powerUps = {
            hint: {
                count: 3,
                use: () => this.useHint()
            },
            skipWord: {
                count: 2,
                use: () => this.skipWord()
            },
            extraLife: {
                count: 1,
                use: () => this.addExtraLife()
            }
        };

        //Game State Initialization, core game state variables
        this.state = {
            word: '',
            guessedLetters: new Set(), // Initialize empty Set
            remainingLives: 6,
            score: 0,
            timeLeft: 60,
            difficulty: 'easy',
            gameStatus: 'selecting',
            hintsLeft: 3,
            currentLevel: 1,
            wordsCompleted: 0,
            gameMode: null,
            streak: 0,
            maxStreak: 0,
            sessionHighScore: 0
        };
        this.storage = new StorageManager();
        this.rankings = new RankingsManager(this.storage);
        this.timer = null;

        // Load saved session if exists
        const savedSession = localStorage.getItem('hangmanGameSession');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            this.state = {
                ...this.state,
                gameMode: session.mode,
                sessionHighScore: session.highScore || 0,
                currentLevel: session.level || 1,
                difficulty: session.difficulty || 'easy'
            };
        }

        this.storage = new StorageManager();
        
        //HighScore initialization, load user's high score from storage
        this.highScore = this.storage.getCurrentUser()?.stats?.highScore || 0;

        // Update high score display on load
        this.updateHighScoreDisplay();

        this.initializeGame();
    }

    //Maps highscore
    updateHighScoreDisplay() {
        //getElementById high score
        const highScoreElement = document.getElementById('globalHighScore');
        //Update display if element exists
        if (highScoreElement) {
            //Rounds score to nearest integer
            highScoreElement.textContent = Math.round(this.highScore);
        }
    }

    /**
     * Initializes game environment and user session
    * Implements user authentication, display updates, and game setup
    */
    initializeGame() {
       // User Authentication Check
        const user = this.storage.getCurrentUser();
        //Return if no user
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Update user display with username and high score
        const userNameDisplay = document.getElementById('currentUserName');
        const globalHighScore = document.getElementById('globalHighScore');
        //Update username display if element exists
        if (userNameDisplay) {
            userNameDisplay.textContent = user.username;
        }
        //Update high score 
        if (globalHighScore) {
            globalHighScore.textContent = Math.round(user.stats?.highScore || 0);
        }

        this.setupEventListeners(); // Initialize event listeners
        this.showGameModeSelection();// Display mode selection screen
    }

    //Event listeners
    setupEventListeners() {
        // Physical keyboard input
        document.addEventListener('keydown', (e) => {
            if (this.state.gameStatus === 'playing' && /^[a-zA-Z]$/.test(e.key)) {
                const letter = e.key.toLowerCase();
                this.makeGuess(letter);
            }
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.gameStatus === 'playing') {
                clearInterval(this.timer);
            } else if (!document.hidden && this.state.gameStatus === 'playing') {
                this.startTimer();
            }
        });
    }

    /**  
     Initializes game state for selected mode and starts new game
    * Implements complete game state reset and configuration
    * @param {string} mode - Selected game mode identifier
    */ 
    selectGameMode(mode) {
        if (!this.gameModes[mode]) return;

        const modeConfig = this.gameModes[mode];
        this.state = {
            word: '',
            guessedLetters: new Set(),
            remainingLives: modeConfig.lives,
            timeLeft: modeConfig.timeLimit,
            score: 0,
            currentLevel: 1,
            difficulty: 'easy',
            wordsCompleted: 0,
            gameMode: mode,
            streak: 0,
            hintsLeft: 3
        };

        // Get new word
        this.state.word = this.getRandomWord(this.state.difficulty);

        // Keep high score in memory
        this.highScore = this.storage.getCurrentUser()?.stats?.highScore || 0;
        this.updateHighScoreDisplay();

        this.saveGameSession();
        this.startGame();
    }

    //Renders the game mode selection interface
    showGameModeSelection() {
        /**
        * Locate main game container
        * return if container not found
        */
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        //Generate mode selection interface
        gameContainer.innerHTML = `
            <div class="mode-selection-screen">
                <h2 class="mode-selection-title">Choose Your Mode</h2>
                <div class="mode-cards">
                    ${Object.entries(this.gameModes).map(([key, mode]) => `
                        <div class="mode-card" data-mode="${key}">
                            <div class="mode-header" style="background-color: ${mode.color}">
                                <span class="mode-icon">${mode.icon}</span>
                                <h3>${mode.name}</h3>
                            </div>
                            <div class="mode-details">
                                <p>${mode.description}</p>
                                <ul class="mode-stats">
                                    <li>Starting Lives: ${mode.lives}</li>
                                    <li>Time: ${mode.timeLimit === Infinity ? '∞' : mode.timeLimit + 's'}</li>
                                    <li>Score Multiplier: ${mode.scoreMultiplier}x</li>
                                    ${mode.timeBonus ? `<li>Time Bonus: +${mode.timeBonus}s</li>` : ''}
                                </ul>
                                <p class="mode-progression">Difficulty increases every ${mode.progressInterval} words!</p>
                            </div>
                            <button class="start-mode-btn" data-mode="${key}" 
                                style="background-color: ${mode.color}; cursor: pointer;">
                                Select Mode
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Event listeners to mode buttons
        gameContainer.querySelectorAll('.start-mode-btn').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                if (mode) {
                    this.selectGameMode(mode);
                }
            });
        });
    }


    selectGameMode(mode) {
        if (!this.gameModes[mode]) return;

        const modeConfig = this.gameModes[mode];
        // Initialize state with new Set for guessedLetters
        this.state = {
            word: '',
            guessedLetters: new Set(), // Ensure this is initialized
            remainingLives: modeConfig.lives,
            timeLeft: modeConfig.timeLimit,
            score: 0,
            currentLevel: 1,
            difficulty: 'easy',
            wordsCompleted: 0,
            gameMode: mode,
            streak: 0,
            hintsLeft: 3,
            sessionHighScore: this.state?.sessionHighScore || 0
        };

        // Get word after state is initialized
        this.state.word = this.getRandomWord(this.state.difficulty);

        console.log('Game state initialized:', {
            mode,
            difficulty: this.state.difficulty,
            word: this.state.word
        });

        this.saveGameSession();
        this.startGame();
    }


    startGame() {
        // Start new game session
        this.gameSession.isActive = true;
        this.gameSession.startTime = new Date();
        this.gameSession.gameNumber++;

        const currentUser = this.storage.getCurrentUser();
        if (currentUser) {
            // Increment games played as soon as game starts
            const updatedStats = {
                ...currentUser.stats,
                gamesPlayed: (currentUser.stats?.gamesPlayed || 0) + 1,
                lastPlayed: new Date().toISOString()
            };

            currentUser.stats = updatedStats;
            this.storage.updateUser(currentUser);
            console.log('Game started - Stats updated:', updatedStats);
        }

        if (this.timer) {
            clearInterval(this.timer);
        }

        // Ensure state is properly initialized
        if (!this.state.guessedLetters) {
            this.state.guessedLetters = new Set();
        }

        this.state.gameStatus = 'playing';

        this.updateGameScreen();
        this.initializeKeyboard();
        this.startTimer();
    }

    //Updates the entire game screen with current game state
    updateGameScreen() {
        //Locate game container class
        const gameContainer = document.querySelector('.game-container');
        //return if container not found
        if (!gameContainer) return;
        /**
        * Set up power-up event listeners
        * Implements click handling and debugging
        */
        const powerUpButtons = document.querySelectorAll('.power-up-btn');
        powerUpButtons.forEach(button => {
            const powerType = button.dataset.power;
            if (powerType && this.powerUps[powerType]) {
                button.addEventListener('click', () => {
                    console.log(`Power-up clicked: ${powerType}`); // Debug log
                    if (this.powerUps[powerType].count > 0) {
                        this.powerUps[powerType].use();
                    }
                });
            }
        });

        //Generate game screen HTML structure
        gameContainer.innerHTML = `
            <div class="game-screen">
                <div class="game-header">
                    <div class="mode-info">
                        <span class="mode-name">${this.gameModes[this.state.gameMode].name}</span>
                        <span class="difficulty-badge">Level ${this.state.currentLevel} - ${this.state.difficulty.toUpperCase()}</span>
                    </div>
                    
                    <div class="game-stats">
                        <div class="stat-group">
                            <div class="stat">❤️ <span id="lives">${this.state.remainingLives}</span></div>
                            <div class="stat">Score: <span id="score">${Math.round(this.state.score)}</span></div>
                            ${this.state.timeLeft !== Infinity ?
                `<div class="stat">Time: <span id="timer">${this.state.timeLeft}</span>s</div>` : ''}
                            <div class="stat"><span id="streak">${this.state.streak}</span> 🔥</div>
                        </div>
                    </div>
                </div>

                <div class="hangman-display">
                    <div class="hangman-sprite" id="hangman-sprite"></div>
                </div>

                <div id="word-display" class="word-display"></div>

                <!-- Power-ups Section -->
                <div class="power-ups-container">
                    <button class="power-up-btn" id="hint-btn" data-power="hint">
                        <span class="power-icon">💡</span>
                        <span class="power-name">Reveal Letter</span>
                        <span class="power-count">(${this.powerUps?.hint?.count || 3})</span>
                    </button>
                    
                    <button class="power-up-btn" id="skip-btn" data-power="skipWord">
                        <span class="power-icon">⏭️</span>
                        <span class="power-name">Skip Word</span>
                        <span class="power-count">(${this.powerUps?.skipWord?.count || 2})</span>
                    </button>
                    
                    <button class="power-up-btn" id="extra-life-btn" data-power="extraLife">
                        <span class="power-icon">❤️</span>
                        <span class="power-name">Extra Life</span>
                        <span class="power-count">(${this.powerUps?.extraLife?.count || 1})</span>
                    </button>
                </div>

                <div id="keyboard" class="keyboard"></div>
            </div>
        `;
         
        //Initialize game components
        this.setupPowerUps();
        this.initializeKeyboard();
        this.updateDisplay();
        this.updateHangmanState();
    }

    // Add styles for word display and power-ups
    addGameStyles() {
        const styles = `
            .word-display {
                font-size: 2.5rem;
                letter-spacing: 0.5em;
                margin: 2rem 0;
                font-family: monospace;
                font-weight: bold;
            }

            .power-ups-container {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin: 1.5rem 0;
                flex-wrap: wrap;
            }

            .power-up-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 0.8rem 1.2rem;
                border: none;
                border-radius: 8px;
                background: #4a90e2;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .power-up-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .power-up-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .power-icon {
                font-size: 1.5rem;
                margin-bottom: 0.3rem;
            }

            .power-name {
                font-size: 0.8rem;
                font-weight: bold;
            }

            .power-count {
                font-size: 0.8rem;
                opacity: 0.8;
            }
        `;

        if (!document.getElementById('game-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'game-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    setupPowerUpListeners() {
        // Hint button
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.useHint());
        }

        // Skip word button
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipWord());
        }

        // Extra life button
        const extraLifeBtn = document.getElementById('extra-life-btn');
        if (extraLifeBtn) {
            extraLifeBtn.addEventListener('click', () => this.addExtraLife());
        }
    }

    /**
    * Initializes power-up system and sets up event handlers
     * Manages power-up button functionality and state tracking
    */
    setupPowerUps() {
        //Query all power-up buttons
        const powerUpButtons = document.querySelectorAll('.power-up-btn');
        /**
        * Iterate through power-up buttons
        * Sets up individual event handlers and state management
        */
        powerUpButtons.forEach(button => {
            // Extract power-up type from data attribute
            const powerType = button.dataset.power;
            /**
            * Validate power-up configuration
            * Ensures power-up exists in game state
            */
            if (powerType && this.powerUps[powerType]) {
                //Click event handler
                button.addEventListener('click', () => {
                    if (this.powerUps[powerType].count > 0) {
                        this.powerUps[powerType].use();
                        this.powerUps[powerType].count--;
                        const countElement = button.querySelector('.power-count');
                        if (countElement) {
                            countElement.textContent = `(${this.powerUps[powerType].count})`;
                        }
                         /**
                        * Disable button if depleted
                        * Prevents usage when count reaches 0
                         */
                        if (this.powerUps[powerType].count <= 0) {
                            button.disabled = true;
                        }
                    }
                });
            }
        });
    }

    //Displays an animated success message with game statistics with temporary overlay
    showSuccessMessage(callback) {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <div class="message-content">
                <h3>Word Complete! 🎉</h3>
                <p>Score: ${Math.round(this.state.score)}</p>
                <p>Streak: ${this.state.streak}</p>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
            if (callback) callback();
        }, 1500);
    }

    /**
    * Updates all game display elements with current state values
    * Centralizes UI synchronization for game state changes
    */
    updateDisplay() {
        /**
        * Word Display Update:
        * - Converts word to array for mapping
        * - Replaces unguessed letters with underscores
        * - Joins with spaces for readability
        */
        const wordDisplay = document.getElementById('word-display');
        if (wordDisplay && this.state.word) {
            wordDisplay.textContent = [...this.state.word]
                .map(letter => this.state.guessedLetters.has(letter) ? letter : '_')
                .join(' ');
        }

        // Update other displays (lives, score, etc.)
        const elements = {
            lives: document.getElementById('lives'),
            score: document.getElementById('score'),
            timer: document.getElementById('timer'),
            streak: document.getElementById('streak')
        };
        //  Update Statistical Displays:
        if (elements.lives) elements.lives.textContent = this.state.remainingLives;
        if (elements.score) elements.score.textContent = Math.round(this.state.score);
        if (elements.timer) elements.timer.textContent = this.state.timeLeft;
        if (elements.streak) elements.streak.textContent = this.state.streak;
    }

/* Was struggling to find the relaitve path in order to retive spirtesheet
    updateSpriteSource(path) {
        const sprite = document.getElementById('hangman-sprite');
        if (sprite) {
            sprite.style.backgroundImage = `url('${path}')`;
            console.log('Updated sprite with path:', path);
        }
    }



    /** Helper functions when implementing spritesheet
    debugSprite() {
        const sprite = document.getElementById('hangman-sprite');
        const display = document.getElementById('hangman-display');

        console.log({
            spriteElement: sprite,
            displayElement: display,
            spriteStyle: sprite ? window.getComputedStyle(sprite) : null,
            displayStyle: display ? window.getComputedStyle(display) : null,
            remainingLives: this.state.remainingLives,
            currentState: Math.min(6, 6 - this.state.remainingLives)
        });
    }
*/
    /**
    * Processes a player's letter guess and updates game state accordingly
    * Core game logic for letter validation and state management
    * @param {string} letter - The letter being guessed
    */makeGuess(letter) {
    if (this.state.gameStatus !== 'playing' || this.state.remainingLives <= 0) return;

    if (!this.state.guessedLetters) {
        this.state.guessedLetters = new Set();
    }

    const keyButton = document.querySelector(`[data-key="${letter}"]`);
    if (keyButton?.disabled) return;

    const isCorrect = this.state.word.includes(letter);
    
    // Update keyboard
    this.updateKeyboardKey(letter, isCorrect);

    // Add to guessed letters
    this.state.guessedLetters.add(letter);

    if (isCorrect) {
        // Count how many times the letter appears in the word
        const letterCount = [...this.state.word].filter(l => l === letter).length;
        // Increase streak for each occurrence of the letter
        this.state.streak += letterCount;
        // Update display with animation for streak increase
        this.showStreakIncrease(letterCount);
    } else {
        // Prevent lives from going negative
        this.state.remainingLives = Math.max(0, this.state.remainingLives - 1);
        this.updateHangmanState();
        // Reset streak on wrong guess
        this.state.streak = 0;
    }

    this.updateScore(isCorrect);
    this.updateDisplay();
    this.checkGameEnd();
}
    
    /**
    * Displays an animated streak increase notification
    * Implements floating number animation for score multiplier feedback
    */
    showStreakIncrease(amount) {
        const streakDisplay = document.getElementById('streak');
        if (streakDisplay) {
            /**
            * Create animated streak message element
             * Dynamic element for temporary visual feedback
             */
            const streakMessage = document.createElement('div');
            streakMessage.className = 'streak-increase';//Animation 
            streakMessage.textContent = `+${amount}`;//Iincrease amount
            /**
            * Append to parent element of streak display
            * Ensures proper positioning relative to streak counter
            */
            streakDisplay.parentElement.appendChild(streakMessage);

            // Remove the animation after it completes
            setTimeout(() => streakMessage.remove(), 1000);
        }
    }

    /**
     * Displays temporary visual feedback for letter guesses
    * Implements animated feedback system for user interactions
    * @param {string} letter - The guessed letter
    * @param {boolean} isCorrect - Whether the guess was correct
     */    showGuessFeedback(letter, isCorrect) {
        const feedback = document.createElement('div');
        /**
        * Apply conditional classes for styling:
        * - guess-feedback: Base styling and animation
        * - correct/incorrect: State-specific styling
        */
        feedback.className = `guess-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = letter;

        // Position feedback near the letter in the word display
        const wordDisplay = document.getElementById('word-display');
        if (wordDisplay) {
             // Append feedback element to word display container
            wordDisplay.appendChild(feedback);

        /**
          * Implement timed removal:
         * - 500ms duration matches CSS animation
         * - Automatic cleanup prevents DOM pollution
         * - Ensures smooth transition out
         */            setTimeout(() => {
                feedback.remove();
            }, 500);
        }
    }

    /** Attempt on implmenting sound fearure but could find any free appropriate sound.mp3 websites
    playSound(type) {
        const sounds = {
            correct: 'correct-sound.mp3',
            wrong: 'wrong-sound.mp3',
            gameOver: 'game-over-sound.mp3'
        };

        try {
            const audio = new Audio(`../assets/sounds/${sounds[type]}`);
            audio.play().catch(e => console.log('Sound playback failed:', e));
        } catch (e) {
            console.log('Sound system not available');
        }
    }
    */

    /**
     * Updates the hangman sprite visualization based on remaining lives
     * Manages sprite sheet positioning and state transitions
     */
    updateHangmanState() {
        // Query sprite element from DOM
        const sprite = document.getElementById('hangman-sprite');
        // Early return if sprite element doesn't exist
        if (!sprite) return;
        /**
        * Calculate current state number:
        * - Maximum states: 6 (0 to 5, representing hangman progression)
        * - Formula: 6 - remainingLives (inverted for visual progression)
        * - Math.min ensures state doesn't exceed maximum (6)
        */
        const stateNumber = Math.min(6, 6 - this.state.remainingLives);
        /**
         * Update sprite position in spritesheet:
         * - Each sprite frame is 300px wide
         * - Negative multiplication for rightward shift
         * - Horizontal position: -300px * stateNumber
         * - Vertical position: 0 (single row spritesheet)
         */
        sprite.style.backgroundPosition = `${-300 * stateNumber}px 0`;
        /**
        * Update sprite class for state-specific styling
        * Enables CSS transitions and state-specific modifications
        */
        sprite.className = `hangman-sprite hangman-state-${stateNumber}`;
    }

    /**
    *Helper function as i was struggling to get the correct puxel size to show 
    *Logs the sprite was initialised sucessfully
    *Allows me to know if i can't see the spreite the log appears it's the pixel size that needs adjusting
    */
    verifySpriteSetup() {
        const sprite = document.getElementById('hangman-sprite');
        const display = document.querySelector('.hangman-display');

        if (sprite && display) {
            const spriteStyle = window.getComputedStyle(sprite);
            const displayStyle = window.getComputedStyle(display);

            console.log('Sprite Setup:', {
                container: {
                    width: displayStyle.width,
                    height: displayStyle.height,
                    position: displayStyle.position,
                    background: displayStyle.backgroundColor
                },
                sprite: {
                    width: spriteStyle.width,
                    height: spriteStyle.height,
                    backgroundImage: spriteStyle.backgroundImage,
                    backgroundSize: spriteStyle.backgroundSize,
                    position: spriteStyle.position
                },
                currentState: this.state.remainingLives
            });
        }
    }


    revealLetter(letter) {
        const wordDisplay = document.getElementById('word-display');
        if (!wordDisplay) return;

        // Convert current display to array
        let displayArray = wordDisplay.textContent.split(' ');

        // Update all instances of the letter
        [...this.state.word].forEach((wordLetter, index) => {
            if (wordLetter === letter) {
                displayArray[index] = letter;
            }
        });

        // Update display
        wordDisplay.textContent = displayArray.join(' ');
    }

    /**
         * My attempt to store guessed letters in a
         * @param {string} letter - The letter that was guessed
         * @param {boolean} isCorrect - Indicates if the guess was correct
         * The two functions work but i decided not to add becuase it wouldn't make sense in terms of interface becuase i already had the spreite sheet and updatekryboard()
    
        updateGuessedLetters(letter, isCorrect) {
            const guessedLettersContainer = document.getElementById('guessed-letters') ||
                this.createGuessedLettersContainer();
    
            const letterSpan = document.createElement('span');
            letterSpan.textContent = letter;
            letterSpan.className = `guessed-letter ${isCorrect ? 'correct' : 'incorrect'}`;
            guessedLettersContainer.appendChild(letterSpan);
        }
        createGuessedLettersContainer() {
            const container = document.createElement('div');
            container.id = 'guessed-letters';
            container.className = 'guessed-letters-container';
    
            const label = document.createElement('div');
            label.className = 'guessed-letters-label';
            label.textContent = 'Guessed Letters:';
            container.appendChild(label);
    
    
            const wordDisplay = document.getElementById('word-display');
            wordDisplay.parentNode.insertBefore(container, wordDisplay.nextSibling);
    
            return container;
        }
        */

    //Updates the visual state of the keyboard key
    updateKeyboardKey(letter, isCorrect) {
        const key = document.querySelector(`[data-key="${letter}"]`);
        if (key && !key.disabled) {
            key.disabled = true; // Prevent reuse
            key.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    }

    // Initializes the virtual keyboard interface
    initializeKeyboard() {
        const keyboard = document.getElementById('keyboard');
        if (!keyboard) return;

        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
        ];

        keyboard.innerHTML = rows.map(row => `
            <div class="keyboard-row">
                ${row.map(key => `
                    <button 
                        class="key" 
                        data-key="${key.toLowerCase()}"
                        ${this.state.guessedLetters.has(key.toLowerCase()) ? 'disabled' : ''}
                    >${key}</button>
                `).join('')}
            </div>
        `).join('');

        //Click event listeners
        keyboard.querySelectorAll('.key').forEach(button => {
            button.addEventListener('click', () => {
                if (!button.disabled && this.state.gameStatus === 'playing') {
                    this.makeGuess(button.dataset.key);
                }
            });
        });
    }

    updateScore(isCorrect) {
        if (!isCorrect) return;

        const basePoints = {
            easy: 10,
            medium: 20,
            hard: 30,
            expert: 50
        }[this.state.difficulty];

        const modeMultiplier = this.gameModes[this.state.gameMode].scoreMultiplier;
        const streakMultiplier = 1 + (this.state.streak * 0.1); // 10% bonus per streak

        // Calculate points with multipliers
        const points = Math.round(basePoints * modeMultiplier * streakMultiplier);
        this.state.score += points;

        // Check and update high score
        if (this.state.score > this.highScore) {
            this.highScore = this.state.score;
            this.updateHighScoreDisplay();
            this.saveHighScore();
        }

        this.updateDisplay();
    }

    saveHighScore() {
        const currentUser = this.storage.getCurrentUser();
        if (currentUser) {
            // Update user's stats with new high score
            currentUser.stats = {
                ...currentUser.stats,
                highScore: this.highScore,
                lastUpdated: new Date().toISOString()
            };

            // Save to storage
            this.storage.updateUser(currentUser);

            console.log('High score updated:', this.highScore);
        }
    }

    //User tracking updates> However some user stats dont do correctly, some stay at 0
    updateUser(userData) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userData.id);

        if (index !== -1) {
            // Ensure we preserve existing stats and merge with new stats
            const existingUser = users[index];
            userData.stats = {
                ...existingUser.stats,  // Keep existing stats
                ...userData.stats,      // Merge with new stats
                lastUpdated: new Date().toISOString()
            };

            // Make sure numerical values are not undefined
            userData.stats.gamesPlayed = userData.stats.gamesPlayed || 0;
            userData.stats.wins = userData.stats.wins || 0;
            userData.stats.highScore = userData.stats.highScore || 0;
            userData.stats.survivalGamesWon = userData.stats.survivalGamesWon || 0;
            userData.stats.expertWordsCompleted = userData.stats.expertWordsCompleted || 0;
            userData.stats.totalWordsCompleted = userData.stats.totalWordsCompleted || 0;
            userData.stats.timeAttackHighScore = userData.stats.timeAttackHighScore || 0;

            // Update user in array
            users[index] = userData;

            // Save to localStorage
            localStorage.setItem(this.prefix + 'users', JSON.stringify(users));

            // Update current user session if this is the current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userData.id) {
                this.setCurrentUser(userData);
            }

            console.log('Updated user stats:', userData.stats);
        }
    }


    checkSpritesheet() {
        const sprite = document.querySelector('.hangman-sprite');
        if (sprite) {
            console.log('Sprite element found');
            const computedStyle = window.getComputedStyle(sprite);
            console.log('Background image:', computedStyle.backgroundImage);
            console.log('Background size:', computedStyle.backgroundSize);

            // Test image loading
            const img = new Image();
            img.onload = () => console.log('Spritesheet loaded successfully');
            img.onerror = () => console.error('Failed to load spritesheet');
            img.src = '../assets/images/hangman-sprite.png';
        } else {
            console.error('Sprite element not found');
        }
    }

    //Need both functions unless sprite would not show, struggled to merege into sing func
    checkSprite() {
        const display = document.querySelector('.hangman-display');
        const sprite = document.getElementById('hangman-sprite');

        console.log('Display element:', display);
        console.log('Sprite element:', sprite);

        if (sprite) {
            const style = window.getComputedStyle(sprite);
            console.log('Sprite styles:', {
                width: style.width,
                height: style.height,
                backgroundImage: style.backgroundImage,
                backgroundPosition: style.backgroundPosition,
                backgroundSize: style.backgroundSize
            });

            // Test image loading
            const imgUrl = style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
            const img = new Image();
            img.onload = () => console.log('Spritesheet loaded successfully:', imgUrl);
            img.onerror = () => console.error('Failed to load spritesheet:', imgUrl);
            img.src = imgUrl;
        }
    }

    checkGameEnd() {
        if (!this.state.guessedLetters) {
            this.state.guessedLetters = new Set();
        }

        const isWin = [...this.state.word]
            .every(letter => this.state.guessedLetters.has(letter));

        if (isWin) {
            const currentUser = this.storage.getCurrentUser();
            if (currentUser && currentUser.stats) {
                const stats = {
                    ...currentUser.stats,  // Preserve existing stats
                    gamesPlayed: (currentUser.stats.gamesPlayed || 0),  // Keep existing gamesPlayed
                    wins: (currentUser.stats.wins || 0) + 1,
                    totalWordsCompleted: (currentUser.stats.totalWordsCompleted || 0) + 1
                };

                // Update user stats
                currentUser.stats = stats;
                this.storage.updateUser(currentUser);

                console.log('Updated user stats:', stats);
            }

            // Check achievements with the updated stats
            this.achievements?.checkAchievements(
                currentUser.stats,
                {
                    remainingLives: this.state.remainingLives,
                    maxLives: this.gameModes[this.state.gameMode].lives,
                    timeLeft: this.state.timeLeft,
                    gameMode: this.state.gameMode
                }
            );
        }
        if (isWin) {
            // Get current user stats
            const currentUser = this.storage.getCurrentUser();
            const currentStats = currentUser?.stats || {};

            // Create game state object
            const gameState = {
                remainingLives: this.state.remainingLives,
                maxLives: this.gameModes[this.state.gameMode].lives,
                timeLeft: this.state.timeLeft,
                gameMode: this.state.gameMode,
                difficulty: this.state.difficulty,
                score: this.state.score
            };

            // Update stats for achievements
            const gameStats = {
                wordCompleted: true,
                totalWordsCompleted: (currentStats.totalWordsCompleted || 0) + 1,
                expertWordsCompleted: this.state.difficulty === 'expert'
                    ? (currentStats.expertWordsCompleted || 0) + 1
                    : (currentStats.expertWordsCompleted || 0),
                highScore: this.state.score,
                maxStreak: Math.max(this.state.streak, currentStats.maxStreak || 0),
                survivalGamesWon: this.state.gameMode === 'survival'
                    ? (currentStats.survivalGamesWon || 0) + 1
                    : (currentStats.survivalGamesWon || 0),
                timeAttackHighScore: this.state.gameMode === 'timeAttack'
                    ? Math.max(this.state.score, currentStats.timeAttackHighScore || 0)
                    : (currentStats.timeAttackHighScore || 0)
            };

            // Check achievements with both stats and gameState
            this.achievements?.checkAchievements(gameStats, gameState);

            // Handle high score
            if (this.state.score > this.highScore) {
                this.highScore = this.state.score;
                this.saveHighScore();
                this.updateHighScoreDisplay();
                this.showNewHighScoreMessage();
            }

            // Progress game
            this.state.wordsCompleted++;

            // Show success message and continue
            this.showSuccessMessage(() => {
                this.continueGame();
            });
        } else if (this.state.remainingLives <= 0) {
            this.handleLoss();
        }
    }

    continueGame() {
        // Progress difficulty if needed
        this.progressDifficulty();

        // Reset for next word
        this.state.guessedLetters = new Set();
        this.state.word = this.getRandomWord(this.state.difficulty);
        this.state.gameStatus = 'playing';

        // Reset keyboard
        this.initializeKeyboard();

        // Update display
        this.updateGameScreen();
        this.updateDisplay();

        // If in time attack mode, maintain timer
        if (this.state.timeLeft !== Infinity && this.state.gameMode === 'timeAttack') {
            this.startTimer();
        }
    }

    handleWin() {
        const currentUser = this.storage.getCurrentUser();
        if (!currentUser || !currentUser.stats) return;
        // Update basic stats for every win
        currentUser.stats = {
            ...currentUser.stats,
            gamesPlayed: (currentUser.stats.gamesPlayed || 0) + 1,
            wins: (currentUser.stats.wins || 0) + 1,
            totalWordsCompleted: (currentUser.stats.totalWordsCompleted || 0) + 1,
            lastPlayed: new Date().toISOString()
        };

        // For debugging
        console.log('Current game mode:', this.state.gameMode);
        console.log('Current score:', this.state.score);

        // Update basic stats
        currentUser.stats = {
            ...currentUser.stats,
            gamesPlayed: (currentUser.stats.gamesPlayed || 0) + 1,
            wins: (currentUser.stats.wins || 0) + 1,
            lastPlayed: new Date().toISOString(),
        };

        // Specific Time Attack score handling
        if (this.state.gameMode === 'timeAttack') {
            const currentScore = Math.round(this.state.score);
            const currentHighScore = currentUser.stats.timeAttackHighScore || 0;

            switch (this.state.gameMode) {
                case 'survival':
                    currentUser.stats.survivalGamesWon = (currentUser.stats.survivalGamesWon || 0) + 1;
                    break;
                case 'timeAttack':
                    currentUser.stats.timeAttackGamesWon = (currentUser.stats.timeAttackGamesWon || 0) + 1;
                    break;
                case 'classic':
                    currentUser.stats.classicGamesWon = (currentUser.stats.classicGamesWon || 0) + 1;
                    break;
            }

            // Save updated stats
            this.storage.updateUser(currentUser);
            console.log('Updated stats after win:', currentUser.stats); // Debug log

            // Check achievements with updated stats
            this.achievements?.checkAchievements(
                currentUser.stats,
                {
                    remainingLives: this.state.remainingLives,
                    maxLives: this.gameModes[this.state.gameMode].lives,
                    timeLeft: this.state.timeLeft,
                    gameMode: this.state.gameMode
                }
            );


            console.log('Time Attack - Current Score:', currentScore);
            console.log('Time Attack - Previous High Score:', currentHighScore);

            if (currentScore > currentHighScore) {
                currentUser.stats.timeAttackHighScore = currentScore;
                console.log('New Time Attack high score set:', currentScore);
            }
        }

        // Save the updated user stats
        this.storage.updateUser(currentUser);

        // Log final stats for verification
        console.log('Updated user stats:', currentUser.stats);

        // Check achievements with the updated stats
        this.achievements?.checkAchievements(
            currentUser.stats,
            {
                remainingLives: this.state.remainingLives,
                maxLives: this.gameModes[this.state.gameMode].lives,
                timeLeft: this.state.timeLeft,
                gameMode: this.state.gameMode,
                score: this.state.score
            }
        );

        // Show success and continue game
        this.showSuccessMessage(() => {
            this.continueGame();
        });
    }
    //Overwrite users current highscore
    showNewHighScoreMessage() {
        const message = document.createElement('div');
        message.className = 'high-score-message';
        message.innerHTML = `
            <div class="message-content">
                <span class="message-icon">🏆</span>
                <h3>New High Score!</h3>
                <p>${Math.round(this.highScore)} points</p>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => message.remove(), 2000);
    }

    // Helper method to reset game state for new word
    //Had a bug where the game woul contradict and not move on after word guessed successfully
    resetForNewWord() {
        // Clear guessed letters
        this.state.guessedLetters = new Set();

        // Reset keyboard
        const keyboard = document.getElementById('keyboard');
        if (keyboard) {
            const keys = keyboard.querySelectorAll('.key');
            keys.forEach(key => {
                key.disabled = false;
                key.classList.remove('correct', 'incorrect');
            });
        }

        // Clear guessed letters display
        const correctLetters = document.getElementById('correct-letters');
        const incorrectLetters = document.getElementById('incorrect-letters');
        if (correctLetters) correctLetters.innerHTML = '';
        if (incorrectLetters) incorrectLetters.innerHTML = '';
    }


    showPowerUpMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'power-up-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
            </div>
        `;
        document.body.appendChild(messageDiv);

        // Add animation class after a small delay
        setTimeout(() => messageDiv.classList.add('show'), 10);

        // Remove the message
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, 2000);
    }

    handleLoss() {
        // Stop the timer immediately
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    
        // Set game status to prevent further input
        this.state.gameStatus = 'game-over';
        
        try {
            // Get current user and update stats
            const currentUser = this.storage.getCurrentUser();
            if (currentUser) {
                // Update user statistics
                const updatedStats = {
                    ...currentUser.stats,
                    gamesPlayed: (currentUser.stats?.gamesPlayed || 0) + 1,
                    lastPlayed: new Date().toISOString(),
                    totalWordsCompleted: (currentUser.stats?.totalWordsCompleted || 0) + this.state.wordsCompleted,
                    highestLevel: Math.max(currentUser.stats?.highestLevel || 0, this.state.currentLevel)
                };
    
                // Update high score if necessary
                if (this.state.score > (currentUser.stats?.highScore || 0)) {
                    updatedStats.highScore = this.state.score;
                    this.highScore = this.state.score;
                    this.showNewHighScoreMessage();
                }
    
                // Update user object with new stats
                currentUser.stats = updatedStats;
                this.storage.updateUser(currentUser);
            }
    
            // Get the game container
            const gameContainer = document.querySelector('.game-container');
            if (!gameContainer) {
                console.error('Game container not found');
                return;
            }
    
            // Calculate game statistics
            const accuracy = this.calculateAccuracy();
            const timeSpent = this.calculateTimeSpent();
            const modeConfig = this.gameModes[this.state.gameMode];
    
            // Create game over screen
            gameContainer.innerHTML = `
                <div class="game-over lose">
                    <h2>Game Over!</h2>
                    
                    <div class="final-word">
                        <p>The word was: <strong>${this.state.word}</strong></p>
                    </div>
    
                    <div class="final-stats">
                        <div class="stat-row">
                            <div class="stat-label">Final Score</div>
                            <div class="stat-value">${Math.round(this.state.score)}</div>
                        </div>
                        
                        <div class="stat-row">
                            <div class="stat-label">High Score</div>
                            <div class="stat-value">${Math.round(this.highScore)}</div>
                        </div>
                        
                        <div class="stat-row">
                            <div class="stat-label">Words Completed</div>
                            <div class="stat-value">${this.state.wordsCompleted}</div>
                        </div>
                        
                        <div class="stat-row">
                            <div class="stat-label">Level Reached</div>
                            <div class="stat-value">${this.state.currentLevel} (${this.state.difficulty.toUpperCase()})</div>
                        </div>
                        
                        <div class="stat-row">
                            <div class="stat-label">Accuracy</div>
                            <div class="stat-value">${accuracy}%</div>
                        </div>
                        
                        ${modeConfig.timeLimit !== Infinity ? `
                            <div class="stat-row">
                                <div class="stat-label">Time Played</div>
                                <div class="stat-value">${timeSpent}</div>
                            </div>
                        ` : ''}
                        
                        <div class="stat-row">
                            <div class="stat-label">Best Streak</div>
                            <div class="stat-value">${this.state.maxStreak || 0}</div>
                        </div>
                    </div>
    
                    <div class="game-actions">
                        <button id="new-game-btn" class="btn btn-primary">
                            <span class="btn-icon">🔄</span> Play Again
                        </button>
                        <button id="change-mode-btn" class="btn btn-secondary">
                            <span class="btn-icon">🎮</span> Change Mode
                        </button>
                        <button id="view-rankings-btn" class="btn btn-info">
                            <span class="btn-icon">🏆</span> View Rankings
                        </button>
                    </div>
                </div>
            `;
    
            // Add event listeners for game over buttons
            document.getElementById('new-game-btn')?.addEventListener('click', () => {
                this.selectGameMode(this.state.gameMode);
            });
    
            document.getElementById('change-mode-btn')?.addEventListener('click', () => {
                this.showGameModeSelection();
            });
    
            document.getElementById('view-rankings-btn')?.addEventListener('click', () => {
                window.location.href = 'rankings.html';
            });
    
            // Save game session
            this.saveGameSession();
    
            // Update rankings if available
            if (this.rankings) {
                this.rankings.updateRankings();
            }
    
        } catch (error) {
            console.error('Error in handleLoss:', error);
            // Show error message to user
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = `
                    <div class="error-message">
                        <p>An error occurred while ending the game. Please refresh the page.</p>
                    </div>
                `;
            }
        }
    }
    
    // Helper methods for handleLoss
    calculateAccuracy() {
        const totalGuesses = this.state.guessedLetters?.size || 0;
        if (totalGuesses === 0) return 0;
    
        const correctGuesses = [...(this.state.guessedLetters || [])]
            .filter(letter => this.state.word.includes(letter)).length;
    
        return Math.round((correctGuesses / totalGuesses) * 100);
    }
    
    calculateTimeSpent() {
        const modeConfig = this.gameModes[this.state.gameMode];
        if (modeConfig.timeLimit === Infinity) return 'N/A';
    
        const timeSpent = modeConfig.timeLimit - this.state.timeLeft;
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
    
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showNewHighScoreMessage() {
        const message = document.createElement('div');
        message.className = 'high-score-message';
        message.innerHTML = `
            <div class="message-content">
                <span class="message-icon">🏆</span>
                <h3>New High Score!</h3>
                <p>${Math.round(this.highScore)} points</p>
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 2000);
    }
    resetForContinue() {
        this.state.score = 0;
        this.state.streak = 0;

        const modeConfig = this.gameModes[this.state.gameMode];
        this.state.remainingLives = modeConfig.lives;
        this.state.timeLeft = modeConfig.timeLimit;
    }



    progressDifficulty() {
        const wordsPerLevel = 3;
        if (this.state.wordsCompleted > 0 && this.state.wordsCompleted % wordsPerLevel === 0) {
            const difficulties = ['easy', 'medium', 'hard', 'expert'];
            const currentIndex = difficulties.indexOf(this.state.difficulty);

            if (currentIndex < difficulties.length - 1) {
                this.state.difficulty = difficulties[currentIndex + 1];
                this.state.currentLevel++;
                this.showLevelUpMessage();
            }
        }
    }

    increaseDifficulty() {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const currentIndex = difficulties.indexOf(this.state.difficulty);

        if (currentIndex < difficulties.length - 1) {
            this.state.difficulty = difficulties[currentIndex + 1];
            this.state.currentLevel++;
            this.showLevelUpMessage();
        }
    }

    showLevelUpMessage() {
        const message = document.createElement('div');
        message.className = 'level-up-message';
        message.innerHTML = `
            <div class="level-content">
                <h3>Level Up! 🏆</h3>
                <p>Difficulty: ${this.state.difficulty.toUpperCase()}</p>
                <p>Level: ${this.state.currentLevel}</p>
            </div>
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);
    }

    getRandomWord(difficulty) {
        const words = this.words[difficulty];
        return words[Math.floor(Math.random() * words.length)];
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);

        if (this.state.timeLeft !== Infinity) {
            this.timer = setInterval(() => {
                this.state.timeLeft--;
                const timerDisplay = document.getElementById('timer');
                if (timerDisplay) {
                    timerDisplay.textContent = this.state.timeLeft;
                }

                if (this.state.timeLeft <= 0) {
                    this.handleLoss();
                }
            }, 1000);
        }
    }

    useHint() {
        if (this.powerUps.hint.count <= 0 || this.state.gameStatus !== 'playing') return;

        const unguessedLetters = [...this.state.word]
            .filter(letter => !this.state.guessedLetters.has(letter));

        if (unguessedLetters.length > 0) {
            const randomLetter = unguessedLetters[
                Math.floor(Math.random() * unguessedLetters.length)
            ];
            this.makeGuess(randomLetter);
        }
    }


    skipWord() {
        console.log('Skip Word activated'); // Debug log
        if (this.powerUps.skipWord.count <= 0 || this.state.gameStatus !== 'playing') {
            console.log('Cannot skip: count or status invalid'); // Debug log
            return;
        }

        // Decrease skip count
        this.powerUps.skipWord.count--;

        // Get a new word
        const newWord = this.getRandomWord(this.state.difficulty);
        console.log('New word selected:', newWord); // Debug log

        if (this.state.timeLimit !== Infinity) this.state.timeLeft = this.gameModes[this.state.gameMode].timeLimit;

        // Reset game state for new word
        this.state.guessedLetters = new Set();
        this.state.word = newWord;

        // Update power-up button display
        const skipButton = document.querySelector('[data-power="skipWord"] .power-count');
        if (skipButton) {
            skipButton.textContent = `(${this.powerUps.skipWord.count})`;
            if (this.powerUps.skipWord.count <= 0) {
                skipButton.parentElement.disabled = true;
            }
        }

        // Reset keyboard
        this.initializeKeyboard();

        // Update the display
        this.updateDisplay();

        // Show skip animation
        this.showSkipAnimation();
    }
    updatePowerUpDisplay(powerUpType) {
        const powerUpBtn = document.querySelector(`[data-power="${powerUpType}"]`);
        if (!powerUpBtn) return;

        // Update count display
        const countDisplay = powerUpBtn.querySelector('.power-count');
        if (countDisplay) {
            countDisplay.textContent = `(${this.powerUps[powerUpType].count})`;
        }

        // Update button state
        powerUpBtn.disabled = this.powerUps[powerUpType].count <= 0;

        if (this.powerUps[powerUpType].count <= 0) {
            powerUpBtn.classList.add('power-up-depleted');
        }
    }

    prepareNextRound(wasCompleted = true) {
        // Only update score and streak if word was completed, not skipped
        if (wasCompleted) {
            this.state.wordsCompleted++;
            // Update score and streak here
        }

        // Reset for next word
        this.state.guessedLetters = new Set();
        this.state.word = this.getRandomWord(this.state.difficulty);

        // Reset keyboard
        this.initializeKeyboard();

        // Update display
        this.updateGameScreen();
        this.updateDisplay();

        // Start timer if in time attack mode
        if (this.state.timeLeft !== Infinity && this.state.gameMode === 'timeAttack') {
            this.startTimer();
        }
    }
    showSkipAnimation() {
        const skipMessage = document.createElement('div');
        skipMessage.className = 'skip-message';
        skipMessage.innerHTML = `
            <div class="skip-content">
                <span class="skip-icon">⏭️</span>
                <span class="skip-text">Word Skipped!</span>
            </div>
        `;
        document.body.appendChild(skipMessage);

        setTimeout(() => {
            skipMessage.classList.add('fade-out');
            setTimeout(() => skipMessage.remove(), 300);
        }, 1000);
    }
    addExtraLife() {
        // Check if power-up is available
        if (this.powerUps.extraLife.count <= 0) {
            this.showPowerUpMessage('No extra lives remaining!');
            return;
        }
    
        // Get the maximum lives for current game mode
        const maxLives = this.gameModes[this.state.gameMode].lives;
    
        // Check if already at max lives
        if (this.state.remainingLives >= maxLives) {
            this.showPowerUpMessage('Already at maximum lives!');
            return;
        }
    
        // Add the life and update UI
        this.state.remainingLives = Math.min(maxLives, this.state.remainingLives + 1);
        this.powerUps.extraLife.count--;
    
        // Update power-up button count
        const extraLifeBtn = document.getElementById('extra-life-btn');
        if (extraLifeBtn) {
            const countElement = extraLifeBtn.querySelector('.power-count');
            if (countElement) {
                countElement.textContent = `(${this.powerUps.extraLife.count})`;
            }
            // Disable button if no more power-ups
            if (this.powerUps.extraLife.count <= 0) {
                extraLifeBtn.disabled = true;
            }
        }
    
        // Show success message
        this.showPowerUpMessage('Extra life added! ❤️');
        
        // Update the display
        this.updateDisplay();
        this.updateHangmanState();
    }
    //Saves current game session state
    saveGameSession() {
        const session = {
            mode: this.state.gameMode,
            highScore: this.state.sessionHighScore,
            level: this.state.currentLevel,
            difficulty: this.state.difficulty,
            lastPlayed: new Date().toISOString()
        };
        localStorage.setItem('hangmanGameSession', JSON.stringify(session));
    }

    // Performs cleanup operations before game exit
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

// Initialize game when the page loads
if (document.querySelector('.game-container')) {
    const game = new HangmanGame();

    // Handle cleanup
    window.addEventListener('beforeunload', () => {
        game.cleanup();
    });
}
// Export game class for module usage
export { HangmanGame };