import api from './axiosInstance';

// Get summary statistics (manager)
export const getSummary = async () => {
  const response = await api.get('/analytics/summary');
  return response.data;
};

// Get transactions per day (manager)
export const getTransactionsPerDay = async (days = 30) => {
  const response = await api.get('/analytics/transactions-per-day', {
    params: { days },
  });
  return response.data;
};

// Get promotion usage statistics (manager)
export const getPromotionUsage = async () => {
  const response = await api.get('/analytics/promotion-usage');
  return response.data;
};

