# 🚀 Quick Reference Card

## After Docker Compose

### 1️⃣ Verify Services Running
```powershell
docker-compose ps
```

### 2️⃣ Check Logs
```powershell
docker-compose logs -f
```

### 3️⃣ Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs
- Database: localhost:5432

### 4️⃣ Test Features
1. Register at `/register`
2. Add expense with bank text
3. Scan for subscriptions
4. Check burn rate

---

## Push to GitHub

### Quick Method
```powershell
.\push-to-github.ps1
```

### Manual Method
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

---

## Useful Commands

### Docker
```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f backend

# Fresh start
docker-compose down -v
docker-compose up -d
```

### Git
```powershell
# Status
git status

# Add files
git add .

# Commit
git commit -m "message"

# Push
git push

# Pull
git pull
```

### Database
```powershell
# Access database
docker exec -it expense_tracker_db psql -U postgres -d expense_tracker

# View tables
\dt

# View expenses
SELECT * FROM expenses;

# Exit
\q
```

---

## Troubleshooting

### Docker Not Running
```powershell
# Start Docker Desktop from Start Menu
# Wait for green icon in system tray
```

### Port Already in Use
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed
```powershell
# Restart database
docker-compose restart postgres

# Wait 15 seconds
docker-compose restart backend
```

---

## File Structure

```
Smart-Expense-Tracker/
├── backend/              # Python FastAPI
├── frontend/             # React.js
├── database/             # PostgreSQL
├── docker-compose.yml    # Docker config
├── README.md            # Main documentation
├── QUICKSTART.md        # Setup guide
└── GITHUB_SETUP.md      # Push guide
```

---

## Next Steps

1. ✅ Test all features
2. ✅ Push to GitHub
3. ✅ Add screenshots
4. ✅ Share project
5. ✅ Deploy (optional)

---

## Support

- 📖 [QUICKSTART.md](QUICKSTART.md) - Setup
- 📖 [POST_DEPLOYMENT.md](POST_DEPLOYMENT.md) - Testing
- 📖 [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub
- 📖 [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Checklist
