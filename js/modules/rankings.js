import { StorageManager } from './storage.js';

/**
* @class RankingsManager
* Handles leaderboard data processing and DOM updates
*/
class RankingsManager {
   constructor() {
       this.storage = new StorageManager();
       this.initialiseRankings();
   }

   /**
    * Initialises ranking system and sets update interval
    * @private
    */
   initialiseRankings() {
       this.updateRankings();
       // Periodic refresh cycle: 30s
       setInterval(() => this.updateRankings(), 30000);
   }

   /**
    * Updates leaderboard display with current ranking data
    * Processes user scores and renders sorted results
    */
   async updateRankings() {
       const rankingsBody = document.getElementById('rankings-body');
       if (!rankingsBody) return;

       const users = this.storage.getAllUsers();

       // Handle empty dataset
       if (!users?.length) {
           rankingsBody.innerHTML = this.generateEmptyStateMarkup();
           return;
       }

       // Process and sort user rankings
       const sortedUsers = this.processUserRankings(users);
       const currentUser = this.storage.getCurrentUser();

       // Render sorted rankings
       rankingsBody.innerHTML = this.generateRankingsMarkup(sortedUsers, currentUser);
   }

    //Processes and sorts user data for rankings
   processUserRankings(users) {
       return users
           .filter(user => user?.username) // Data integrity check
           .sort((a, b) => {
               const scoreA = a.stats?.highScore || 0;
               const scoreB = b.stats?.highScore || 0;
               return scoreB - scoreA;
           });
   }

    //Generates markup for empty rankings state
   generateEmptyStateMarkup() {
       return `
           <tr>
               <td colspan="4" class="no-data">
                   No players found. Start playing to appear on the leaderboard!
               </td>
           </tr>`;
   }

   /**
    * Generates leaderboard HTML markup
    * Processed user rankings
    * Active user session data
    * @returns {string} Generated rankings HTML
    */
   generateRankingsMarkup(sortedUsers, currentUser) {
       return sortedUsers.map((user, index) => {
           const isCurrentUser = currentUser && user.id === currentUser.id;
           return `
               <tr class="${isCurrentUser ? 'current-user' : ''}">
                   <td>${index + 1}</td>
                   <td>${this.escapeHtml(user.username || 'Unknown Player')}</td>
                   <td>${Math.round(user.stats?.highScore || 0).toLocaleString()}</td>
               </tr>
           `;
       }).join('');
   }

    //Sanitises user input for XSS prevention
  
   escapeHtml(text) {
       const div = document.createElement('div');
       div.textContent = text;
       return div.innerHTML;
   }
}

// System initialisation
const rankings = new RankingsManager();

export { RankingsManager };