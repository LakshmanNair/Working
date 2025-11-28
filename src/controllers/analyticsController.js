'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// -------------------------------------------------------------
// GET /analytics/summary
// Returns aggregated statistics for manager dashboard
// Clearance: Manager or higher
// -------------------------------------------------------------
async function getSummary(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role)) {
      return res.status(403).json({ error: 'Manager or higher required' });
    }

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: { utorid: true, name: true }
        }
      }
    });

    // Calculate totals
    let totalPointsGiven = 0;
    let totalPointsRedeemed = 0;
    let totalPointsTransferred = 0;
    let numPurchases = 0;
    let numRedemptions = 0;
    let numTransfers = 0;
    let numAdjustments = 0;
    let numEventTransactions = 0;

    transactions.forEach(tx => {
      if (tx.type === 'purchase' || tx.type === 'event') {
        totalPointsGiven += tx.amount;
        if (tx.type === 'purchase') numPurchases++;
        if (tx.type === 'event') numEventTransactions++;
      } else if (tx.type === 'redemption') {
        totalPointsRedeemed += Math.abs(tx.amount);
        numRedemptions++;
      } else if (tx.type === 'transfer') {
        totalPointsTransferred += Math.abs(tx.amount);
        numTransfers++;
      } else if (tx.type === 'adjustment') {
        if (tx.amount > 0) {
          totalPointsGiven += tx.amount;
        } else {
          totalPointsRedeemed += Math.abs(tx.amount);
        }
        numAdjustments++;
      }
    });

    // Get total users
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { verified: true } });
    const suspiciousUsers = await prisma.user.count({ where: { suspicious: true } });

    // Get total promotions
    const totalPromotions = await prisma.promotion.count();
    const activePromotions = await prisma.promotion.count({
      where: {
        startTime: { lte: new Date() },
        endTime: { gt: new Date() }
      }
    });

    // Get total events
    const totalEvents = await prisma.event.count();
    const publishedEvents = await prisma.event.count({ where: { published: true } });

    res.json({
      transactions: {
        totalPointsGiven,
        totalPointsRedeemed,
        totalPointsTransferred,
        numPurchases,
        numRedemptions,
        numTransfers,
        numAdjustments,
        numEventTransactions,
        totalTransactions: transactions.length
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        suspicious: suspiciousUsers
      },
      promotions: {
        total: totalPromotions,
        active: activePromotions
      },
      events: {
        total: totalEvents,
        published: publishedEvents
      }
    });
  } catch (error) {
    console.error('Error in getSummary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /analytics/transactions-per-day
// Returns transaction statistics grouped by day
// Query params: days (default: 30)
// Clearance: Manager or higher
// -------------------------------------------------------------
async function getTransactionsPerDay(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role)) {
      return res.status(403).json({ error: 'Manager or higher required' });
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all transactions in the date range
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date
    const dailyStats = {};
    
    transactions.forEach(tx => {
      const dateKey = tx.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          count: 0,
          totalAmount: 0,
          purchases: 0,
          redemptions: 0,
          transfers: 0,
          adjustments: 0,
          eventTransactions: 0
        };
      }

      dailyStats[dateKey].count++;
      dailyStats[dateKey].totalAmount += Math.abs(tx.amount);
      
      if (tx.type === 'purchase') dailyStats[dateKey].purchases++;
      else if (tx.type === 'redemption') dailyStats[dateKey].redemptions++;
      else if (tx.type === 'transfer') dailyStats[dateKey].transfers++;
      else if (tx.type === 'adjustment') dailyStats[dateKey].adjustments++;
      else if (tx.type === 'event') dailyStats[dateKey].eventTransactions++;
    });

    // Convert to array and fill in missing dates
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      result.push(dailyStats[dateKey] || {
        date: dateKey,
        count: 0,
        totalAmount: 0,
        purchases: 0,
        redemptions: 0,
        transfers: 0,
        adjustments: 0,
        eventTransactions: 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in getTransactionsPerDay:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /analytics/promotion-usage
// Returns promotion usage statistics
// Clearance: Manager or higher
// -------------------------------------------------------------
async function getPromotionUsage(req, res) {
  try {
    const role = req.auth?.role;
    if (!['manager', 'superuser'].includes(role)) {
      return res.status(403).json({ error: 'Manager or higher required' });
    }

    const promotions = await prisma.promotion.findMany({
      include: {
        redemptions: true,
        txLinks: {
          include: {
            transaction: {
              include: {
                user: {
                  select: { utorid: true }
                }
              }
            }
          }
        }
      }
    });

    const result = promotions.map(promo => ({
      id: promo.id,
      name: promo.name,
      type: promo.type,
      totalRedemptions: promo.redemptions.length,
      totalUses: promo.txLinks.length,
      uniqueUsers: new Set(promo.txLinks.map(link => link.transaction.userId)).size,
      startTime: promo.startTime,
      endTime: promo.endTime,
      isActive: promo.startTime <= new Date() && promo.endTime > new Date()
    }));

    res.json(result);
  } catch (error) {
    console.error('Error in getPromotionUsage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getSummary,
  getTransactionsPerDay,
  getPromotionUsage
};

