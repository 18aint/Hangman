# Modern Hangman Game

A contemporary take on the classic Hangman word-guessing game, featuring multiple game modes, achievements, and competitive elements.

## 🎮 Demo

Try the game: [Modern Hangman](https://18aint.github.io/Hangman)

## ✨ Features

### Game Modes

#### 🎯 Classic Mode
- Traditional hangman gameplay with a modern twist
- Progressive difficulty system
- Base score multiplier: 2x
- Perfect for learning the game mechanics

#### ⏱️ Time Attack Mode
- Fast-paced gameplay against the clock
- Time bonuses for correct letter guesses
- High-pressure scoring system (5x multiplier)
- Dynamic time management mechanics

#### 💀 Survival Mode
- Ultimate challenge with single life
- Infinite playtime
- Highest risk-reward ratio (10x multiplier)
- Test your word mastery

### 🎁 Power-up System

Power-up | Effect | Acquisition
---------|--------|-------------
💡 Hint | Reveals a random correct letter | Achievement rewards, daily login
⏭️ Skip | Bypass current word without penalty | Achievement milestones
❤️ Extra Life | Additional chance in Classic/Time Attack | Special events

### 📊 Progression Systems

- **User Profiles**: Track your gaming journey
- **Global Rankings**: Compete worldwide
- **Achievement System**: 30+ unique achievements
- **Dynamic Difficulty**: Adapts to player skill
- **Streak System**: Rewards consistent play
- **Performance Analytics**: Track your improvement

## 🛠️ Technical Stack

### Core Technologies
- HTML5 with Semantic Elements
- CSS3 with Modern Features
  - Flexbox/Grid Layout
  - CSS Variables
  - Responsive Design
- JavaScript ES6+
  - Modular Architecture
  - Async/Await Pattern
  - Local Storage Integration

### Project Architecture
```
Hangman/
├── assets/
│   ├── images/
│   ├── sounds/
│   └── fonts/
├── css/
│   ├── main.css        # Core styles
│   ├── game.css        # Game-specific styles
│   └── achievements.css # Achievement system styles
├── js/
│   ├── modules/
│   │   ├── game.js        # Core game logic
│   │   ├── storage.js     # Data persistence
│   │   ├── rankings.js    # Leaderboard system
│   │   └── achievements.js # Achievement tracking
│   └── app.js         # Main application entry
├── pages/
│   ├── game.html
│   ├── profile.html
│   ├── rankings.html
│   └── achievements.html
└── index.html
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 70+, Firefox 63+, Safari 12+)
- JavaScript enabled
- Stable internet connection

### Quick Start
1. Visit [Modern Hangman](https://18aint.github.io/Hangman)
2. Create account or login
3. Select game mode
4. Start playing!

### Local Development
```bash
# Clone repository
git clone https://github.com/18aint/Hangman.git

# Navigate to project
cd Hangman

# If using VS Code with Live Server
code .
# Then use Live Server extension to run

# Or use any local server
python -m http.server 8000
```

## 🎯 Game Mechanics

### Difficulty Progression

Level | Word Length | Vocabulary | Time Limit
------|------------|------------|------------
Easy | 3-4 letters | Basic | 120 seconds
Medium | 5-6 letters | Common | 90 seconds
Hard | 7-8 letters | Advanced | 60 seconds
Expert | 9+ letters | Complex | 45 seconds

### Scoring Formula
```
Final Score = Base Points × Mode Multiplier × Streak Multiplier × Difficulty Modifier
```

### Achievement Categories
- 🌟 Gameplay Mastery
- 🏃 Speed Demon
- 💯 Perfect Scores
- 🔄 Daily Challenges
- 🏆 Special Events

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 📧 Contact

Wayne Kuvi - waynekuvi@gmail.com

Project Link: https://github.com/18aint/Hangman

## 🙏 Acknowledgments

- Word list provided by [WordsAPI](https://wordsapi.com/)
- Sound effects from [FreeSound](https://freesound.org/)
- Icon set by [FontAwesome](https://fontawesome.com/)
