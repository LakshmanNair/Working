-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthday" TEXT,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promotionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromotionRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "capacity" INTEGER,
    "pointsRemain" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "EventOrganizer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "EventOrganizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventOrganizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventGuest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EventGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventGuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "createdByUserId" INTEGER,
    "processedByUserId" INTEGER,
    "eventId" INTEGER,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "spent" REAL,
    "redeemed" INTEGER,
    "relatedId" INTEGER,
    "suspicious" BOOLEAN DEFAULT false,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionPromotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    CONSTRAINT "TransactionPromotion_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_promotionId_userId_key" ON "PromotionRedemption"("promotionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventOrganizer_eventId_userId_key" ON "EventOrganizer"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventGuest_eventId_userId_key" ON "EventGuest"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionPromotion_transactionId_promotionId_key" ON "TransactionPromotion"("transactionId", "promotionId");
