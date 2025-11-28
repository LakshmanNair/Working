import api from './axiosInstance';

// Create promotion (manager)
export const createPromotion = async (data) => {
  const response = await api.post('/promotions', data);
  return response.data;
};

// List promotions (all users)
export const listPromotions = async (params = {}) => {
  const response = await api.get('/promotions', { params });
  return response.data;
};

// Get promotion details
export const getPromotion = async (promotionId) => {
  const response = await api.get(`/promotions/${promotionId}`);
  return response.data;
};

// Update promotion (manager)
export const updatePromotion = async (promotionId, data) => {
  const response = await api.patch(`/promotions/${promotionId}`, data);
  return response.data;
};

// Delete promotion (manager)
export const deletePromotion = async (promotionId) => {
  const response = await api.delete(`/promotions/${promotionId}`);
  return response.data;
};

