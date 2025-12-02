/*
 * Seed script for CSSU Rewards System
 * Populates Users, Events, Promotions, and Transactions.
 * Satisfies the "Pre-populated Database" requirement.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Make sure to npm install bcrypt
const prisma = new PrismaClient();

const BASE_RATE = 1 / 0.25; // 1 point per 25 cents

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. CREATE USERS
  // ============================================
  console.log('👤 Creating users...');
  
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const usersData = [
    { utorid: 'superuser1', name: 'Super User', email: 'su@mail.utoronto.ca', role: 'superuser', verified: true, points: 500 },
    { utorid: 'manager1', name: 'Manager Mike', email: 'manager@mail.utoronto.ca', role: 'manager', verified: true, points: 200 },
    { utorid: 'cashier1', name: 'Cashier Chris', email: 'cashier@mail.utoronto.ca', role: 'cashier', verified: true, points: 100 },
    { utorid: 'student1', name: 'Student One', email: 's1@mail.utoronto.ca', role: 'regular', verified: true, points: 150 },
    { utorid: 'student2', name: 'Student Two', email: 's2@mail.utoronto.ca', role: 'regular', verified: true, points: 50 },
    { utorid: 'student3', name: 'Student Three', email: 's3@mail.utoronto.ca', role: 'regular', verified: true, points: 1200 },
    { utorid: 'student4', name: 'Student Four', email: 's4@mail.utoronto.ca', role: 'regular', verified: false, points: 0 },
    { utorid: 'student5', name: 'Student Five', email: 's5@mail.utoronto.ca', role: 'regular', verified: true, points: 300 },
    { utorid: 'student6', name: 'Student Six', email: 's6@mail.utoronto.ca', role: 'regular', verified: true, points: 450 },
    { utorid: 'student7', name: 'Student Seven', email: 's7@mail.utoronto.ca', role: 'regular', verified: true, points: 25 },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { utorid: u.utorid },
      update: {},
      create: {
        ...u,
        passwordHash,
      },
    });
  }
  
  const users = await prisma.user.findMany();
  const regularUsers = users.filter(u => u.role === 'regular');
  const cashiers = users.filter(u => u.role === 'cashier');
  const managers = users.filter(u => u.role === 'manager' || u.role === 'superuser');
  
  const creator = cashiers[0] || managers[0];
  const manager = managers[0];

  // ============================================
  // 2. CREATE EVENTS
  // ============================================
  console.log('📅 Creating events...');
  
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const eventsData = [
    {
      name: 'CSSU Gaming Night',
      description: 'Join us for a night of games and fun!',
      location: 'BA 2270',
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 50,
      pointsRemain: 1000,
      published: true,
    },
    {
      name: 'Career Workshop',
      description: 'Learn how to write a killer resume.',
      location: 'BA 1130',
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 100,
      pointsRemain: 2000,
      published: true,
    },
    {
      name: 'Coffee Social',
      description: 'Free coffee and chat with professors.',
      location: 'CSSU Lounge',
      startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Past event
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 30,
      pointsRemain: 500,
      published: true,
    },
    {
      name: 'Exam Destressor',
      description: 'Puppies and snacks!',
      location: 'SF Pit',
      startTime: future,
      endTime: new Date(future.getTime() + 4 * 60 * 60 * 1000),
      capacity: 200,
      pointsRemain: 5000,
      published: false,
    },
    {
      name: 'Tech Talk: React',
      description: 'Introduction to React.js development.',
      location: 'Online',
      startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
      capacity: null, // Unlimited
      pointsRemain: 100,
      published: true,
    },
  ];

  for (const e of eventsData) {
    await prisma.event.create({ data: e });
  }

  // ============================================
  // 3. CREATE PROMOTIONS
  // ============================================
  console.log('🎁 Creating promotions...');

  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + 3);
  const pastDate = new Date(now);
  pastDate.setMonth(pastDate.getMonth() - 1);

  const promotions = [
    {
      name: 'Double Points Weekend',
      description: 'Get double points on all purchases this weekend!',
      type: 'automatic',
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      minSpending: null,
      rate: 0.25,
      points: null,
    },
    {
      name: 'Spend $20 Get 50 Bonus Points',
      description: 'Spend at least $20 and get 50 bonus points!',
      type: 'automatic',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endTime: futureDate,
      minSpending: 20.0,
      rate: null,
      points: 50,
    },
    {
      name: 'First Purchase Bonus',
      description: 'Get 100 bonus points on your first purchase!',
      type: 'one_time',
      startTime: pastDate,
      endTime: futureDate,
      minSpending: null,
      rate: null,
      points: 100,
    },
    {
      name: 'Holiday Special',
      description: 'Triple points during the holidays!',
      type: 'automatic',
      startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      minSpending: null,
      rate: 0.5,
      points: null,
    },
    {
      name: 'Summer Sale (Expired)',
      description: 'Summer promotion that has ended',
      type: 'automatic',
      startTime: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      minSpending: 15.0,
      rate: 0.2,
      points: 25,
    },
  ];

  const createdPromotions = [];
  for (const promoData of promotions) {
    const promo = await prisma.promotion.create({ data: promoData });
    createdPromotions.push(promo);
  }

  // ============================================
  // 4. CREATE TRANSACTIONS
  // ============================================
  console.log('💳 Creating transactions...');

  const activePromos = createdPromotions.filter(p => 
    p.startTime <= now && p.endTime > now
  );

  let transactionCount = 0;
  const transactions = [];

  // Helper function to create a purchase transaction
  async function createPurchase(user, spent, promotionIds = [], remark = '') {
    let earned = Math.round(spent * BASE_RATE);
    const appliedPromoIds = [];

    if (promotionIds.length > 0) {
      const promos = await prisma.promotion.findMany({
        where: { id: { in: promotionIds } },
      });

      for (const promo of promos) {
        if (promo.minSpending && spent < promo.minSpending) continue;
        if (promo.startTime > now || promo.endTime <= now) continue;
        appliedPromoIds.push(promo.id);
        if (promo.rate) earned += Math.floor(spent * promo.rate);
        if (promo.points) earned += promo.points;
      }
    }

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        createdByUserId: creator.id,
        type: 'purchase',
        amount: earned,
        spent,
        remark: remark || `Purchase transaction #${transactionCount + 1}`,
        promotions: appliedPromoIds.length > 0 ? {
          create: appliedPromoIds.map(pid => ({ promotionId: pid })),
        } : undefined,
      },
    });

    for (const promoId of appliedPromoIds) {
      const promo = createdPromotions.find(p => p.id === promoId);
      if (promo && promo.type === 'one_time') {
        // Use upsert to avoid duplicate key errors on seed re-runs
        try {
          await prisma.promotionRedemption.create({
            data: { promotionId: promo.id, userId: user.id },
          });
        } catch (e) {}
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: earned } },
    });

    transactions.push(tx);
    transactionCount++;
  }

  // Purchases
  for (let i = 0; i < 15 && i < regularUsers.length; i++) {
    const user = regularUsers[i];
    const spent = 15 + Math.random() * 30;
    const promoIds = Math.random() > 0.5 && activePromos.length > 0
      ? [activePromos[Math.floor(Math.random() * activePromos.length)].id]
      : [];
    await createPurchase(user, spent, promoIds, `Purchase with ${promoIds.length > 0 ? 'promotion' : 'no promotion'}`);
  }

  // Redemptions
  for (let i = 0; i < 6 && i < regularUsers.length; i++) {
    const user = regularUsers[i];
    const amount = -(50 + Math.floor(Math.random() * 200));
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'redemption',
        amount,
        remark: `Redemption request #${i + 1}`,
        // Process half of them
        processedByUserId: i < 3 ? creator.id : null,
        redeemed: i < 3 ? amount : null,
      },
    });
    if (i < 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: amount } },
      });
    }
    transactions.push(tx);
    transactionCount++;
  }

  // Transfers
  for (let i = 0; i < 5 && regularUsers.length >= 2; i++) {
    const sender = regularUsers[i % regularUsers.length];
    const receiver = regularUsers[(i + 1) % regularUsers.length];
    const amount = -(20 + Math.floor(Math.random() * 80));

    const senderTx = await prisma.transaction.create({
      data: {
        userId: sender.id,
        createdByUserId: sender.id,
        type: 'transfer',
        amount,
        relatedId: receiver.id,
        remark: `Transfer to ${receiver.utorid}`,
      },
    });
    const receiverTx = await prisma.transaction.create({
      data: {
        userId: receiver.id,
        createdByUserId: sender.id,
        type: 'transfer',
        amount: -amount,
        relatedId: sender.id,
        remark: `Transfer from ${sender.utorid}`,
      },
    });
    await prisma.user.update({ where: { id: sender.id }, data: { points: { increment: amount } } });
    await prisma.user.update({ where: { id: receiver.id }, data: { points: { increment: -amount } } });
    transactions.push(senderTx, receiverTx);
    transactionCount += 2;
  }

  // Adjustments
  for (let i = 0; i < 4 && regularUsers.length > 0; i++) {
    const user = regularUsers[i % regularUsers.length];
    const amount = 50;
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        createdByUserId: manager.id,
        type: 'adjustment',
        amount,
        remark: `Adjustment credit`,
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { points: { increment: amount } } });
    transactions.push(tx);
    transactionCount++;
  }

  // Suspicious Flags
  if (transactions.length > 5) {
    const suspiciousTx = transactions[Math.floor(Math.random() * transactions.length)];
    await prisma.transaction.update({
      where: { id: suspiciousTx.id },
      data: { suspicious: true },
    });
    console.log(`  ⚠️  Marked transaction ${suspiciousTx.id} as suspicious`);
  }

  console.log(`✅ Seed completed! Created ${usersData.length} users, ${eventsData.length} events, ${promotions.length} promos, ${transactionCount} transactions.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });