# PowerShell script to push to GitHub

Write-Host "🚀 Smart Expense Tracker - GitHub Push Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Please enter your GitHub repository URL:" -ForegroundColor Yellow
Write-Host "   Example: https://github.com/username/Smart-Expense-Tracker.git" -ForegroundColor Gray
$repoUrl = Read-Host "Repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Repository URL is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 Adding remote origin..." -ForegroundColor Yellow

# Remove existing origin if it exists
git remote remove origin 2>$null

# Add new origin
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote origin added successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add remote origin" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Staging all files..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💬 Enter commit message (or press Enter for default):" -ForegroundColor Yellow
$commitMessage = Read-Host "Commit message"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: Smart Expense Tracker with all features"
}

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit failed or no changes to commit" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌿 Creating main branch..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your repository is now live at:" -ForegroundColor Cyan
    Write-Host "   $repoUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to your GitHub repository" -ForegroundColor White
    Write-Host "   2. Add a description and topics" -ForegroundColor White
    Write-Host "   3. Enable GitHub Pages (optional)" -ForegroundColor White
    Write-Host "   4. Share with the community!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Authentication required - use GitHub CLI or Personal Access Token" -ForegroundColor White
    Write-Host "   2. Repository doesn't exist - create it on GitHub first" -ForegroundColor White
    Write-Host "   3. Permission denied - check your GitHub credentials" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Try:" -ForegroundColor Cyan
    Write-Host "   gh auth login" -ForegroundColor White
    Write-Host "   or" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
}
