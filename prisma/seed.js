/*
 * Seed script for CSSU Rewards System
 * This script populates the database with:
 * - Promotions (5+ promotions)
 * - Transactions (30+ transactions of various types)
 * 
 * Note: Users and Events should be seeded separately by your partner
 * This script assumes at least 10 users exist in the database
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_RATE = 1 / 0.25; // 1 point per 25 cents

async function main() {
  console.log('🌱 Starting seed...');

  // Get existing users (assumes partner has seeded users)
  const users = await prisma.user.findMany();
  if (users.length < 10) {
    console.warn('⚠️  Warning: Less than 10 users found. Some transactions may fail.');
  }

  if (users.length === 0) {
    console.error('❌ No users found. Please seed users first.');
    return;
  }

  // Find users by role for transactions
  const cashiers = users.filter(u => u.role === 'cashier');
  const managers = users.filter(u => u.role === 'manager' || u.role === 'superuser');
  const regularUsers = users.filter(u => u.role === 'regular');

  if (cashiers.length === 0) {
    console.warn('⚠️  No cashiers found. Using managers for cashier transactions.');
  }
  if (managers.length === 0) {
    console.warn('⚠️  No managers found. Some transactions may fail.');
  }
  if (regularUsers.length === 0) {
    console.warn('⚠️  No regular users found. Some transactions may fail.');
  }

  const creator = cashiers[0] || managers[0] || users[0];
  const manager = managers[0] || users[0];

  console.log(`📊 Found ${users.length} users, ${regularUsers.length} regular, ${cashiers.length} cashiers, ${managers.length} managers`);

  // ============================================
  // CREATE PROMOTIONS
  // ============================================
  console.log('🎁 Creating promotions...');

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + 3);

  const pastDate = new Date(now);
  pastDate.setMonth(pastDate.getMonth() - 1);

  const promotions = [
    // Active automatic promotion - double points
    {
      name: 'Double Points Weekend',
      description: 'Get double points on all purchases this weekend!',
      type: 'automatic',
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      minSpending: null,
      rate: 0.25, // Additional 25% rate bonus
      points: null,
    },
    // Active automatic promotion - minimum spending
    {
      name: 'Spend $20 Get 50 Bonus Points',
      description: 'Spend at least $20 and get 50 bonus points!',
      type: 'automatic',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endTime: futureDate,
      minSpending: 20.0,
      rate: null,
      points: 50,
    },
    // Active one-time promotion
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
    // Future promotion
    {
      name: 'Holiday Special',
      description: 'Triple points during the holidays!',
      type: 'automatic',
      startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      minSpending: null,
      rate: 0.5, // 50% bonus
      points: null,
    },
    // Expired promotion (for testing)
    {
      name: 'Summer Sale (Expired)',
      description: 'Summer promotion that has ended',
      type: 'automatic',
      startTime: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      endTime: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      minSpending: 15.0,
      rate: 0.2,
      points: 25,
    },
    // Another active automatic
    {
      name: 'Student Discount Bonus',
      description: 'Students get extra points on purchases over $10',
      type: 'automatic',
      startTime: pastDate,
      endTime: futureDate,
      minSpending: 10.0,
      rate: 0.15,
      points: 20,
    },
  ];

  const createdPromotions = [];
  for (const promoData of promotions) {
    const promo = await prisma.promotion.create({
      data: promoData,
    });
    createdPromotions.push(promo);
    console.log(`  ✓ Created promotion: ${promo.name} (ID: ${promo.id})`);
  }

  console.log(`✅ Created ${createdPromotions.length} promotions`);

  // ============================================
  // CREATE TRANSACTIONS
  // ============================================
  console.log('💳 Creating transactions...');

  const transactions = [];
  let transactionCount = 0;

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

    // Record one-time promotion redemptions
    for (const promoId of appliedPromoIds) {
      const promo = createdPromotions.find(p => p.id === promoId);
      if (promo && promo.type === 'one_time') {
        await prisma.promotionRedemption.create({
          data: {
            promotionId: promo.id,
            userId: user.id,
          },
        });
      }
    }

    // Update user points (assuming creator is not suspicious)
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: earned } },
    });

    transactions.push(tx);
    transactionCount++;
    return tx;
  }

  // Create various purchase transactions
  const activePromos = createdPromotions.filter(p => 
    p.startTime <= now && p.endTime > now
  );

  // Purchase transactions with promotions
  for (let i = 0; i < 8 && i < regularUsers.length; i++) {
    const user = regularUsers[i];
    const spent = 15 + Math.random() * 30; // $15-$45
    const promoIds = Math.random() > 0.5 && activePromos.length > 0
      ? [activePromos[Math.floor(Math.random() * activePromos.length)].id]
      : [];
    
    await createPurchase(user, spent, promoIds, `Purchase with ${promoIds.length > 0 ? 'promotion' : 'no promotion'}`);
  }

  // More purchase transactions without promotions
  for (let i = 0; i < 5 && i < regularUsers.length; i++) {
    const user = regularUsers[i % regularUsers.length];
    const spent = 5 + Math.random() * 20; // $5-$25
    await createPurchase(user, spent, [], 'Regular purchase');
  }

  // Create redemption requests (some processed, some pending)
  console.log('  Creating redemption requests...');
  for (let i = 0; i < 6 && i < regularUsers.length; i++) {
    const user = regularUsers[i];
    const amount = -(50 + Math.floor(Math.random() * 200)); // -50 to -250 points

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'redemption',
        amount,
        remark: `Redemption request #${i + 1}`,
      },
    });

    // Process some redemptions
    if (i < 3 && creator) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          processedByUserId: creator.id,
        },
      });
      // Deduct points
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: amount } }, // amount is negative
      });
    }

    transactions.push(tx);
    transactionCount++;
  }

  // Create transfer transactions
  console.log('  Creating transfer transactions...');
  for (let i = 0; i < 5 && regularUsers.length >= 2; i++) {
    const sender = regularUsers[i % regularUsers.length];
    const receiver = regularUsers[(i + 1) % regularUsers.length];
    const amount = -(20 + Math.floor(Math.random() * 80)); // -20 to -100 points

    // Create sender transaction (negative)
    const senderTx = await prisma.transaction.create({
      data: {
        userId: sender.id,
        type: 'transfer',
        amount,
        remark: `Transfer to ${receiver.utorid}`,
      },
    });

    // Create receiver transaction (positive)
    const receiverTx = await prisma.transaction.create({
      data: {
        userId: receiver.id,
        type: 'transfer',
        amount: -amount, // positive for receiver
        remark: `Transfer from ${sender.utorid}`,
      },
    });

    // Update balances
    await prisma.user.update({
      where: { id: sender.id },
      data: { points: { increment: amount } },
    });
    await prisma.user.update({
      where: { id: receiver.id },
      data: { points: { increment: -amount } },
    });

    transactions.push(senderTx, receiverTx);
    transactionCount += 2;
  }

  // Create adjustment transactions
  console.log('  Creating adjustment transactions...');
  for (let i = 0; i < 4 && regularUsers.length > 0; i++) {
    const user = regularUsers[i % regularUsers.length];
    const relatedTx = transactions.find(t => t.userId === user.id);
    const amount = relatedTx ? (Math.random() > 0.5 ? 50 : -30) : 50;

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        createdByUserId: manager.id,
        type: 'adjustment',
        amount,
        relatedId: relatedTx?.id,
        remark: `Adjustment ${amount > 0 ? 'credit' : 'debit'}`,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: amount } },
    });

    transactions.push(tx);
    transactionCount++;
  }

  // Mark some transactions as suspicious (for testing)
  if (transactions.length > 5) {
    const suspiciousTx = transactions[Math.floor(Math.random() * transactions.length)];
    await prisma.transaction.update({
      where: { id: suspiciousTx.id },
      data: { suspicious: true },
    });
    console.log(`  ⚠️  Marked transaction ${suspiciousTx.id} as suspicious`);
  }

  console.log(`✅ Created ${transactionCount} transactions`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
