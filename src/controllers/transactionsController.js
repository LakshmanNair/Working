// src/controllers/transactionsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_RATE = 1 / 0.25; // 1 point per 25 cents

// Utility: check promotion validity
async function validatePromotions(req, promotionIds, userId) {
  const now = req.requestDate;
  const promos = await prisma.promotion.findMany({
    where: { id: { in: promotionIds } },
    include: {
      redemptions: userId ? { where: { userId } } : false,
    },
  });

  if (promos.length !== promotionIds.length)
    throw { status: 400, msg: 'Invalid promotion IDs' };

  for (const promo of promos) {
    if (promo.startTime > now || promo.endTime <= now)
      throw { status: 400, msg: 'Promotion not active' };
    
    // Check if one-time promotion has already been used by this user
    if (promo.type === 'one_time' && userId) {
      const hasUsed = await prisma.promotionRedemption.findUnique({
        where: {
          promotionId_userId: {
            promotionId: promo.id,
            userId: userId,
          },
        },
      });
      if (hasUsed)
        throw { status: 400, msg: 'One-time promotion already used' };
    }
  }
  return promos;
}

// -------------------------------------------------------------
// POST /transactions
// Create purchase OR adjustment
// -------------------------------------------------------------
async function createTransaction(req, res) {
  const role = req.auth?.role;
  const userId = req.auth?.userId;
  const data = req.body || {};

  const { utorid, type, spent, amount, relatedId, promotionIds = [], remark = '' } = data;

  try {
    if (!type || (type !== 'purchase' && type !== 'adjustment')) {
      return res.status(400).json({ error: 'Invalid or missing type' });
    }

    // Clearance check
    if (type === 'purchase' && ['cashier', 'manager', 'superuser'].indexOf(role) === -1)
      return res.status(403).json({ error: 'Cashier or higher required' });

    if (type === 'adjustment' && ['manager', 'superuser'].indexOf(role) === -1)
      return res.status(403).json({ error: 'Manager or higher required' });

    // Validate user existence
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const creator = await prisma.user.findUnique({ where: { id: userId } });
    if (!creator) return res.status(401).json({ error: 'Creator not found' });

    // Validate promotions if present
    let validPromos = [];
    if (promotionIds !== null && promotionIds.length) {
      validPromos = await validatePromotions(req, promotionIds, user.id);
    }

    // ---- PURCHASE TRANSACTION ----
    if (type === 'purchase') {
      if (typeof spent !== 'number' || spent <= 0)
        return res.status(400).json({ error: 'Invalid spent amount' });

      // Calculate earned points (base)
      let earned = Math.round(spent * BASE_RATE);

      // Apply promo bonuses and determine which promotions actually apply
      const appliedPromoIds = [];
      for (const promo of validPromos) {
        if (promo.minSpending && spent < promo.minSpending)
          continue; // skip if spending below threshold
        appliedPromoIds.push(promo.id);
        if (promo.rate)
          earned += Math.floor(spent * promo.rate);
        if (promo.points)
          earned += promo.points;
      }

      // Create transaction and record one-time promotion redemptions in a transaction
      const txData = {
        userId: user.id,
        createdByUserId: creator.id,
        type: 'purchase',
        amount: earned,
        spent,
        suspicious: creator.suspicious,
        remark,
      };
      
      if (appliedPromoIds && appliedPromoIds.length > 0) {
        txData.promotions = {
          create: appliedPromoIds.map(pid => ({ promotionId: pid })),
        };
      }
      
      const tx = await prisma.$transaction(async (prismaTx) => {
        // Create the transaction
        const createdTx = await prismaTx.transaction.create({
          data: txData,
        });
        
        // Record one-time promotion redemptions for applied promotions
        for (const promoId of appliedPromoIds) {
          const promo = validPromos.find(p => p.id === promoId);
          if (promo && promo.type === 'one_time') {
            await prismaTx.promotionRedemption.create({
              data: {
                promotionId: promo.id,
                userId: user.id,
              },
            });
          }
        }
        
        return createdTx;
      });

      // If cashier is NOT suspicious, add points immediately
      if (!creator.suspicious) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: earned } },
        });
      }

      // Get the actual promotion IDs from the transaction
      const txWithPromos = await prisma.transaction.findUnique({
        where: { id: tx.id },
        include: { promotions: true },
      });
      
      const finalPromoIds = txWithPromos && txWithPromos.promotions 
        ? txWithPromos.promotions.map(p => p.promotionId).filter(id => id != null)
        : (appliedPromoIds || []);
      
      return res.status(201).json({
        id: tx.id,
        utorid: user.utorid,
        type: 'purchase',
        spent,
        earned: creator.suspicious ? 0 : earned,
        remark,
        promotionIds: finalPromoIds,
        createdBy: creator.utorid,
      });
    }

    // ---- ADJUSTMENT TRANSACTION ----
    if (type === 'adjustment') {
      if (typeof amount !== 'number' || !relatedId)
        return res.status(400).json({ error: 'Missing amount or relatedId' });

      const relatedTx = await prisma.transaction.findUnique({ where: { id: relatedId } });
      if (!relatedTx) return res.status(404).json({ error: 'Related transaction not found' });

      const txData = {
        userId: user.id,
        createdByUserId: creator.id,
        type: 'adjustment',
        amount,
        relatedId,
        remark,
      };
      
      if (promotionIds && promotionIds.length > 0) {
        txData.promotions = {
          create: promotionIds.map(pid => ({ promotionId: pid })),
        };
      }
      
      const tx = await prisma.transaction.create({
        data: txData,
      });

      // Update user's points balance immediately
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: amount } },
      });

      return res.status(201).json({
        id: tx.id,
        utorid: user.utorid,
        amount,
        type: 'adjustment',
        relatedId: tx.relatedId,
        remark,
        promotionIds: promotionIds || [],
        createdBy: creator.utorid,
      });
    }
  } catch (err) {
    console.error(err);
    if (err.status)
      return res.status(err.status).json({ error: err.msg });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /transactions
async function listTransactions(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const {
      name,
      createdBy,
      suspicious,
      promotionId,
      type,
      relatedId,
      amount,
      operator,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {};

    // Join filters
    if (type) filters.type = type;
    if (relatedId) filters.relatedId = parseInt(relatedId);
    if (suspicious !== undefined) filters.suspicious = suspicious === 'true';

    // amount + operator
    if (amount && operator && ['gte', 'lte'].includes(operator)) {
      filters.amount = { [operator]: parseInt(amount) };
    }

    // Join with user and creator
    const where = {
      ...filters,
      ...(name
        ? {
            OR: [
              { user: { utorid: { contains: name } } },
              { user: { name: { contains: name } } },
            ],
          }
        : {}),
      ...(createdBy
        ? { createdBy: { utorid: { contains: createdBy } } }
        : {}),
      ...(promotionId
        ? {
            promotions: {
              some: { promotionId: parseInt(promotionId) },
            },
          }
        : {}),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [count, results] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          user: true,
          createdBy: true,
          promotions: true,
        },
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
    ]);

    const data = results.map((t) => ({
      id: t.id,
      utorid: t.user.utorid,
      amount: t.amount,
      type: t.type,
      spent: t.spent,
      redeemed: t.redeemed,
      promotionIds: t.promotions.map((p) => p.promotionId),
      suspicious: t.suspicious,
      remark: t.remark,
      createdBy: t.createdBy ? t.createdBy.utorid : null,
    }));

    res.json({ count, results: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /transactions/:transactionId
// Clearance: Manager or higher
// -------------------------------------------------------------
async function getTransaction(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const id = parseInt(req.params.transactionId);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        createdBy: true,
        promotions: true,
      },
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    res.json({
      id: tx.id,
      utorid: tx.user.utorid,
      type: tx.type,
      spent: tx.spent,
      amount: tx.amount,
      promotionIds: tx.promotions.map((p) => p.promotionId),
      suspicious: tx.suspicious,
      remark: tx.remark,
      createdBy: tx.createdBy ? tx.createdBy.utorid : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


async function toggleSuspicious(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Manager or higher required' });

    const id = parseInt(req.params.transactionId);
    const { suspicious } = req.body || {};

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid transaction id' });
    if (typeof suspicious !== 'boolean')
      return res.status(400).json({ error: 'Missing or invalid suspicious field' });

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true, createdBy: true, promotions: true },
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    // Only meaningful for purchase or adjustment
    if (!['purchase', 'adjustment'].includes(tx.type))
      return res.status(400).json({ error: 'Suspicious flag not applicable for this transaction type' });

    // If no change, return early
    if (tx.suspicious === suspicious)
      return res.status(200).json({
        id: tx.id,
        utorid: tx.user.utorid,
        type: tx.type,
        spent: tx.spent,
        amount: tx.amount,
        promotionIds: tx.promotions.map(p => p.promotionId),
        suspicious: tx.suspicious,
        remark: tx.remark,
        createdBy: tx.createdBy ? tx.createdBy.utorid : null,
      });

    // Update transaction suspicious flag
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { suspicious },
    });

    // Adjust user balance depending on direction of change
    const delta = suspicious ? -tx.amount : tx.amount;

    await prisma.user.update({
      where: { id: tx.user.id },
      data: { points: { increment: delta } },
    });

    return res.status(200).json({
      id: tx.id,
      utorid: tx.user.utorid,
      type: tx.type,
      spent: tx.spent,
      amount: tx.amount,
      promotionIds: tx.promotions.map(p => p.promotionId),
      suspicious,
      remark: tx.remark,
      createdBy: tx.createdBy ? tx.createdBy.utorid : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function processRedemption(req, res) {
  try {
    const role = req.auth?.role;
    const cashierUtorid = req.auth?.userId;
    if (!['cashier', 'manager', 'superuser'].includes(role))
      return res.status(403).json({ error: 'Cashier or higher required' });

    const id = parseInt(req.params.transactionId);
    const { processed } = req.body || {};

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid transaction id' });
    if (processed !== true)
      return res.status(400).json({ error: 'Processed field must be true' });

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true, createdBy: true, promotions: true },
    });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.type !== 'redemption')
      return res.status(400).json({ error: 'Transaction is not of type redemption' });

    if (tx.processedByUserId)
      return res.status(400).json({ error: 'Transaction already processed' });

    const cashier = await prisma.user.findUnique({ where: { id: cashierUtorid } });
    if (!cashier) return res.status(401).json({ error: 'Cashier not found' });

    // Deduct points from user
    await prisma.user.update({
      where: { id: tx.user.id },
      data: { points: { decrement: tx.amount } },
    });

    // Mark transaction processed
    const updatedTx = await prisma.transaction.update({
      where: { id: tx.id },
      data: { processedByUserId: cashier.id, redeemed: tx.amount },
      include: { user: true, createdBy: true, promotions: true, processedBy: true },
    });

    return res.status(200).json({
      id: updatedTx.id,
      utorid: updatedTx.user.utorid,
      type: updatedTx.type,
      processedBy: updatedTx.processedBy.utorid,
      redeemed: updatedTx.redeemed,
      remark: updatedTx.remark,
      createdBy: updatedTx.createdBy ? updatedTx.createdBy.utorid : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// POST /users/:userId/transactions
// Transfer points from current user (sender) → another user
// Clearance: Regular or higher
// -------------------------------------------------------------
async function transferPoints(req, res) {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { userId } = req.params;
    const { type, amount, remark = '' } = req.body || {};

    // Validation
    if (type !== 'transfer')
      return res.status(400).json({ error: 'Type must be transfer' });
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ error: 'Amount must be positive number' });

    // Get sender (current user)
    const sender = await prisma.user.findUnique({
      where: { id: auth?.userId },
    });
    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    // Check sender verification
    if (!sender.verified)
      return res.status(403).json({ error: 'User must be verified to transfer points' });

    // Get recipient by ID
    const recipient = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    // Check sender balance
    if (sender.points < amount)
      return res.status(400).json({ error: 'Insufficient points' });

    // Create both transactions inside a transaction block
    const result = await prisma.$transaction(async (tx) => {
      // Deduct sender's points
      await tx.user.update({
        where: { id: sender.id },
        data: { points: { decrement: amount } },
      });

      // Add recipient's points
      await tx.user.update({
        where: { id: recipient.id },
        data: { points: { increment: amount } },
      });

      // Sender transaction
      const senderTx = await tx.transaction.create({
        data: {
          userId: sender.id,
          createdByUserId: sender.id,
          type: 'transfer',
          amount: -amount,
          relatedId: recipient.id,
          remark,
        },
      });

      // Recipient transaction
      const recipientTx = await tx.transaction.create({
        data: {
          userId: recipient.id,
          createdByUserId: sender.id,
          type: 'transfer',
          amount: amount,
          relatedId: sender.id,
          remark,
        },
      });

      return { senderTx, recipientTx };
    });

    res.status(201).json({
      id: result.senderTx.id,
      sender: sender.utorid,
      recipient: recipient.utorid,
      type: 'transfer',
      sent: amount,
      remark,
      createdBy: sender.utorid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  toggleSuspicious,
  processRedemption,
  transferPoints,
};
