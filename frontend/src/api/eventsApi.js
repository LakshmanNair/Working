// frontend/src/api/eventsApi.js
import api from './axiosInstance';

// GET /events
export async function fetchEvents(params = {}) {
  const res = await api.get('/events', { params });
  return res.data;
}

// GET /events/:eventId
export async function fetchEventById(eventId) {
  const res = await api.get(`/events/${eventId}`);
  return res.data;
}

// POST /events/:eventId/guests/me
export async function joinEvent(eventId) {
  const res = await api.post(`/events/${eventId}/guests/me`);
  return res.data;
}

// DELETE /events/:eventId/guests/me
export async function leaveEvent(eventId) {
  const res = await api.delete(`/events/${eventId}/guests/me`);
  return res.data;
}

// GET /events (manager view)
export async function fetchManagerEvents(params = {}) {
  const res = await api.get('/events', { params }); // backend inspects role [attached_file:13]
  return res.data;
}

//PATCH /events/:eventId
export async function updateEvent(eventId, payload) {
  const res = await api.patch(`/events/${eventId}`, payload); // uses updateEvent controller [attached_file:13]
  return res.data;
}

// DELETE /events/:eventId
export async function deleteEvent(eventId) {
  const res = await api.delete(`/events/${eventId}`); // deleteEvent controller [attached_file:13]
  return res.data;
}

// POST /events/:eventId/organizers
export async function addOrganizer(eventId, utorid) {
  const res = await api.post(`/events/${eventId}/organizers`, { utorid }); // [attached_file:13]
  return res.data; // returns event with organizers list
}

// DELETE /events/:eventId/organizers/:userId
export async function removeOrganizer(eventId, userId) {
  const res = await api.delete(`/events/${eventId}/organizers/${userId}`); // [attached_file:13]
  return res.data;
}

// POST /events/:eventId/guests
export async function addGuestToEvent(eventId, utorid) {
  const res = await api.post(`/events/${eventId}/guests`, { utorid }); // [attached_file:13]
  return res.data; // includes guestAdded + numGuests
}

// DELETE /events/:eventId/guests/:userId
export async function removeGuestFromEvent(eventId, userId) {
  const res = await api.delete(`/events/${eventId}/guests/${userId}`); // [attached_file:13]
  return res.data;
}

// POST /events/:eventId/transactions
export async function awardPointsToGuest(eventId, { utorid, amount, remark }) {
  const res = await api.post(`/events/${eventId}/transactions`, {
    type: 'event',
    utorid,
    amount,
    remark: remark || '',
  }); // [attached_file:13]
  return res.data;
}

// POST /events/:eventId/transactions
export async function awardPointsToAllGuests(eventId, { amount, remark }) {
  const res = await api.post(`/events/${eventId}/transactions`, {
    type: 'event',
    amount,
    remark: remark || '',
  }); // [attached_file:13]
  return res.data; // array of transactions
}