# Post Deployment Guide

## ✅ After Running `docker-compose up -d`

### Step 1: Verify All Services Are Running

```powershell
# Check container status
docker-compose ps

# You should see 3 containers running:
# - expense_tracker_db (postgres)
# - expense_tracker_backend (backend)
# - expense_tracker_frontend (frontend)
```

### Step 2: Check Logs for Any Errors

```powershell
# View all logs
docker-compose logs

# Or check individual services
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Step 3: Wait for Services to Initialize

- **Database**: Takes ~10-15 seconds to initialize
- **Backend**: Takes ~5-10 seconds to start
- **Frontend**: Takes ~30-60 seconds to build and start

### Step 4: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000

### Step 5: Test the Application

1. **Register a New Account**
   - Go to http://localhost:3000/register
   - Fill in: Name, Email, Password
   - Click "Register"

2. **Login**
   - Use your credentials to login
   - You'll be redirected to the Dashboard

3. **Add Your First Expense**
   - Click "Expenses" in navigation
   - Click "Add Expense" button
   - Try adding with bank text: `UPI-ZOMATO-1234-MUM`
   - Amount: 500
   - Click "Add Expense"
   - Notice how it automatically detects "Zomato" as merchant!

4. **Test Smart Translator**
   Add more expenses with different bank texts:
   - `UPI-NETFLIX-5678-BLR` (₹799)
   - `UPI-SWIGGY-9012-DEL` (₹350)
   - `POS AMAZON BANGALORE` (₹1200)
   - `UPI-SPOTIFY-3456-MUM` (₹119)

5. **Test Subscription Detective**
   - Add same merchant multiple times (simulate monthly payments)
   - Go to "Subscriptions" page
   - Click "Scan for Subscriptions"
   - It will detect recurring patterns!

6. **Test Burn Rate Forecaster**
   - Go to "Burn Rate" page
   - Enter your current balance (e.g., 50000)
   - Click "Calculate"
   - See predictions and warnings!

7. **Test Family View**
   - Go to "Family View" page
   - Click "Create Family Group"
   - Name it (e.g., "Smith Family")
   - Add expenses with family_group_id

---

## 🔧 Troubleshooting

### Frontend Not Loading?
```powershell
# Check if Vite dev server started
docker-compose logs frontend

# If you see "VITE ready", it's working
# Sometimes takes 30-60 seconds on first run
```

### Backend API Errors?
```powershell
# Check backend logs
docker-compose logs backend

# Common issue: Database not ready
# Solution: Wait 30 seconds and try again
```

### Database Connection Failed?
```powershell
# Check if database is healthy
docker-compose ps

# Restart database
docker-compose restart postgres

# Wait 15 seconds, then restart backend
docker-compose restart backend
```

### Port Already in Use?
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Kill the process
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

---

## 🛑 Stopping the Application

```powershell
# Stop all services (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v
```

---

## 🔄 Restarting After Code Changes

```powershell
# Rebuild and restart
docker-compose up -d --build

# Or restart specific service
docker-compose restart backend
docker-compose restart frontend
```

---

## 📊 Useful Commands

```powershell
# View real-time logs
docker-compose logs -f

# Access database directly
docker exec -it expense_tracker_db psql -U postgres -d expense_tracker

# Run SQL queries
docker exec -it expense_tracker_db psql -U postgres -d expense_tracker -c "SELECT * FROM expenses;"

# Access backend container
docker exec -it expense_tracker_backend bash

# Access frontend container
docker exec -it expense_tracker_frontend sh
```

---

## 🎯 What to Test

### Smart Translator Feature
- [ ] Add expense with `UPI-ZOMATO-1234-MUM`
- [ ] Verify it shows "Zomato" as merchant
- [ ] Try different patterns (NETFLIX, SWIGGY, AMAZON)

### Subscription Detective Feature
- [ ] Add same merchant 3 times with ~30 day gaps
- [ ] Click "Scan for Subscriptions"
- [ ] Verify it detects the recurring pattern
- [ ] Check "Next Payment Date" prediction

### Burn Rate Forecaster Feature
- [ ] Add multiple expenses
- [ ] Enter current balance
- [ ] Verify daily burn rate calculation
- [ ] Check if warning appears when spending is high

### Family View Feature
- [ ] Create a family group
- [ ] Add expenses to the group
- [ ] Verify group expenses are separate from personal

---

## 📈 Next Steps

1. ✅ Test all features
2. ✅ Add sample data
3. ✅ Take screenshots
4. ✅ Push to GitHub
5. ✅ Update README with screenshots
6. ✅ Deploy to production (optional)

---

## 🐛 Known Issues

1. **First load is slow**: Frontend build takes time on first run
2. **Database init delay**: Wait 15 seconds after `docker-compose up`
3. **Hot reload**: Code changes require `docker-compose restart`

---

## 💡 Tips

- Keep Docker Desktop running while using the app
- Check logs if something doesn't work
- Use `docker-compose down -v` for a fresh start
- Backend API docs at `/docs` are interactive - try them!
