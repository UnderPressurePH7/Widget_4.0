import CoreService from './coreService.js';
import UIService from './uiService.js';
import { STATS } from '../battle-history/scripts/constants.js';
import { StateManager } from '../battle-history/scripts/stateManager.js';

export default class SquadWidget {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    try {
      const hasAccess = await this.checkAccessKey();
      
      if (!hasAccess) {
        this.showAccessDenied();
        return;
      }
      
      this.initializeServices();
    } catch (error) {
      console.error('Error in init:', error);
      this.showAccessDenied();
    }
  }

  initializeServices() {
    try {
      this.coreService = new CoreService();
      this.uiService = new UIService(this.coreService);
      this.initialize();
    } catch (error) {
      console.error('Error initializing services:', error);
      this.showAccessDenied();
    }
  }

  initialize() {
    try {
      this.coreService.loadFromServer()
        .then(() => {
          this.uiService.updatePlayersUI();
        })
        .catch(error => {
          console.error('Error loading data:', error);
          this.uiService.updatePlayersUI();
        });
    } catch (error) {
      console.error('Error in initialize:', error);
    }
  }

  async checkAccessKey() {
    try {
      const urlKey = window.location.search.substring(1);
      const keyAPI = urlKey || StateManager.getAccessKey();
      if (!keyAPI) return false;

      const baseUrl = atob(STATS.WEBSOCKET_URL);
      const apiUrl = `${baseUrl}/api/data/${keyAPI}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': keyAPI,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
    
      if (response.status === 401 || response.status === 403) {
        return false;
      }
  
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        
        if (response.status === 0 || response.status >= 500) {
          console.error('Server or network error - treating as access denied');
          return false;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return false;
      }
  
      if (data && data.success !== false) {
        if (urlKey) {

          StateManager.setAccessKey(urlKey);
        }
        return true;
      }
      
      return false;
  
    } catch (error) {
      console.error('Error in checkAccessKey:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue - check server configuration');
      }
      
      if (error.name === 'AbortError') {
        console.error('Request was aborted');
      }
      
      console.error('Detailed error:', error);
      return false;
    }
  }

  showAccessDenied() {
    try {
      const showDenied = () => {
        
        document.body.innerHTML = '';
        
        const container = document.createElement('div');
        container.id = 'access-denied-container';
        container.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.8);
          z-index: 99999;
          font-family: Arial, sans-serif;
        `;

        const message = document.createElement('div');
        message.style.cssText = `
          text-align: center;
          padding: 3em;
          border-radius: 1em;
          background-color: rgba(20, 20, 20, 0.95);
          color: #ffffff;
          border: 2px solid #ff4444;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          max-width: 400px;
        `;

        message.innerHTML = `
          <h2 style="color: #ff4444; margin-bottom: 1em; font-size: 1.5em;">Доступ заборонено</h2>
          <p style="margin-bottom: 1em; font-size: 1.1em;">Невірний ключ доступу або помилка сервера</p>
          <p style="font-size: 0.9em; color: #cccccc;">Перевірте правильність посилання або спробуйте пізніше</p>
        `;

        container.appendChild(message);
        document.body.appendChild(container);
        
      };

      if (document.body) {
        showDenied();
      } else {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', showDenied);
        } else {
          setTimeout(showDenied, 100);
        }
      }
    } catch (error) {
      console.error('Error in showAccessDenied:', error);
      alert('Доступ заборонено. Невірний ключ доступу або помилка сервера.');
    }
  }
}