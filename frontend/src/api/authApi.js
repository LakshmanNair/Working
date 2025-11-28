import api from './axiosInstance';

export const login = async (utorid, password) => {
  const response = await api.post('/auth/tokens', { utorid, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

