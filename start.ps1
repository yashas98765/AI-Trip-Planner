# AI Trip Planner - Auto Start Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI Trip Planner - Auto Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB service exists and start it
Write-Host "Checking MongoDB service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($mongoService) {
    if ($mongoService.Status -ne 'Running') {
        Write-Host "Starting MongoDB service..." -ForegroundColor Green
        Start-Service -Name MongoDB -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "MongoDB is already running." -ForegroundColor Green
    }
} else {
    Write-Host "MongoDB service not found. Make sure MongoDB is installed." -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Yellow
Write-Host "- Client will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Server will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Browser will open automatically in 10 seconds..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Kill any existing node processes to avoid port conflicts
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Open browser after 10 seconds in background
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 10
    Start-Process "http://localhost:3000"
} | Out-Null

# Start the development servers
npm run dev
