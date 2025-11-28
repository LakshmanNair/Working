#!/usr/bin/env node
'use strict';

// Load environment variables
require('dotenv').config();

// Determine port - use PORT env var for production (Railway), or command line arg for local dev
const port = process.env.PORT || (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const cors = require("cors");
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Checks if a JWT_SECRET has been chosen
if (!process.env.JWT_SECRET) {
    console.error('Error: JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

const transactionRoutes = require('./src/routes/transactions');
const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users')
const eventRoutes = require('./src/routes/events');
const promotionRoutes = require('./src/routes/promotions');
const analyticsRoutes = require('./src/routes/analytics');

app.use('/transactions', transactionRoutes);
app.use("/auth", authRoutes)
app.use("/users", usersRoutes)
app.use('/events', eventRoutes);
app.use('/promotions', promotionRoutes);
app.use('/analytics', analyticsRoutes);

// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});
