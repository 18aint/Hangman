  import { StorageManager } from './modules/storage.js';
  import { UserDisplay } from './modules/userDisplay.js';
  import { AchievementsManager } from './modules/achievements.js'; 
  
  class App {
     constructor() {
         // Initialise core components
         this.storage = new StorageManager();
         this.achievements = new AchievementsManager(this.storage);
         this.userDisplay = new UserDisplay(this.storage);
         
         // Start application
         this.initialiseApp();  
     }
  
     // Sets up core app functionality and auth
     initialiseApp() {
         this.updateAuthDisplay();
  
         // Handle logout across all pages
         const logoutLink = document.getElementById('logoutLink');
         if (logoutLink) {
             logoutLink.addEventListener('click', (e) => {
                 e.preventDefault();
                 this.storage.clearCurrentUser();
                 // Redirect based on current path
                 window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
             });
         }
     }
  
     // Toggle auth UI elements based on login state
     updateAuthDisplay() {
         const currentUser = this.storage.getCurrentUser();
         const registerLink = document.getElementById('registerLink');
         const loginLink = document.getElementById('loginLink');
         const logoutLink = document.getElementById('logoutLink');
  
         if (currentUser) {
             // Hide auth links when logged in
             if (registerLink) registerLink.style.display = 'none';
             if (loginLink) loginLink.style.display = 'none';
             if (logoutLink) {
                 // Show welcome message + logout
                 logoutLink.style.display = 'block';
                 const userDisplay = document.createElement('span');
                 userDisplay.className = 'user-display';
                 userDisplay.textContent = `Welcome, ${currentUser.username}`;
                 logoutLink.parentNode.insertBefore(userDisplay, logoutLink);
             }
         } else {
             // Show auth links when logged out
             if (registerLink) registerLink.style.display = 'block';
             if (loginLink) loginLink.style.display = 'block';
             if (logoutLink) logoutLink.style.display = 'none';
         }
     }
  
  }
  
  // Start application
  new App();