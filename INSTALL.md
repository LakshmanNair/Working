# True Blue Rewards System - Installation Guide

This document provides step-by-step instructions for setting up and running the True Blue Rewards System locally and deploying it to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Running the Application](#running-the-application)
5. [Deployment](#deployment)
6. [Demo Credentials](#demo-credentials)
7. [AI Usage Disclosure](#ai-usage-disclosure)

---

## Prerequisites

### Required Software

- **Node.js**: Version 20.17.0 or higher (recommended: 20.19.0+)
- **npm**: Version 10.8.2 or higher (comes with Node.js)
- **Git**: For cloning the repository

### Verify Installation

```bash
node --version  # Should show v20.17.0 or higher
npm --version   # Should show 10.8.2 or higher
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd CSC309-Project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# .env
JWT_SECRET=f62cff957e5ac3dfea9b270e7314bbae
DATABASE_URL=file:./prisma/dev.db
FRONTEND_ORIGIN=http://localhost:5173
PORT=3001
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Create a superuser (optional, for initial setup)
# npm run createsuperuser
node prisma/createsu.js nairlak1 ln@mail.utoronto.ca Test1234#
```

### 5. Seed the Database

```bash
npm run seed
```

This will populate the database with:
- 5+ promotions
- 30+ transactions (purchases, redemptions, transfers, adjustments)
- Links to existing users (assumes users are already seeded by your partner)

**Note**: The seed script assumes at least 10 users exist. If you get warnings, ensure your partner has seeded users first.

### 6. Run Backend Server

For local development:

```bash
node index.js 3001
```

The server will start on `http://localhost:3001`.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Run Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is occupied).

---

## Running the Application

### Start Backend

In the root directory (`CSC309-Project`):

```bash
node index.js 3001
```

### Start Frontend

In a new terminal, navigate to `frontend`:

```bash
cd frontend
npm run dev
```

### Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## Deployment

### Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up or log in

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or use Railway CLI)

3. **Configure Environment Variables**
   In Railway dashboard, add these environment variables:
   ```
   JWT_SECRET=your-production-secret-key
   DATABASE_URL=file:./prisma/dev.db
   FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
   PORT=3001
   ```

4. **Deploy**
   - Railway will automatically detect your `package.json`
   - Ensure your `package.json` has a `start` script: `"start": "node index.js"`
   - Railway will assign a public URL (e.g., `https://your-app.railway.app`)

5. **Update Frontend Environment**
   - Update `frontend/.env` with your Railway backend URL:
     ```
     VITE_API_BASE_URL=https://your-app.railway.app
     ```

### Frontend Deployment (Vercel)

1. **Install Vercel CLI** (optional, or use web interface)
   ```bash
   npm install -g vercel
   ```

2. **Deploy from Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Add environment variable:
     ```
     VITE_API_BASE_URL=https://your-railway-backend.railway.app
     ```
   - Click "Deploy"

3. **Update Backend CORS**
   - In Railway, update `FRONTEND_ORIGIN` to your Vercel URL:
     ```
     FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
     ```

### Production Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Database seeded with production data
- [ ] `WEBSITE.txt` file contains only the frontend URL

---

## Demo Credentials

### Regular User
- UTORid: `student1`
- Password: Password123!
- Role: `regular`

### Cashier
- UTORid: `cashier1`
- Password: Password123!
- Role: `cashier`

### Manager
- UTORid: `manager1`
- Password: Password123!
- Role: `manager`

### Superuser
- UTORid: `superus2`
- Password: Password123!
- Role: `superuser`

**To create users**, use the backend API endpoint:
```bash
POST /users
Authorization: Bearer <cashier-or-higher-token>
{
  "utorid": "student1",
  "name": "Student One",
  "email": "student1@mail.utoronto.ca",
  "password": "password123",
  "role": "regular"
}
```

---

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 3001
lsof -i :3001
# Kill the process or use a different port
```

**Database locked:**
```bash
# Reset database (WARNING: deletes all data)
npm run clean
npx prisma migrate dev
npm run seed
```

**CORS errors:**
- Ensure `FRONTEND_ORIGIN` in backend `.env` matches your frontend URL
- Check that CORS middleware is properly configured in `index.js`

### Frontend Issues

**API connection errors:**
- Verify `VITE_API_BASE_URL` in `frontend/.env`
- Check that backend is running
- Verify CORS settings on backend

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## AI Usage Disclosure

This project was developed with assistance from AI tools (ChatGPT/Claude) for:

- **Code generation**: Initial scaffolding of React components, API routes, and database schemas
- **Debugging**: Identifying and fixing syntax errors, type mismatches, and logical issues
- **Documentation**: Generating installation instructions and code comments
- **Architecture decisions**: Consulting on project structure and best practices
