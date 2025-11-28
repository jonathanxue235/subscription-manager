# Subscription Manager - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- npm
- Supabase account

## Initial Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd subscription-manager
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```bash
cp .env.example .env
```

Edit `backend/.env` and fill in your values:
- `PORT`: Choose a port (default: 5001, avoid 5000 on macOS)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `JWT_SECRET`: A random secret string for JWT tokens

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```bash
cp .env.example .env
```

Edit `frontend/.env` and fill in your values:
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL (same as backend)
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key (same as backend)
- `REACT_APP_BACKEND_URL`: Your backend URL (e.g., `http://localhost:5001`)

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `backend/schema.sql` to create the users table

### 5. Start the Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The frontend will run on http://localhost:3000
The backend will run on http://localhost:5001 (or your configured PORT)

## Important Notes

- **DO NOT commit `.env` files** - they contain sensitive credentials
- Each team member needs their own `.env` files
- If port 5000 is in use (macOS ControlCenter), use 5001 or another port
- Make sure both backend and frontend are running for the app to work

## Architecture

- **Frontend**: React app using custom backend API for authentication
- **Backend**: Express server handling auth, JWT tokens, and database operations
- **Database**: Supabase (PostgreSQL) used as database only, not for auth
- **Authentication**: Custom implementation with bcrypt + JWT (not Supabase Auth)
