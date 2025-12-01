// frontend/src/api/usersApi.js
import api from './axiosInstance';

/**
 * GET /users/me
 * Fetch the current logged-in user's profile.
 */
export async function fetchCurrentUser() {
  const res = await api.get('/users/me');
  return res.data;
}

/**
 * PATCH /users/me
 * Update the current logged-in user's profile fields.
 */
export async function updateCurrentUser(payload) {
  const res = await api.patch('/users/me', payload);
  return res.data;
}

/**
 * GET /users
 * Manager/superuser list of users with filters + pagination.
 * Returns { count, results }.
 */
export async function fetchUsers({
  name = '',
  role = '',
  verified = '',
  activated = '',
  page = 1,
  limit = 10,
} = {}) {
  const params = { page, limit };

  if (name) params.name = name;
  if (role) params.role = role;
  if (verified !== '') params.verified = verified;
  if (activated !== '') params.activated = activated;

  const res = await api.get('/users', { params });
  return res.data;
}

/**
 * GET /users/:userId
 * Fetch a single user's details (cashier/manager/superuser view).
 */
export async function fetchUserById(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data;
}

/**
 * PATCH /users/:userId
 * Update a specific user's email/role/verified/suspicious (manager+).
 */
export async function updateUserById(userId, payload) {
  const res = await api.patch(`/users/${userId}`, payload);
  return res.data;
}

/**
 * Alias helper: get user by ID (used by transfer flows).
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Search users by UTORid or name.
 * Uses the 'name' query param, which backend matches against name and utorid.
 * Returns { count, results }.
 */
export const searchUsersByUtorid = async (utorid) => {
  const response = await api.get('/users', {
    params: { name: utorid },
  });
  return response.data;
};
