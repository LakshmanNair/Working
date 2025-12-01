import api from './axiosInstance';

// Create purchase transaction (cashier)
export const createPurchase = async (data) => {
  const response = await api.post('/transactions', {
    type: 'purchase',
    ...data,
  });
  return response.data;
};

// Create adjustment transaction (manager)
export const createAdjustment = async (data) => {
  const response = await api.post('/transactions', {
    type: 'adjustment',
    ...data,
  });
  return response.data;
};

// Create redemption request (regular user)
export const createRedemption = async (data) => {
  const response = await api.post('/users/me/transactions', data);
  return response.data;
};

// Process redemption (cashier)
export const processRedemption = async (transactionId) => {
  const response = await api.patch(`/transactions/${transactionId}/processed`, {
    processed: true,
  });
  return response.data;
};

// List my transactions (regular user)
export const listMyTransactions = async (params = {}) => {
  const response = await api.get('/users/me/transactions', { params });
  return response.data;
};

// List all transactions (manager)
export const listTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

// Get transaction details (manager)
export const getTransaction = async (transactionId) => {
  const response = await api.get(`/transactions/${transactionId}`);
  return response.data;
};

// Toggle suspicious flag (manager)
export const toggleSuspicious = async (transactionId, suspicious) => {
  const response = await api.patch(`/transactions/${transactionId}/suspicious`, { suspicious });
  return response.data;
};

// Transfer points (regular user)
// Note: userId is the recipient's user ID (not UTORid)
export const transferPoints = async (userId, amount, remark = '') => {
  const response = await api.post(`/users/${userId}/transactions`, {
    type: 'transfer',
    amount: Math.abs(amount), // Positive amount (API handles negative for sender)
    remark,
  });
  return response.data;
};

