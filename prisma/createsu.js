/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js shkvore2 andriy.shkvorets@mail.utoronto.ca 236Testreturn!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Regex for UofT Email
const emailRegex = /^[a-zA-Z0-9._%+-]+@mail.utoronto.ca$/;
const UTORID_REGEX = /^[A-Za-z0-9]{7,8}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

// Command line arguuments
const [,, utorid, email, password] = process.argv;

async function createSU() {
    // Check if all arguments are used
    if (!utorid || !email || !password) {
        console.error(
            'Usage: node prisma/createsu.js <utorid> <email> <password>'
        );
        process.exit(1);
    }

    //  Check if utorID is valid length
    if (!UTORID_REGEX.test(utorid)) {
        console.error('Invalid utorid: must be 8 characters long.');
        process.exit(1);
    }

    // Check if email is valid format and @mail.utoronto.ca
    if (!emailRegex.test(email)) {
        console.error("Invalid email format: must end with @mail.utoronto.ca.");
        process.exit(1);
    }

    // Check if password fufills requirements.
    if (!PASSWORD_REGEX.test(password)) {
        console.error(
            "Invalid password format: must be 8-20 characters, use at least" +
            " one uppercase, one lowercase, one number, and one special " +
            "character."
        );
        process.exit(1);
    }

    // Prisma interactions to check if user already exists
    const existing = await prisma.user.findFirst({
        where: {OR: [{ utorid }, { email }, ], },
    });
    if (existing) {
        console.error(
            `User with utorid '${utorid}' or email '${email}' already exists.`);
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Creates new user in the prisma database
    const user = await prisma.user.create({
        data: {
            utorid,
            name: 'Superuser',
            email,
            passwordHash,
            role: 'superuser',
            verified: true,
        },
    });

    console.log('Superuser created successfully:');
    console.log({
        id: user.id,
        utorid: user.utorid,
        email: user.email,
        role: user.role,
    });
}

// Saves the effort of including a try/catch inside, runs the main() function.
createSU()
    .catch((error) => {
        console.error('Error creating Superuser:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
