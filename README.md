# Modern Hangman Game

A feature-rich implementation of the classic Hangman game with multiple game modes, achievements, and global rankings.

## Features

### Game Modes
- **Classic Mode** 🎯
  - Traditional hangman gameplay
  - Progressive difficulty
  - Score multiplier: 2x

- **Time Attack** ⏱️
  - Race against the clock
  - Bonus time for correct guesses
  - Score multiplier: 5x

- **Survival Mode** 💀
  - One life only
  - Infinite time
  - Score multiplier: 10x

### Power-ups System
- 💡 Hint: Reveals a letter
- ⏭️ Skip Word: Skip current word
- ❤️ Extra Life: Adds one life

### Additional Features
- User authentication system
- Global rankings
- Achievement system
- Progressive difficulty
- Streak mechanics
- High score tracking

## Technical Details

### Built With
- HTML5
- CSS3
- JavaScript (ES6+)
- Local Storage for data persistence

### Project Structure

Hangman/
├── css/
│ ├── main.css
│ ├── game.css
│ └── achievements.css
├── js/
│ └── modules/
│ ├── game.js
│ ├── storage.js
│ ├── rankings.js
│ └── achievements.js
├── pages/
│ ├── game.html
│ ├── login.html
│ ├── register.html
│ ├── rankings.html
│ └── achievements.html
└── index.html


## Getting Started

1. Visit the game at: [Hangman Game](https://18aint.github.io/Hangman)
2. Create an account or login
3. Choose your preferred game mode
4. Start playing!

## Game Mechanics

### Difficulty Progression
- Easy: Simple 3-4 letter words
- Medium: 5-6 letter words
- Hard: 7-8 letter words
- Expert: 9+ letter words with complex vocabulary

### Scoring System
- Base points for each correct letter
- Multipliers based on:
  - Game mode
  - Current streak
  - Word difficulty
  - Time remaining (Time Attack mode)

### Achievement System
- Multiple achievement categories
- Special rewards for milestone completions
- Progress tracking

## Contributing

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

Wayne Kuvi - waynekuvi@gmail.com
Project Link: https://github.com/18aint/Hangman
