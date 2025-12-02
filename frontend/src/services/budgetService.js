import api from './api';

const budgetService = {
  // get user's monthly budget
  getBudget: async () => {
    const token = localStorage.getItem('token');
    const response = await api.get('/api/budget', token);
    return response;
  },

  // update
  updateBudget: async (monthlyBudget) => {
    const token = localStorage.getItem('token');
    const response = await api.put('/api/budget', { monthlyBudget }, token);
    return response;
  },

  checkBudget: async (cost, frequency, customFrequencyDays = null) => {
    const token = localStorage.getItem('token');
    const response = await api.post('/api/budget/check', {
      cost,
      frequency,
      customFrequencyDays
    }, token);
    return response;
  }
};

export default budgetService;
