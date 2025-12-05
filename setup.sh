#!/bin/bash

# Subscription Manager - Local Environment Setup Script
# This script sets up the local development environment after cloning

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    printf "${GREEN}✓${NC} %s\n" "$1"
}

print_error() {
    printf "${RED}✗${NC} %s\n" "$1"
}

print_warning() {
    printf "${YELLOW}⚠${NC} %s\n" "$1"
}

print_info() {
    printf "${BLUE}ℹ${NC} %s\n" "$1"
}

print_header() {
    printf "\n"
    printf "${BLUE}================================================${NC}\n"
    printf "${BLUE}%s${NC}\n" "$1"
    printf "${BLUE}================================================${NC}\n"
    printf "\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup
print_header "Subscription Manager - Local Setup"

echo "This script will install dependencies and configure your local environment."
echo ""

# Step 1: Check Prerequisites
print_header "Step 1/4: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"

    # Check if version is >= 16
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. You have v$NODE_MAJOR."
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: v$NPM_VERSION"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Step 2: Install Dependencies
print_header "Step 2/4: Installing Dependencies"

print_info "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

cd ..

print_info "Installing frontend dependencies..."
cd frontend
npm install
print_success "Frontend dependencies installed"

cd ..

# Step 3: Setup Environment Variables
print_header "Step 3/4: Setting Up Environment Variables"

# Track if any .env files were created
ENV_CREATED=false

# Backend .env
if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env file..."

    cat > backend/.env << 'EOF'
PORT=5001
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=your_random_secret_string_here
EOF

    print_success "Created backend/.env"
    print_warning "You need to fill in your Supabase credentials in backend/.env"
    ENV_CREATED=true
else
    print_warning "backend/.env already exists. Skipping..."
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    print_info "Creating frontend/.env file..."

    cat > frontend/.env << 'EOF'
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_BACKEND_URL=http://localhost:5001
EOF

    print_success "Created frontend/.env"
    print_warning "You need to fill in your Supabase credentials in frontend/.env"
    ENV_CREATED=true
else
    print_warning "frontend/.env already exists. Skipping..."
fi

# Step 4: Open .env files for editing (only if new files were created)
if [ "$ENV_CREATED" = true ]; then
    print_header "Step 4/4: Configure Environment Variables"

    echo "You need to add your Supabase credentials to the .env files."
    echo ""
    echo "Required values:"
    echo "  - SUPABASE_URL: Your Supabase project URL"
    echo "  - SUPABASE_ANON_KEY: Your Supabase anon/public key"
    echo "  - JWT_SECRET: A random secret string (e.g., run: openssl rand -base64 32)"
    echo ""

    read -p "Would you like to open the .env files for editing now? (y/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Opening .env files..."

        if command_exists code; then
            # VS Code is installed
            code backend/.env
            code frontend/.env
            print_success "Opened .env files in VS Code"
        elif command_exists nano; then
            # Use nano
            echo ""
            print_info "Opening backend/.env (press Ctrl+X to save and exit)"
            sleep 2
            nano backend/.env

            echo ""
            print_info "Opening frontend/.env (press Ctrl+X to save and exit)"
            sleep 2
            nano frontend/.env
        else
            # Fallback to vi
            echo ""
            print_info "Opening backend/.env (press ESC then :wq to save and exit)"
            sleep 2
            vi backend/.env

            echo ""
            print_info "Opening frontend/.env (press ESC then :wq to save and exit)"
            sleep 2
            vi frontend/.env
        fi

        print_success ".env files updated"
    fi
else
    print_header "Step 4/4: Environment Already Configured"
    print_success "Both .env files already exist. Skipping configuration step."
fi

# Completion
print_header "Setup Complete!"

printf "\n"
printf "Next steps:\n"
printf "\n"
printf "1. ${YELLOW}Make sure your .env files are configured correctly${NC}\n"
printf "   - backend/.env should have your Supabase URL, anon key, and JWT secret\n"
printf "   - frontend/.env should have your Supabase URL and anon key\n"
printf "\n"
printf "2. ${YELLOW}Start the development servers:${NC}\n"
printf "\n"
printf "   Terminal 1 (Backend):\n"
printf "   ${GREEN}cd backend && npm start${NC}\n"
printf "\n"
printf "   Terminal 2 (Frontend):\n"
printf "   ${GREEN}cd frontend && npm start${NC}\n"
printf "\n"
printf "3. ${YELLOW}Access the application:${NC}\n"
printf "   Frontend: http://localhost:3000\n"
printf "   Backend:  http://localhost:5001\n"
printf "\n"

print_success "You can start testing our web app now!"
printf "\n"

# Ask to start servers
read -p "Would you like to start both servers now? (y/n): " -n 1 -r
printf "\n"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    printf "\n"
    print_info "Starting backend server in background..."
    cd backend
    npm start > /dev/null 2>&1 &
    BACKEND_PID=$!
    cd ..
    print_success "Backend server started (PID: $BACKEND_PID)"

    sleep 2

    print_info "Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..

    printf "\n"
    print_success "Both servers are starting!"
    printf "\n"
    printf "Backend:  http://localhost:5001 (PID: $BACKEND_PID)\n"
    printf "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)\n"
    printf "\n"
    printf "${YELLOW}Note: Press Ctrl+C to stop both servers${NC}\n"
    printf "\n"

    # Wait for both processes
    wait
else
    printf "\n"
    print_info "Skipping server startup."
    printf "Run the following commands in separate terminals when ready:\n"
    printf "\n"
    printf "   Terminal 1: ${GREEN}cd backend && npm start${NC}\n"
    printf "   Terminal 2: ${GREEN}cd frontend && npm start${NC}\n"
    printf "\n"
fi