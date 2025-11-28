'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// -------------------------------------------------------------
// POST /events
// Description: Create a new point-earning event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function createEvent(req, res) {
  try {
    if (!req.auth || !req.auth?.role || !req.auth?.userId) {
      return res.status(401).json({ error: "Invalid or missing token." });
    } 

    const role = req.auth?.role;

    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const { name, description, location, startTime, endTime, capacity = null, points } = req.body || {};

    if (!name || !description || !location || !startTime || !endTime || points == null)
      return res.status(400).json({ error: 'Missing required fields' });

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start) || isNaN(end))
      return res.status(400).json({ error: 'Invalid date format' });

    if (end <= start)
      return res.status(400).json({ error: 'End time must be after start time' });

    if (capacity !== null && (typeof capacity !== 'number' || capacity <= 0))
      return res.status(400).json({ error: 'Capacity must be positive or null' });

    if (typeof points !== 'number' || points <= 0)
      return res.status(400).json({ error: 'Points must be positive integer' });

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: start,
        endTime: end,
        capacity,
        pointsRemain: points,
        pointsAwarded: 0,
        published: false,
      },
      include: {
        organizers: true,
        guests: true,
      },
    });

    res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      pointsRemain: event.pointsRemain,
      pointsAwarded: event.pointsAwarded,
      published: event.published,
      organizers: [],
      guests: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


// -------------------------------------------------------------
// GET /events
// Description: Retrieve a list of events
// Clearance: Regular or higher
// -------------------------------------------------------------
async function listEvents(req, res) {
  try {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      location,
      started,
      ended,
      showFull = 'false',
      published,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validate pagination
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ error: "Invalid page or limit." });
    }

    // Regular users cannot specify "published"
    if (role === 'regular' && published !== undefined) {
      return res.status(400).json({ error: 'Regular users cannot filter by published status' });
    }

    const filters = {};

    // Always filter by published for regular users FIRST
    if (role === 'regular') {
      filters.published = true;
    } else if (published !== undefined) {
      filters.published = published === 'true';
    }

    // Build filter conditions
    if (!(showFull === 'true')) {
      filters.OR = [
        { capacity: null },
        { guests: { none: {} } },
        { guests: { some: { confirmed: false } } },
      ];
    }

    if (name) filters.name = { contains: name };
    if (location) filters.location = { contains: location };

    const now = req.requestDate;

    if (started && ended)
      return res.status(400).json({ error: 'Specify only started or ended, not both' });

    if (started !== undefined)
      filters.startTime = started === 'true' ? { lte: now } : { gt: now };

    if (ended !== undefined)
      filters.endTime = ended === 'true' ? { lte: now } : { gt: now };

    // Pagination
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [count, events] = await Promise.all([
      prisma.event.count({ where: filters }),
      prisma.event.findMany({
        where: filters,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: { guests: true },
      }),
    ]);

    const results = events.map((e) => {
      const base = {
        id: e.id,
        name: e.name,
        location: e.location,
        startTime: e.startTime,
        endTime: e.endTime,
        capacity: e.capacity,
        numGuests: e.guests.length,
      };
      if (role !== 'regular') {
        base.pointsRemain = e.pointsRemain;
        base.pointsAwarded = e.pointsAwarded;
        base.published = e.published;
      }
      return base;
    });

    res.json({ count, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


// -------------------------------------------------------------
// GET /events/:eventId
// Description: Retrieve a single event
// Clearance: Regular or higher
// -------------------------------------------------------------
async function getEvent(req, res) {
  try {
    const role = req.auth?.role;
    const userId = req.auth?.userId;
    const id = Number(req.params.eventId)
    if (isNaN(id)) return res.status(404).json({ error: 'Event not found' });

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizers: { include: { user: true } },
        guests: { include: { user: true } },
      },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Regular users can't see unpublished events
    if (role === 'regular' && !event.published) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // Regular users see limited info
    if (role === 'regular') {
      return res.json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        organizers: event.organizers.map((o) => ({
          id: o.user.id,
          utorid: o.user.utorid,
          name: o.user.name,
        })),
        numGuests: event.guests.length,
      });
    }

    // Manager or Organizer sees full details
    res.json({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      pointsRemain: event.pointsRemain,
      pointsAwarded: event.pointsAwarded,
      published: event.published,
      organizers: event.organizers.map((o) => ({
        id: o.user.id,
        utorid: o.user.utorid,
        name: o.user.name,
      })),
      guests: event.guests.map((g) => ({
        id: g.user.id,
        utorid: g.user.utorid,
        name: g.user.name,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// PATCH /events/:eventId
// Description: Update an existing event.
// Clearance: Manager or higher, or an organizer for this event
// -------------------------------------------------------------
async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const id = parseInt(eventId);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const role = req.auth?.role;
    const userId = req.auth?.userId;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        guests: { where: { confirmed: true } },
        organizers: { include: { user: true } },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check permission: organizer or manager+
    const isOrganizer = event.organizers.some((o) => o.user.id === userId);
    if (!isOrganizer && !['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Not authorized to modify this event' });

    const now = req.requestDate;
    
    const updates = {};
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      capacity,
      points,
      published,
    } = req.body || {};

    // Parse dates if provided
    let newStart = event.startTime;
    let newEnd = event.endTime;
    let datesChanged = false;
    
    if (startTime !== undefined && startTime !== null) {
      newStart = new Date(startTime);
      if (isNaN(newStart.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      datesChanged = true;
    }
    
    if (endTime !== undefined && endTime !== null) {
      newEnd = new Date(endTime);
      if (isNaN(newEnd.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      datesChanged = true;
    }

    // Only validate date order if dates were actually changed
    if (datesChanged && newEnd <= newStart) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // --- Temporal restrictions ---
    const eventStarted = now >= event.startTime;
    const eventEnded = now >= event.endTime;

    // Prevent illegal updates after start or end
    if (eventStarted && (name !== undefined || description !== undefined || location !== undefined || startTime !== undefined || capacity !== undefined)) {
        return res
          .status(400)
          .json({ error: 'Cannot modify these fields after event has started' });
    }

    if (eventEnded && endTime !== undefined) {
      return res
        .status(400)
        .json({ error: 'Cannot update endTime after event has ended' });
    }

    // --- Capacity validation ---
    if (capacity !== undefined) {
      if (capacity !== null && (typeof capacity !== 'number' || capacity <= 0)) {
        return res.status(400).json({ error: 'Capacity must be positive or null' });
      }
      if (
        capacity !== null &&
        capacity < event.guests.length
      ) {
        return res
          .status(400)
          .json({ error: 'Capacity cannot be less than current confirmed guests' }); }
      updates.capacity = capacity;
    }

    // --- Points validation (manager only) ---
    if (points !== undefined) {
      if (!['manager', 'superuser'].includes(role))
        return res
          .status(403)
          .json({ error: 'Only managers may adjust event points' });
      const pointsNum = Number(points);
      if (isNaN(pointsNum) || !Number.isInteger(pointsNum) || pointsNum <= 0) {
        return res.status(400).json({ error: 'Points must be positive integer' });
      }
      if (pointsNum < event.pointsAwarded) {
        return res.status(400).json({
          error:
            'Points cannot be reduced below total points already awarded to guests',
        }); }

      const delta = pointsNum - (event.pointsRemain + event.pointsAwarded);
      updates.pointsRemain = event.pointsRemain + delta;
    }

    // --- Publish validation ---
    if (published !== undefined) {
      if (!['manager', 'superuser'].includes(role))
        return res
          .status(403)
          .json({ error: 'Only managers may publish events' });
      if (published !== true && published !== 'true') {
        return res
          .status(400)
          .json({ error: 'Published flag can only be set to true' }); }
      updates.published = true;
    }

    // --- Simple text updates ---
    if (name !== undefined && name !== null) updates.name = name;
    if (description !== undefined && description !== null) updates.description = description;
    if (location !== undefined && location !== null) updates.location = location;
    if (startTime !== undefined && startTime !== null) updates.startTime = newStart;
    if (endTime !== undefined && endTime !== null) updates.endTime = newEnd;

    // If no fields were updated
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updates,
    });

    // Build response with updated fields
    const response = {
      id: updated.id,
      name: updated.name,
      location: updated.location,
    };
    
    // Add updated fields to response (only if they were actually provided)
    if (name !== undefined && name !== null) response.name = updated.name;
    if (description !== undefined && description !== null) response.description = updated.description;
    if (location !== undefined && location !== null) response.location = updated.location;
    if (startTime !== undefined && startTime !== null) response.startTime = updated.startTime;
    if (endTime !== undefined && endTime !== null) response.endTime = updated.endTime;
    if (capacity !== undefined) response.capacity = updated.capacity;
    if (points !== undefined) {
      // Calculate total points from pointsRemain + pointsAwarded
      response.points = updated.pointsRemain + updated.pointsAwarded;
    }
    if (published !== undefined) response.published = updated.published;
    
    // Always include pointsRemain and pointsAwarded if points was updated
    if (points !== undefined) {
      response.pointsRemain = updated.pointsRemain;
      response.pointsAwarded = updated.pointsAwarded;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// DELETE /events/:eventId
// Description: Remove the specified event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;
    const id = parseInt(eventId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });

    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.published)
      return res.status(400).json({ error: 'Cannot delete a published event' });

    await prisma.event.delete({ where: { id } });

    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// POST /events/:eventId/organizers
// Description: Add an organizer to this event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function addOrganizer(req, res) {
  try {
    const { eventId } = req.params;
    const { utorid } = req.body || {};
    const id = parseInt(eventId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });
    if (!utorid) return res.status(400).json({ error: 'utorid required' });

    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const event = await prisma.event.findUnique({
      where: { id },
      include: { guests: true, organizers: { include: { user: true } } },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check event has not ended
    const now = req.requestDate;

    if (now > event.endTime)
      return res.status(410).json({ error: 'Event has ended' });

    // Find user
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if user is already a guest
    const isGuest = event.guests.some((g) => g.userId === user.id);
    if (isGuest)
      return res
        .status(400)
        .json({ error: 'User is already registered as a guest' });

    // Add as organizer (idempotent upsert)
    await prisma.eventOrganizer.create({
      data: { eventId: event.id, userId: user.id },
    });

    const updatedEvent = await prisma.event.findUnique({
      where: { id },
      include: { organizers: { include: { user: true } } },
    });

    res.status(201).json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      location: updatedEvent.location,
      organizers: updatedEvent.organizers.map((o) => ({
        id: o.user.id,
        utorid: o.user.utorid,
        name: o.user.name,
      })),
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'User already an organizer' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// DELETE /events/:eventId/organizers/:userId
// Description: Remove an organizer from this event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function removeOrganizer(req, res) {
  try {
    const { eventId, userId } = req.params;
    const event_id = parseInt(eventId);
    const user_id = parseInt(userId);

    if (isNaN(event_id) || isNaN(user_id))
      return res.status(400).json({ error: 'Invalid event or user ID' });

    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const organizer = await prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId: event_id, userId: user_id } },
    });
    if (!organizer)
      return res.status(404).json({ error: 'Organizer not found for this event' });

    await prisma.eventOrganizer.delete({
      where: { eventId_userId: { eventId: event_id, userId: user_id } },
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// POST /events/:eventId/transactions
// Description: Add a guest to this event.
// Clearance: Manager or higher, or organizer for this event
// -------------------------------------------------------------
async function awardEventPoints(req, res) {
  try {
    const { eventId } = req.params;
    const id = parseInt(eventId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });

    const role = req.auth?.role;
    const userId = req.auth?.userId;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    const { type, utorid: targetUtorid, amount: float_amount, remark = '' } = req.body || {};

    const amount = Number(float_amount);

    if (type !== 'event')
      return res.status(400).json({ error: 'Type must be "event"' });

    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ error: 'Amount must be positive integer' });

    // Find event with guests and organizers
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizers: { include: { user: true } },
        guests: { include: { user: true } },
      },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check permission
    const isOrganizer = event.organizers.some((o) => o.user.id === userId);
    if (!isOrganizer && !['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Not authorized for this event' });

    // Verify points remaining
    const totalNeeded = targetUtorid
      ? amount
      : amount * event.guests.length;

    if (event.pointsRemain < totalNeeded)
      return res.status(400).json({ error: 'Not enough points remaining in event' });

    // Identify creator
    const creator = await prisma.user.findUnique({ where: { id: userId } });
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // --- Case 1: Specific user ---
    if (targetUtorid) {
      const guest = event.guests.find((g) => g.user.utorid === targetUtorid);
      if (!guest)
        return res.status(400).json({ error: 'User is not a guest of this event' });

      const updatedGuest = await prisma.user.update({
        where: { id: guest.user.id },
        data: { points: { increment: amount } },
      });

      const tx = await prisma.transaction.create({
        data: {
          userId: guest.user.id,
          createdByUserId: creator.id,
          type: 'event',
          amount,
          relatedId: event.id,
          remark,
        },
      });

      // Deduct from event pool
      await prisma.event.update({
        where: { id: event.id },
        data: {
          pointsRemain: { decrement: amount },
          pointsAwarded: { increment: amount },
        },
      });

      return res.status(201).json({
        id: tx.id,
        recipient: updatedGuest.utorid,
        awarded: tx.amount,
        type: tx.type,
        relatedId: event.id,
        remark: tx.remark,
        createdBy: creator.utorid,
      });
    }

    // --- Case 2: All guests ---
    const guestCount = event.guests.length;
    if (guestCount === 0)
      return res.status(400).json({ error: 'No guests to award points to' });

    const awardedTxs = [];

    await prisma.$transaction(async (tx) => {
      for (const guest of event.guests) {
        await tx.user.update({
          where: { id: guest.user.id },
          data: { points: { increment: amount } },
        });

        const createdTx = await tx.transaction.create({
          data: {
            userId: guest.user.id,
            createdByUserId: creator.id,
            type: 'event',
            amount,
            relatedId: event.id,
            remark,
          },
        });

        awardedTxs.push({
          id: createdTx.id,
          recipient: guest.user.utorid,
          awarded: amount,
          type: 'event',
          relatedId: event.id,
          remark,
          createdBy: creator.utorid,
        });
      }

      await tx.event.update({
        where: { id: event.id },
        data: {
          pointsRemain: { decrement: totalNeeded },
          pointsAwarded: { increment: totalNeeded },
        },
      });
    });

    return res.status(201).json(awardedTxs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// POST /events/:eventId/guests
// Description: Adds a guest to the event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function eventAddGuest(req, res) {
  try {
    const requester = req.auth
    const role = requester?.role;
    const { eventId: base_eventId } = req.params;
    const { utorid } = req.body;

    const eventId = Number(base_eventId);
    if (!eventId) {
      return res.status(404).json({ error: "Event not found. "});
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizers: true, guests: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });

    const isOrganizer = event.organizers.some(org => org.userId === requester.userId);
    if (!['manager', 'superuser'].includes(role) && !isOrganizer) {
      return res.status(403).json({ error: "Manager, superuser, or organizer required." });
    }

    if (!eventId || !utorid) {
      return res.status(400).json({
        error: "Event ID and UTORid are required."});
    }

    // Find guest user
    const guest = await prisma.user.findUnique({ where: { utorid } });
    if (!guest) {
      return res.status(404).json({ error: "User not found." });
    }

    // Prevent organizers from being added as guests
    if (event.organizers.some(org => org.userId === guest.id)) {
      return res.status(400).json({ error: "User is an organizer and cannot be added as a guest." });
    }

    // Event has ended
    const now = req.requestDate;
    if (new Date(event.endTime) < now) {
      return res.status(410).json({ error: "Event has already ended." });
    }

    // Event is full
    if (event.capacity && event.guests.length >= event.capacity) {
      return res.status(410).json({ error: "Event is full." });
    }

    // Check if user is already a guest
    const existingGuest = await prisma.eventGuest.findUnique({
      where: {
        eventId_userId: { eventId: Number(eventId), userId: guest.id, },
      },
    });

    if (existingGuest) {
      return res.status(400).json({ 
        error: "User is already a guest of this event. "});
    }

    // Add guest
    const newGuest = await prisma.eventGuest.create({
      data: { eventId: Number(eventId), userId: guest.id, },
      include: {
        user: {
          select: { id: true, utorid: true, name: true, email: true, },
        },
      },
    });

    const numGuests = await prisma.eventGuest.count({
      where: {eventId: Number(eventId) },
    });

    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: {
        id: newGuest.user.id,
        utorid: newGuest.user.utorid,
        name: newGuest.user.name,
      },
      numGuests,
    });

  } catch (error) {
      console.error("Error adding guest to event:", error);
      return res.status(500).json({
          error: "Internal server error while adding guest."
      });
  }
}

// -------------------------------------------------------------
// DELETE /events/:eventId/guests/:userId
// Description: Removes a guest from the event.
// Clearance: Manager or higher
// -------------------------------------------------------------
async function eventRemoveGuest(req, res) {
  try {
    const requester = req.auth;
    const role = requester?.role;
    const { eventId, userId } = req.params;

    if (!['manager', 'superuser'].includes(role)) {
      return res.status(403).json({ error: "Manager or higher required." });
    }

    const guest = await prisma.eventGuest.findFirst({
      where: { eventId: Number(eventId), userId: Number(userId) },
    });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found in event.' });
    }

    await prisma.eventGuest.delete({
      where: { id: guest.id },
    });

    return res.status(204).end();

  } catch (error) {
      console.error("Error removing guest from event:", error);
      return res.status(500).json({
          error: "Internal server error while removing guest."
      });
  }
}
// -------------------------------------------------------------
// POST /events/:eventId/guests/me
// Description: Adds the logged-in user to the event.
// Clearance: Logged-in users only
// -------------------------------------------------------------
async function eventAddSelf(req, res) {
  try {
    const auth = req.auth;
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: {
        organizers: true, // include all organizers
        guests: true,     // include all guests
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found, deleted since auth."})
    }

    // Prevent organizers from joining as guests
    if (event.organizers.some(org => org.userId === user.id)) {
      return res.status(400).json({ error: "Organizers cannot join as guests." });
    }

    // Event has ended
    const now = req.requestDate;
    if (new Date(event.endTime) < now) {
      return res.status(410).json({ error: "Event has already ended." });
    }

    // Event is full
    if (event.capacity && event.guests.length >= event.capacity) {
      return res.status(410).json({ error: "Event is full." });
    }

    const existingGuest = await prisma.eventGuest.findUnique({
      where: { 
        eventId_userId: { eventId: Number(eventId), userId: user.id },
      }
    });

    if (existingGuest) {
      return res.status(400).json({ error: 'Already joined this event.' });
    }

    const newGuest = await prisma.eventGuest.create({
      data: { eventId: Number(eventId), userId: user.id, },
      include: {
        user: {
          select: { id: true, utorid: true, name: true, email: true, },
        },
      },
    });


    // compute numGuests fresh
    const numGuests = await prisma.eventGuest.count({ where: { eventId: Number(eventId) } });

    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: newGuest.user,
      numGuests,
    });

  } catch (error) {
      console.error("Error adding logged-in user to event:", error);
      return res.status(500).json({
          error: "Internal server error while adding logged-in user to event."
      });
  }
}

// -------------------------------------------------------------
// DELETE /events/:eventId/guests/me
// Description: Removes the logged-in user from the event.
// Clearance: Logged-in users only
// -------------------------------------------------------------
async function eventRemoveSelf(req, res) {
  try {
    const user = req.auth;
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: {
        organizers: true, // include all organizers
        guests: true,     // include all guests
      },
    });
    
    // Event has ended
    const now = req.requestDate;
    if (new Date(event.endTime) < now) {
      return res.status(410).json({ error: "Event has already ended." });
    }

    const guest = await prisma.eventGuest.findFirst({
      where: { eventId: Number(eventId), userId: user.id },
    });

    if (!guest) {
      return res.status(404).json({ error: 'You are not part of this event.' });
    }

    await prisma.eventGuest.delete({
      where: { id: guest.id },
    });

    return res.status(204).json({});

  } catch (error) {
      console.error("Error adding logged-in user from event:", error);
      return res.status(500).json({
          error: 'Internal server error while removing logged-in user from ' +
                  'event.'
      });
  }
}


module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  addOrganizer,
  removeOrganizer,
  deleteEvent,
  awardEventPoints,
  eventAddGuest,
  eventRemoveGuest,
  eventAddSelf,
  eventRemoveSelf,
};
