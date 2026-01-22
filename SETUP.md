# Smart Expense Tracker - Setup Guide

## Quick Start with Docker

The easiest way to run the entire application:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on http://localhost:8000
- Frontend app on http://localhost:3000

## Manual Setup

### 1. Database Setup

Install PostgreSQL and create the database:

```bash
psql -U postgres
CREATE DATABASE expense_tracker;
\q

# Run the schema
psql -U postgres -d expense_tracker -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env with your database credentials

# Run the server
python main.py
```

Backend will be available at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features Overview

### 1. Smart Translator
Automatically converts bank text like "UPI-ZOMATO-1234-MUM" to "Zomato (Food)"

### 2. Subscription Detective
Scans expense history to find recurring payments and predicts next payment dates

### 3. Burn Rate Forecaster
Predicts if you'll run out of money before month end based on spending patterns

### 4. Unified Family View
Allows families to track shared expenses without sharing passwords

## Testing the Features

1. Register a new account
2. Add some expenses with bank text (e.g., "UPI-NETFLIX-1234")
3. Click "Scan for Subscriptions" to detect recurring payments
4. Enter your balance in Burn Rate to see predictions
5. Create a family group to share expenses

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Frontend API Errors
- Ensure backend is running on port 8000
- Check browser console for CORS errors

### Port Already in Use
- Change ports in docker-compose.yml or vite.config.js
