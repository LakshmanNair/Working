const express = require('express');
const router = express.Router();
const controller = require('../controllers/eventsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requestTime } = require('../middleware/time');

router.post('/', requireAuth, requestTime, controller.createEvent);

router.get('/', requireAuth, requestTime, controller.listEvents);

router.get('/:eventId', requireAuth, requestTime, controller.getEvent);

router.patch('/:eventId', requireAuth, requestTime, controller.updateEvent);

router.delete('/:eventId', requireAuth, requestTime, controller.deleteEvent);

router.post('/:eventId/organizers', requireAuth, requestTime, controller.addOrganizer);

router.delete('/:eventId/organizers/:userId', requireAuth, requestTime, controller.removeOrganizer);

router.post('/:eventId/transactions', requireAuth, requestTime, controller.awardEventPoints);

router.post("/:eventId/guests/me", requireAuth, requestTime, controller.eventAddSelf);

router.delete("/:eventId/guests/me", requireAuth, requestTime, controller.eventRemoveSelf);

router.post('/:eventId/guests', requireAuth, requireRole('Manager'), requestTime, controller.eventAddGuest);

router.delete("/:eventId/guests/:userId", requireAuth, requireRole('Manager'), requestTime, controller.eventRemoveGuest);


module.exports = router;
