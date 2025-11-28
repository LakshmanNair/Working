'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// -------------------------------------------------------------
// POST /promotions
// Clearance: Manager or higher
// -------------------------------------------------------------
async function createPromotion(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role)) {
      return res.status(403).json({ error: 'Manager or higher required' });
    }

    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body;

    if (!name || !description || !type || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['automatic', 'one_time'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const now = req.requestDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (start <= now) {
      return res.status(400).json({ error: 'Start time cannot be in the past' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const validatedMinSpending =
      minSpending !== undefined && minSpending !== null
        ? Number(minSpending)
        : null;
    const validatedRate =
      rate !== undefined && rate !== null ? Number(rate) : null;
    const validatedPoints =
      points !== undefined && points !== null ? Number(points) : null;

    if (validatedMinSpending !== null) {
      if (isNaN(validatedMinSpending) || validatedMinSpending <= 0) {
        return res.status(400).json({ error: 'minSpending must be positive' });
      }
    }
    if (validatedRate !== null) {
      if (isNaN(validatedRate) || validatedRate <= 0) {
        return res.status(400).json({ error: 'rate must be positive' });
      }
    }
    if (validatedPoints !== null) {
      if (isNaN(validatedPoints) || !Number.isInteger(validatedPoints) || validatedPoints < 0) {
        return res.status(400).json({ error: 'points must be a non-negative integer' });
      }
    }

    const promo = await prisma.promotion.create({
      data: {
        name,
        description,
        type,
        startTime: start,
        endTime: end,
        minSpending: validatedMinSpending,
        rate: validatedRate,
        points: validatedPoints,
      },
    });

    res.status(201).json({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      type: promo.type,
      startTime: promo.startTime,
      endTime: promo.endTime,
      minSpending: promo.minSpending,
      rate: promo.rate,
      points: promo.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /promotions
// Clearance: Regular or higher
// -------------------------------------------------------------
async function listPromotions(req, res) {
  try {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      type,
      started,
      ended,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validate pagination
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ error: "Invalid page or limit." });
    }

    if (['manager', 'superuser'].includes(role) && started && ended)
      return res.status(400).json({
        error: "Cannot specify both started and ended filters together",
      });

    const now = req.requestDate;
    const where = {};

    if (name)
      where.name = { contains: name, mode: 'insensitive' };
    if (type)
      where.type = type;

    // Role-based filtering
    if (['manager', 'superuser'].includes(role)) {
      // Privileged users can filter by started/ended, but if not specified, see all
      if (started !== undefined)
        where.startTime = started === 'true' ? { lte: now } : { gt: now };
      if (ended !== undefined)
        where.endTime = ended === 'true' ? { lte: now } : { gt: now };
    } else {
      // Regular users: only active promotions
      where.startTime = { lte: now };
      where.endTime = { gt: now };
    }

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const selectFields = {
      id: true,
      name: true,
      type: true,
      endTime: true,
      minSpending: true,
      rate: true,
      points: true,
    };
    
    if (['manager', 'superuser'].includes(role)) {
      selectFields.startTime = true;
    }

    const [count, results] = await Promise.all([
      prisma.promotion.count({ where }),
      prisma.promotion.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        select: selectFields,
      }),
    ]);

    const totalPages = Math.ceil(count / limitNum);
    if (pageNum > totalPages && totalPages > 0) {
        return res.status(400).json({ error: "Page Number exceeds avaliable pages." });
    }

    res.status(200).json({ count, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /promotions/:promotionId
// Clearance: Regular or higher
// -------------------------------------------------------------
async function getPromotion(req, res) {
  try {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) return res.status(404).json({ error: 'Promotion not found' });

    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) return res.status(404).json({ error: 'Promotion not found' });

    const now = req.requestDate;
    const isActive = promo.startTime <= now && promo.endTime > now;
    
    // Regular users can only see active promotions
    if (role === 'regular' && !isActive) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const response = {
      id: promo.id,
      name: promo.name,
      description: promo.description,
      type: promo.type,
      endTime: promo.endTime,
      minSpending: promo.minSpending,
      rate: promo.rate,
      points: promo.points,
    };
    
    // Privileged users get startTime
    if (['manager', 'superuser'].includes(role)) {
      response.startTime = promo.startTime;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// PATCH /promotions/:promotionId
// Clearance: Manager or higher
// -------------------------------------------------------------
async function updatePromotion(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid promotion ID' });

    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) return res.status(404).json({ error: 'Promotion not found' });

    const now = req.requestDate;
    const started = promo.startTime <= now;
    const ended = promo.endTime <= now;

    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
    } = req.body || {};

    const updates = {};

    // Validation logic
    if (startTime || endTime) {
      const newStart = startTime ? new Date(startTime) : promo.startTime;
      const newEnd = endTime ? new Date(endTime) : promo.endTime;

      if (isNaN(newStart) || isNaN(newEnd))
        return res.status(400).json({ error: 'Invalid date format' });
      if (newStart < now)
        return res.status(400).json({ error: 'Start time cannot be in the past'});
      if (newEnd <= newStart)
        return res.status(400).json({ 
      error: 'End time must be after start time' 
    });
      if (started && (startTime !== undefined || name !== undefined || description !== undefined || type !== undefined || minSpending !== undefined || rate !== undefined || points !== undefined))
        return res.status(400).json({ error: 'Cannot modify these fields after promotion has started' });
      if (ended && endTime)
        return res.status(400).json({ 
      error: 'Cannot modify endTime after promotion has ended' 
      });

      if (startTime) updates.startTime = newStart;
      if (endTime) updates.endTime = newEnd;
    }

    if (name) updates.name = name;
    if (description) updates.description = description;
    if (type) {
      if (!['automatic', 'one_time'].includes(type))
        return res.status(400).json({ error: 'Invalid type' });
      updates.type = type;
    }
    if (minSpending !== undefined) {
      if (minSpending === null) {
        updates.minSpending = null;
      } else {
        const val = Number(minSpending);
        if (isNaN(val) || val <= 0) return res.status(400).json({ error: 'minSpending must be positive value' });
        updates.minSpending = val;
      }
    }
    if (rate !== undefined) {
      if (rate === null) {
        updates.rate = null;
      } else {
        const val = Number(rate);
        if (isNaN(val) || val <= 0) return res.status(400).json({ error: 'rate must be positive' });
        updates.rate = val;
      }
    }
    if (points !== undefined) {
      if (points === null) {
        updates.points = null;
      } else {
        const val = Number(points);
        if (!Number.isInteger(val) || val < 0)
          return res.status(400).json({ error: 'Points must be a non-negative integer' });
        updates.points = val;
      }
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: "No valid fields to be updated" });

    const updated = await prisma.promotion.update({
      where: { id },
      data: updates,
    });

    const response = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
    };

    for (const key of Object.keys(updates)) {
      if (!['id', 'name', 'type'].includes(key)) {
        response[key] = updated[key];
      }
    }

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// DELETE /promotions/:promotionId
// Clearance: Manager or higher
// -------------------------------------------------------------
async function deletePromotion(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) return res.status(404).json({ error: 'Promotion not found' });

    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) return res.status(404).json({ error: 'Promotion not found' });

    const now = req.requestDate;
    if (promo.startTime <= now)
      return res.status(403).json({ error: 'Cannot remove promotion that has already started' });

    await prisma.promotion.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'irnteral server error' });
  }
}

module.exports = {
  createPromotion,
  listPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
};