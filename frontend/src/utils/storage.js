/**
 * this is the abstract localStorage operation. it hides the localStorage API, storage keys
 */

class StorageService {
  constructor() {
    this.TOKEN_KEY = 'token';
    this.USER_KEY = 'user';
  }

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

const storage = new StorageService();

export default storage;
