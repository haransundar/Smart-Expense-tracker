# Quick Start Guide

## ⚠️ Prerequisites Check

Before starting, ensure you have:

### For Docker Setup:
- [ ] Docker Desktop installed and **RUNNING** (check system tray for Docker icon)
- [ ] Docker Desktop shows "Engine running" status

### For Manual Setup:
- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed  
- [ ] PostgreSQL 14+ installed and running

---

## 🐳 Option 1: Docker Setup (Recommended)

### Step 1: Verify Docker is Running

```powershell
# Check Docker status
docker --version
docker ps

# If you get an error, start Docker Desktop from Start Menu
```

### Step 2: Start All Services

```powershell
docker-compose up -d
```

### Step 3: Check Status

```powershell
# View running containers
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Troubleshooting Docker

**Error: "cannot find file specified" or "pipe/dockerDesktopLinuxEngine"**
- Solution: Start Docker Desktop application and wait for it to fully load

**Error: "port already in use"**
```powershell
# Find what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Error: "database connection failed"**
```powershell
# Restart just the database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

---

## 💻 Option 2: Manual Setup (Without Docker)

### Step 1: Setup PostgreSQL Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE expense_tracker;
\q

# Run schema
psql -U postgres -d expense_tracker -f database/schema.sql
```

### Step 2: Setup Backend

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env file with your database credentials
notepad .env
```

**Edit .env:**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_tracker
SECRET_KEY=change-this-to-a-random-secret-key
```

**Start Backend:**
```powershell
python main.py
```

Backend will run on http://localhost:8000

### Step 3: Setup Frontend (New Terminal)

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

---

## 🧪 Testing the Application

1. **Register Account**: Go to http://localhost:3000/register
2. **Login**: Use your credentials
3. **Add Expense**: Click "Add Expense" and try bank text like:
   - `UPI-ZOMATO-1234-MUM`
   - `UPI-NETFLIX-5678-BLR`
   - `POS SWIGGY BANGALORE`
4. **Scan Subscriptions**: Go to Subscriptions page and click "Scan"
5. **Check Burn Rate**: Enter your balance to see predictions
6. **Create Family Group**: Test shared expense tracking

---

## 🛑 Stopping the Application

### Docker:
```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Manual:
- Press `Ctrl+C` in both terminal windows (backend and frontend)

---

## 📊 Useful Commands

### Docker:
```powershell
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker exec -it expense_tracker_db psql -U postgres -d expense_tracker
```

### Manual:
```powershell
# Backend - Check if running
curl http://localhost:8000/docs

# Database - Connect
psql -U postgres -d expense_tracker

# View tables
\dt

# View data
SELECT * FROM expenses;
```

---

## 🆘 Common Issues

### Issue: "Module not found" in Backend
```powershell
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "Cannot connect to database"
- Check PostgreSQL is running: `pg_ctl status`
- Verify credentials in `.env` file
- Check DATABASE_URL format

### Issue: Frontend shows "Network Error"
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify proxy settings in `vite.config.js`

### Issue: Port 5432 already in use
- Another PostgreSQL instance is running
- Change port in docker-compose.yml or stop other instance

---

## 📝 Next Steps

1. Explore the Smart Translator by adding expenses with bank text
2. Add multiple expenses to test Subscription Detective
3. Enter your balance to see Burn Rate predictions
4. Create a family group and invite members
5. Check API documentation at http://localhost:8000/docs

---

## 🔗 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
