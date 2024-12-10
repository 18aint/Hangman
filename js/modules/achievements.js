import { StorageManager } from './storage.js';

export class AchievementsManager {
    constructor(storage) {
        this.storage = storage;
        this.achievements = {
            firstWin: {
                id: 'firstWin',
                name: 'First Victory',
                description: 'Win your first game',
                icon: '🏆',
                condition: (stats) => {
                    // Check total words completed instead of wins
                    return (stats.totalWordsCompleted || 0) >= 1;
                },
                progress: (stats) => ({
                    current: stats.totalWordsCompleted || 0,
                    required: 1,
                    format: 'words'
                })
            },
            perfectGame: {
                id: 'perfectGame',
                name: 'Perfect Game',
                description: 'Complete a word without any mistakes',
                icon: '⭐',
                condition: (stats, gameState) => gameState.remainingLives === gameState.maxLives,
                progress: (stats, gameState) => ({
                    current: gameState.remainingLives || 0,
                    required: gameState.maxLives || 6,
                    format: 'lives'  // Add format
                })
            },
            streakMaster: {
                id: 'streakMaster',
                name: 'Streak Master',
                description: 'Achieve a streak of 10 or more',
                icon: '🔥',
                condition: (stats) => stats.maxStreak >= 10,
                progress: (stats) => ({
                    current: stats.maxStreak || 0,
                    required: 10,
                    format: 'streak'  // Add format
                })
            },
            highScorer: {
                id: 'highScorer',
                name: 'High Scorer',
                description: 'Score 1000 points in a single game',
                icon: '📈',
                condition: (stats) => stats.highScore >= 1000,
                progress: (stats) => ({
                    current: stats.highScore || 0,
                    required: 1000,
                    format: 'points'  // Add format
                })
            },
            wordsmith: {
                id: 'wordsmith',
                name: 'Wordsmith',
                description: 'Complete 50 words',
                icon: '📚',
                condition: (stats) => stats.totalWordsCompleted >= 50,
                progress: (stats) => ({
                    current: stats.totalWordsCompleted || 0,
                    required: 50,
                    format: 'words'
                })
            },
            expertSurvival: {
                id: 'expertSurvival',
                name: 'Expert Survivor',
                description: 'Complete 5 words in expert difficulty',
                icon: '🎯',
                condition: (stats) => stats.expertWordsCompleted >= 5,
                progress: (stats) => ({
                    current: stats.expertWordsCompleted || 0,
                    required: 5,
                    format: 'expert words'
                })
            },
            speedDemon: {
                id: 'speedDemon',
                name: 'Speed Demon',
                description: 'Complete a word in under 10 seconds',
                icon: '⚡',
                condition: (stats, gameState) => gameState.timeLeft >= 50,
                progress: (stats, gameState) => ({
                    current: gameState.timeLeft >= 50 ? 50 : gameState.timeLeft || 0,
                    required: 50,
                    format: 'seconds'  // Add format
                })
            },
            tenacious: {
                id: 'tenacious',
                name: 'Tenacious',
                description: 'Win a game with only 1 life remaining',
                icon: '❤️',
                condition: (stats, gameState) => gameState.remainingLives === 1,
                progress: (stats, gameState) => ({
                    current: gameState.remainingLives === 1 ? 1 : 0,
                    required: 1,
                    format: 'lives'  // Add format
                })
            }
        };
    }


    calculateProgress(achievement, stats, gameState) {
        if (!achievement.progress) return null;

        // Ensure stats has the required properties
        const currentStats = {
            totalWordsCompleted: stats.totalWordsCompleted || 0,
            expertWordsCompleted: stats.expertWordsCompleted || 0,
            timeAttackHighScore: stats.timeAttackHighScore || 0,
            ...stats
        };

        const progress = achievement.progress(currentStats, gameState);

        return {
            current: progress.current,
            required: progress.required,
            percentage: Math.min(Math.round((progress.current / progress.required) * 100), 100),
            format: progress.format
        };
    }

    getProgressFormat(achievementId) {
        const formats = {
            firstWin: 'wins',
            perfectGame: 'lives',
            streakMaster: 'streak',
            highScorer: 'points',
            wordsmith: 'words',
            expertSurvival: 'expert words',
            speedDemon: 'seconds',
            tenacious: 'wins',
        };
        return formats[achievementId] || '';
    }

    checkAchievements(stats, gameState = {}) {
        const user = this.storage.getCurrentUser();
        if (!user) return;

        // Ensure we have default values for gameState
        const safeGameState = {
            remainingLives: gameState.remainingLives || 0,
            maxLives: gameState.maxLives || 6,
            timeLeft: gameState.timeLeft || 0,
            gameMode: gameState.gameMode || 'classic',
            difficulty: gameState.difficulty || 'easy',
            score: gameState.score || 0,
            ...gameState
        };

        // Initialize stats if they don't exist
        if (!user.stats) {
            user.stats = {
                totalWordsCompleted: 0,
                expertWordsCompleted: 0,
                survivalGamesWon: 0,
                timeAttackHighScore: 0,
                wins: 0,
                gamesPlayed: 0,
                highScore: 0
            };
        }

        const userAchievements = user.achievements || [];
        let newAchievements = [];

        Object.values(this.achievements).forEach(achievement => {
            try {
                if (!userAchievements.includes(achievement.id) &&
                    achievement.condition(stats, safeGameState)) {
                    userAchievements.push(achievement.id);
                    newAchievements.push(achievement);
                }
            } catch (error) {
                console.error(`Error checking achievement ${achievement.id}:`, error);
            }
        });

        if (newAchievements.length > 0) {
            user.achievements = userAchievements;
            this.storage.updateUser(user);
            this.showAchievementNotification(newAchievements);
            this.updateAchievementCount();
        }

        return newAchievements;
    }
    displayStats() {
        const user = this.storage.getCurrentUser();
        if (!user) return;

        // Get the stats from userStats
        const stats = user.stats || {};

        // Update display elements with stats from userStats
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed || 0;
        document.getElementById('totalWins').textContent = stats.wins || 0;
        document.getElementById('wordsCompleted').textContent = stats.totalWordsCompleted || 0;

        console.log('Current user stats:', stats); // Debug log
    }
    updateAchievementCount() {
        const countElement = document.getElementById('achievements-count');
        if (!countElement) return;

        const user = this.storage.getCurrentUser();
        if (!user) {
            countElement.style.display = 'none';
            return;
        }

        const achievementCount = user.achievements?.length || 0;
        if (achievementCount > 0) {
            countElement.textContent = achievementCount;
            countElement.style.display = 'inline-block';
        } else {
            countElement.style.display = 'none';
        }
    }

    showAchievementNotification(achievements) {
        achievements.forEach(achievement => {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-content">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-text">
                        <h4>Achievement Unlocked!</h4>
                        <h3>${achievement.name}</h3>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);

            setTimeout(() => notification.classList.add('show'), 10);

            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        });
    }

    displayAchievements() {
        const container = document.getElementById('achievements-container');
        if (!container) return;

        const user = this.storage.getCurrentUser();
        if (!user) {
            container.innerHTML = `
                <div class="login-prompt">
                    <h2>Please log in to view achievements</h2>
                    <p>Create an account or log in to track your achievements!</p>
                    <div class="auth-buttons">
                        <a href="login.html" class="btn btn-primary">Login</a>
                        <a href="register.html" class="btn btn-secondary">Register</a>
                    </div>
                </div>
            `;
            return;
        }

        const userAchievements = user.achievements || [];
        const totalAchievements = Object.keys(this.achievements).length;
        const unlockedCount = userAchievements.length;
        const stats = user.stats || {};

        // Add stats summary section
        const statsSummaryHTML = `
            <div class="stats-summary">
                <h3>Player Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-title">Games Played</div>
                        <div class="stat-value">${stats.gamesPlayed || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Total Wins</div>
                        <div class="stat-value">${stats.wins || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Words Completed</div>
                        <div class="stat-value">${stats.totalWordsCompleted || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">High Score</div>
                        <div class="stat-value">${stats.highScore || 0}</div>
                    </div>
                </div>
            </div>
        `;

        // Generate achievements grid HTML
        const achievementsHTML = Object.values(this.achievements).map(achievement => {
            const progress = this.calculateProgress(achievement, stats, {
                remainingLives: stats.lastGameLives || 0,
                maxLives: stats.maxLives || 6,
                timeLeft: stats.lastGameTime || 0
            });

            const isUnlocked = userAchievements.includes(achievement.id);

            const progressDisplay = progress ?
                `${progress.current}/${progress.required} ${progress.format || ''}` :
                'Not Started';

            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-header">
                        <span class="achievement-icon">${achievement.icon}</span>
                        <span class="progress-fraction">${progressDisplay}</span>
                    </div>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    ${isUnlocked ?
                    '<span class="achievement-unlocked">✓ Unlocked</span>' :
                    `<div class="achievement-progress">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress?.percentage || 0}%"></div>
                            </div>
                        </div>`
                }
                </div>
            `;
        }).join('');

        // Build the complete container HTML
        container.innerHTML = `
            <h2 class="achievements-title">Your Achievements</h2>
            ${statsSummaryHTML}
            <div class="achievements-summary">
                <div class="progress-tracker">
                    <span class="fraction">${unlockedCount}/${totalAchievements}</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${(unlockedCount / totalAchievements) * 100}%"></div>
                    </div>
                    <p>Achievements Unlocked</p>
                </div>
            </div>
            <div class="achievements-grid">
                ${achievementsHTML}
            </div>
        `;

        // Update achievement count in navbar
        this.updateAchievementCount();

        // Debug log
        console.log('Displayed achievements and stats:', {
            total: totalAchievements,
            unlocked: unlockedCount,
            userStats: stats
        });
    }
    initializeAchievements() {
        this.updateAchievementCount();

        if (document.getElementById('achievements-container')) {
            this.displayAchievements();
        }
    }
}

// Initialize achievements if we're on the achievements page
if (document.getElementById('achievements-container')) {
    const storage = new StorageManager();
    const achievementsManager = new AchievementsManager(storage);
    achievementsManager.initializeAchievements();
}