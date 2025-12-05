# Subscription Manager

![dashboard_design](./main-dashboard-design.png)

Subscription Manager is an easy-to-use website for users to keep track of all their subscriptions in one place.

## Features
- Add and remove custom subscriptions
- Search and sort subscriptions
- Reminder notifications for renewing subscriptions
- Visualize historical trends
- Monthly budget tracking
- Multi-currency support
- Modifiable User Profile


# How to test our app (SPECIFICALLY FOR TESTING - THE FULL LOCAL SETUP IS BELOW)

### Prerequisites
- Node.js (v16 or higher)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/jonathanxue235/subscription-manager
cd subscription-manager
```

### 2. Add .env files to frontend and backend
- Add the respective .env files in the correct folder

### 3. Run setup shellscript
``` bash
./setup.sh
```


## How to run locally

### Prerequisites
- Node.js (v16 or higher)
- npm
- Supabase account

### 1. Clone the repository
```bash
git clone https://github.com/jonathanxue235/subscription-manager
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
- `PORT`: Choose a port (default: 5001)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `JWT_SECRET`: A random secret string for JWT tokens (generate a secure random string)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ALLOWED`: Comma-separated list of allowed origins (default: http://localhost:3000)

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
- `REACT_APP_BACKEND_URL`: Your backend URL (e.g., `http://localhost:5001`)

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `backend/schema.sql` to create the users and subscriptions tables

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