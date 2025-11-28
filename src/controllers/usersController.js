// src/controllers/userController.js
'use strict';

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require('@prisma/client');

require('dotenv').config(); 

const prisma = new PrismaClient();

const emailRegex = /^[a-zA-Z0-9._%+-]+@mail.utoronto.ca$/;
const utoridRegex = /^[A-Za-z0-9]{7,8}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

// -------------------------------------------------------------
// POST /users
// Register new user (Requires Cashier or higher).
// -------------------------------------------------------------
async function register(req, res) {
    try {
        const requester = req.auth;
        const role = requester?.role;
        const { utorid, name, email } = req.body;

        if (!['cashier', 'manager', 'superuser'].includes(role)) {
            return res.status(403).json({ 
                error: 'Cashier or higher required.'
            });
        }

        if (!utorid || !name || !email) {
            return res.status(400).json({ 
                error: 'UTORid, name, and email are required.'
            });
        } 

        if (!utoridRegex.test(utorid)) {
            return res.status(400).json({ error: 
                'Invalid UTORid: must be 7-8 alphanumeric characters.'
            });
        }

        if (name.length < 1 || name.length > 50) {
            return res.status(400).json({ 
                error: 'Name must be between 1 and 50 characters.'
            });
        }

        if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            error: 'Email must be a valid University of Toronto email.'
        });
        }

        // Check if UTORid or email already exist in system
        const existing = await prisma.user.findFirst({
            where: {OR: [{ utorid }, { email }]},
        });

        if (existing) {
            return res.status(409).json({ 
                error: "User with that UTORid or email already exists."})
        }

        const user = await prisma.user.create({
            data: {
                utorid,
                name,
                email,
                verified: false,
            },
        });

        // Create reset token and set 1hr expiry
        const resetToken = crypto.randomUUID();
        const now = req.requestDate;
        const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        
        // Create new PasswordReset Token
        await prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt,
            },
        });

        // Response with created user info
        return res.status(201).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            verified: user.verified,
            expiresAt: expiresAt,
            resetToken,
        });

    } catch (err) {
        console.error("Error registering user:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to register user.' });
        } 
}};

// -------------------------------------------------------------
// GET /users
// Retrieve a list of users that may be filtered by the payload.
// (Requires Manager or higher)
// -------------------------------------------------------------
async function retrieve_list(req, res) {
    try {
        const requester = req.auth;
        const role = requester?.role;
    
        if (!['manager', 'superuser'].includes(role)) {
            return res.status(403).json({ 
                error: 'Manager or higher required.' });
        }

        const {
            name,
            role: userRole,
            verified,
            activated,
            page = 1,
            limit = 10
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Validate pagination
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ error: "Invalid page or limit." });
        }

        const filters = {};

        if (name) {
            filters.OR = [
                { name: { contains: name } },
                { utorid: { contains: name } }
            ];
        }

        if (userRole) filters.role = userRole;
        if (verified !== undefined) {
            filters.verified = verified === 'true';
        }
        if (activated !== undefined) {
            filters.lastLogin = activated === 'true' ? { not: null } : 
            { equals: null };
        }

        // Pagination
        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;

        // Query the database with the payload.
        // Yes I typed that much, yes its easier than removing the password.
        const [count, results] = await Promise.all([
            prisma.user.count({ where: filters }),
            prisma.user.findMany({
                where: filters,
                skip,
                take,
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    lastLogin: true,
                    verified: true,
                    avatarUrl: true
                }
            })
        ]);

        const totalPages = Math.ceil(count / limitNum);
        if (pageNum > totalPages && totalPages > 0) {
            return res.status(400).json({ error: "Page Number exceeds avaliable pages." });
        }

        // Response
        return res.status(200).json({ count, results });

    } catch (err) {
        console.error("Error retrieving users:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to retrieve users.' });
        } 
}};

// -------------------------------------------------------------
// GET /users/:userId
// Retrieve a specific user.
// If Cashier, returns basic info.
// If Manager or higher, returns in-depth user information.
// -------------------------------------------------------------
async function retrieve(req, res) {
    try {
        const requester = req.auth;
        const role = requester?.role;
        const { userId } = req.params;

        if (!['cashier', 'manager', 'superuser'].includes(role)) {
            return res.status(403).json({ 
                error: 'Cashier or higher required.' });
        }

        // Get the user by ID
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        // Find all one-time promotions not yet redeemped by this user.
        const avaliablePromos = await prisma.promotion.findMany({
            where: {
                type: 'one_time',
                redemptions: {none: { userId: Number(userId) },},
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        // Advanced Info (Manager and above)
        if (['manager', 'superuser'].includes(role)) {
            return res.status(200).json({
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                email: user.email,
                birthday: user.birthday,
                role: user.role,
                points: user.points,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                verified: user.verified,
                avatarUrl: user.avatarUrl,
                promotions: avaliablePromos
            })

        };

        // Basic info (Cashier)
        return res.status(200).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            points: user.points,
            verified: user.verified,
            promotions: avaliablePromos,
        });

    } catch (err) {
        console.error("Error retrieving user:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to retrieve user.' });
        } 
}};

// -------------------------------------------------------------
// PATCH /users/:userId
// Update a specific user's statuses and some properties
// (Requires Manager or higher).
// -------------------------------------------------------------
async function update_user(req, res) {
    try {
        const requester = req.auth;
        const req_role = requester?.role;
        const { userId } = req.params;
        const { email, verified, suspicious, role } = req.body;

        if (!['manager', 'superuser'].includes(req_role)) {
            return res.status(403).json({ 
                error: 'Manager or higher required.' 
            });
        }

        const updateData = {};

        // Manager can only edit cashier or regular, superuser edits everyone.
        if (typeof role === 'string') {
            const isRequesterManager = req_role === 'manager';

            if (!['regular', 'cashier', 'manager', 'superuser'].includes(role)) {
                return res.status(400).json({
                    error: "Invalid Role Name"
                })
            }

            // Manager cannot assign 'manager' or 'superuser' roles
            if (isRequesterManager && !['cashier', 'regular'].includes(role)) {
                return res.status(403).json({
                    error: 'Superuser required to assign this role.'
                });
            }

            // If promoting to cashier, suspicious must be false.
            // Note that cashiers are allowed to be suspicious, but not at
            // promotion, as per the handout.
            if (role === "cashier" && suspicious === true) {
                console.error("Cashiers can't be suspicious:", requester?.userId)
                return res.status(400).json({
                    error: 'Cashiers cannot be suspicious.'
                });
            }

            updateData.role = role;
        }

        // Return error if all of these don't exist.
        if ([email, verified, suspicious, role].every(
            (field) => field === undefined || field === null || field === ''
        )) {
            console.error("No Update Fields:", requester?.userId)
            return res.status(400).json({ error: "No update fields provided."});
        }

        // Fetch user to update / verify. I use number cos I'm untrusting.
        const user = await prisma.user.findUnique({ 
            where: { id: Number(userId) },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (email) {
            if (!emailRegex.test(email)) {
                console.error("Invalid Email bozo:", requester?.userId)
                return res.status(400).json({
                error: "Invalid email format: must end with @mail.utoronto.ca."    
                });
            }

            // Double checks if email is already in use by someone else.
            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id: Number(userId) } }
            });

            if (existing) {
                return res.status(409).json({
                    error: "Email is already in use by another user."
                });
            }

            updateData.email = email;
        }
        if (verified !== undefined && verified !== null) {
            // // Must be a boolean
            // if (typeof verified !== "boolean") {
            //     console.error("Verified not bool:", requester?.userId)
            //     return res.status(400).json({
            //         error: "Verified must be a boolean if entered."
            //     });
            // }

            // Verified must be true if provided
            if (verified === false) {
                console.error("Verified False:", requester?.userId)
                return res.status(400).json({
                    error: "Verified must be True."
                });
            }

            // Safe to set
            updateData.verified = true;
        }

        if (typeof suspicious === "boolean") updateData.suspicious = suspicious;

        // Update only provided fields
        const updatedUser = await prisma.user.update({
            where: { id: Number(userId) },
            data: updateData,
        });

        // Build response dynamically
        const response = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
        };

        if ('email' in updateData) response.email = updatedUser.email;
        if ('verified' in updateData) response.verified = updatedUser.verified;
        if ('suspicious' in updateData) response.suspicious = updatedUser.suspicious;
        if ('role' in updateData) response.role = updatedUser.role;

        response.lastLogin = updatedUser.lastLogin;
        response.points = updatedUser.points;
        response.avatarUrl = updatedUser.avatarUrl;
        response.createdAt = updatedUser.createdAt;

        return res.status(200).json(response);


    } catch (err) {
        console.error("Error updating user:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to update user.' });
        } 
}};

// -------------------------------------------------------------
// PATCH /users/me
// Update the current logged-in user's information.
// -------------------------------------------------------------
async function update_self(req, res) {
    try {
        const user = req.auth;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { name, email, birthday, avatar } = req.body;
        const updateData = {};

        // Return error if all of these don't exist.
        if ([email, name, birthday, avatar].every(
            (field) => field === undefined || field === null || field === ''
        )) {
            return res.status(400).json({ error: "No update fields provided."});
        }

        // Validate and assign name
        if (name) {
            if (name.length < 1 || name.length > 50) {
                return res.status(400).json({ 
                    error: 'Name must be between 1 and 50 characters.'
                });
            }
            updateData.name = name;
        }

        // Validate and assign email
        if (email) {
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: 'Email must be a valid University of Toronto email.'
                });
            }

            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id: user.userId } }
            });

            if (existing) {
                return res.status(409).json({
                    error: "Email is already in use by another user."
                });
            }

            updateData.email = email;
        }

        // Validate and assign birthday
        if (birthday) {
            const date = new Date(birthday);
            if (isNaN(date.getTime()) || birthday !== date.toISOString().slice(0, 10)) {
                return res.status(400).json({ 
                    error: 'Birthday must be a valid date in YYYY-MM-DD format.' 
                });
            }
            updateData.birthday = birthday;
        }

        // Assign avatar URL if uploaded. Literally no clue how this works
        // TODO: Check that it works, idk how though.
        // if (req.file) {
        //     updateData.avatarURL = '/uploads/avatars/${avatar.filename}';
        // }

        // Yes this is stupid, yes this is the best way to exclude the password.
        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                suspicious: true,
                avatarUrl: true,
            }
        });

        return res.status(200).json(updatedUser);

    } catch (err) {
        console.error("Error updating self:", err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to update self.' });
        } 
}};

// -------------------------------------------------------------
// GET /users/me
// Retrieve current logged-in user's information.
// -------------------------------------------------------------
async function retrieve_self(req, res) {
    try {
        const user = req.auth;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const currentUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        if (!currentUser) {
            return res.status(404).json({ error: "User not found."});
        }

        // Find all one-time promotions not yet redeemed by this user
        const availablePromos = await prisma.promotion.findMany({
            where: {
                type: 'one_time',
                redemptions: { none: { userId: user.userId } },
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        const response = {
            ...currentUser,
            promotions: availablePromos
        };

        return res.status(200).json(response);
    } catch (err) {
        console.error("Error retrieving self:", err);
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Failed to retrieve user information.'
            });
        } 
}};

// -------------------------------------------------------------
// PATCH /users/me/password
// Update current logged-in user's password
// -------------------------------------------------------------
async function update_password(req, res) {
    try {
        const user = req.auth;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized"});
        }

        const { old, new: newPassword } = req.body;

        if (!old || !newPassword) {
            return res.status(400).json({
                error: "Both old and new passwords are required.",
            });
        }

        // Validate password strength
        if (!PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                error: "Invalid password format: must be 8-20 characters, use" +
                " at least one uppercase, one lowercase, one number, and one " +
                "special character."
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: user.userId },
        });

        if (!existingUser) {
            return res.status(404).json({ error: "User not found." });
        }

        const passwordMatch = await bcrypt.compare(old, 
            existingUser.passwordHash);
        if (!passwordMatch) {
            return res.status(403).json({
                error: "Incorrect current password."
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.userId },
            data: { passwordHash: hashedNewPassword },
        });

        return res.status(200).json({
            message: "Password updated succesfully."
        });
    } catch (err) {
        console.error("Error updating password:", err);
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Failed to update password.'
            });
        } 
}};

// -------------------------------------------------------------
// POST /users/me/transactions
// Clearance: Regular or higher
// -------------------------------------------------------------
async function createRedemption(req, res) {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: auth?.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.verified)
      return res.status(403).json({ error: 'User must be verified to redeem points' });

    const { type, amount, remark = '' } = req.body || {};

    if (type !== 'redemption')
      return res.status(400).json({ error: 'Type must be redemption' });

    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ error: 'Invalid amount' });

    if (user.points < amount)
      return res.status(400).json({ error: 'Insufficient point balance' });

    // Create redemption transaction
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        createdByUserId: user.id, // self-created
        type: 'redemption',
        amount,
        remark,
      },
      include: { user: true },
    });

    res.status(201).json({
      id: tx.id,
      utorid: user.utorid,
      type: tx.type,
      processedBy: null,
      amount: tx.amount,
      remark: tx.remark,
      createdBy: user.utorid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// -------------------------------------------------------------
// GET /users/me/transactions
// Clearance: Regular or higher
// -------------------------------------------------------------
async function listMyTransactions(req, res) {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { type, relatedId, promotionId, amount, operator, page = 1, limit = 10 } = req.query;

    const where = {
      user: { id: auth?.userId },
    };

    if (type) where.type = type;
    if (relatedId) where.relatedId = parseInt(relatedId);
    if (promotionId)
      where.promotions = { some: { promotionId: parseInt(promotionId) } };
    if (amount && operator && ['gte', 'lte'].includes(operator))
      where.amount = { [operator]: parseInt(amount) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [count, results] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
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
      type: t.type,
      spent: t.spent,
      amount: t.amount,
      relatedId: t.relatedId,
      promotionIds: t.promotions.map((p) => p.promotionId),
      remark: t.remark,
      createdBy: t.createdBy ? t.createdBy.utorid : null,
    }));

    res.json({ count, results: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {
    register,
    retrieve_list,
    retrieve,
    update_user,
    update_self,
    retrieve_self,
    update_password,
    createRedemption,
    listMyTransactions,
};