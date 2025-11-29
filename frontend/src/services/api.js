/** API Service to handle all HTTP requests to backend
 * Information Hiding: hides fetch api details, hides backend url, hides request/response formatting. simple interface for other services

 */

class ApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await this._handleResponse(response);
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }

  async get(endpoint, token = null) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      return await this._handleResponse(response);
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }

  async _handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Request failed';
      throw new Error(errorMessage);
    }

    return data;
  }
}

const api = new ApiService();

export default api;
