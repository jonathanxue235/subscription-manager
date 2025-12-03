import api from './api';
import storage from '../utils/storage';

const budgetService = {
  // get user's monthly budget
  getBudget: async () => {
    const token = storage.getToken();
    const response = await api.get('/api/budget', token);
    return response;
  },

  // update
  updateBudget: async (monthlyBudget) => {
    const token = storage.getToken();
    const response = await api.put('/api/budget', { monthlyBudget }, token);
    return response;
  },

  checkBudget: async (cost, frequency, customFrequencyDays = null) => {
    const token = storage.getToken();
    const response = await api.post('/api/budget/check', {
      cost,
      frequency,
      customFrequencyDays
    }, token);
    return response;
  }
};

export default budgetService;
