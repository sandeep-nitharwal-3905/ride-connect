# Real-time Pending Rides Test Script (PowerShell)
# This script tests the complete real-time flow for pending rides updates

Write-Host "🚀 Starting Real-time Pending Rides Test..." -ForegroundColor Green

# Function to check if a process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    $process = Get-Process | Where-Object { $_.ProcessName -like "*$ProcessName*" -or $_.CommandLine -like "*$ProcessName*" }
    if ($process) {
        Write-Host "✅ $ProcessName is running" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $ProcessName is not running" -ForegroundColor Red
        return $false
    }
}

# Function to start socket server
function Start-SocketServer {
    Write-Host "📡 Starting Socket Server..." -ForegroundColor Yellow
    $socketProcess = Get-Process | Where-Object { $_.CommandLine -like "*socket-server.js*" }
    if (-not $socketProcess) {
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PSScriptRoot
            node server/socket-server.js
        }
        Write-Host "  Socket server started with Job ID: $($job.Id)" -ForegroundColor Gray
        Start-Sleep 3
        return $job
    }
    return $null
}

# Function to start Next.js dev server
function Start-NextJS {
    Write-Host "🌐 Starting Next.js Dev Server..." -ForegroundColor Yellow
    $nextProcess = Get-Process | Where-Object { $_.CommandLine -like "*next dev*" }
    if (-not $nextProcess) {
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PSScriptRoot
            npm run dev
        }
        Write-Host "  Next.js server started with Job ID: $($job.Id)" -ForegroundColor Gray
        Start-Sleep 5
        return $job
    }
    return $null
}

# Function to open browser windows
function Open-Dashboards {
    Write-Host "🌐 Opening Dashboard Windows..." -ForegroundColor Yellow
    
    # Company Dashboard
    Write-Host "  Opening Company Dashboard: http://localhost:3000/dashboard/company" -ForegroundColor Gray
    Start-Process "http://localhost:3000/dashboard/company"
    
    Start-Sleep 2
    
    # Vendor Dashboard
    Write-Host "  Opening Vendor Dashboard: http://localhost:3000/dashboard/vendor" -ForegroundColor Gray
    Start-Process "http://localhost:3000/dashboard/vendor"
}

# Function to display test instructions
function Show-TestInstructions {
    Write-Host ""
    Write-Host "🧪 REAL-TIME TEST INSTRUCTIONS:" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 📋 COMPANY DASHBOARD:" -ForegroundColor White
    Write-Host "   - Login as a company user" -ForegroundColor Gray
    Write-Host "   - Click 'Create New Booking' button" -ForegroundColor Gray
    Write-Host "   - Fill in ride details and submit" -ForegroundColor Gray
    Write-Host "   - ✅ Verify: New ride appears in 'Pending Rides' section" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. 🚐 VENDOR DASHBOARD:" -ForegroundColor White
    Write-Host "   - Login as a vendor user" -ForegroundColor Gray
    Write-Host "   - ✅ Verify: New booking request appears" -ForegroundColor Green
    Write-Host "   - Click 'Accept' on the booking request" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. 📊 REAL-TIME UPDATE VERIFICATION:" -ForegroundColor White
    Write-Host "   - ✅ Check Company Dashboard IMMEDIATELY:" -ForegroundColor Green
    Write-Host "     • Ride status changes from 'pending' to 'accepted'" -ForegroundColor Gray
    Write-Host "     • Ride moves from 'Pending Rides' to 'Ongoing Rides'" -ForegroundColor Gray
    Write-Host "     • Vendor information appears on the ride" -ForegroundColor Gray
    Write-Host "     • NO PAGE REFRESH NEEDED - should update instantly!" -ForegroundColor Red
    Write-Host ""
    Write-Host "4. 🔄 ADDITIONAL TESTS:" -ForegroundColor White
    Write-Host "   - Open multiple company dashboard tabs" -ForegroundColor Gray
    Write-Host "   - ✅ Verify: All tabs update simultaneously" -ForegroundColor Green
    Write-Host "   - Vendor can update ride status (in-progress, completed)" -ForegroundColor Gray
    Write-Host "   - ✅ Verify: Company sees status updates in real-time" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 EXPECTED BEHAVIOR:" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    Write-Host "✅ Instant UI updates (no page refresh)" -ForegroundColor Green
    Write-Host "✅ Cross-tab synchronization" -ForegroundColor Green
    Write-Host "✅ Real-time status transitions" -ForegroundColor Green
    Write-Host "✅ Automatic section movement (pending → ongoing)" -ForegroundColor Green
    Write-Host "✅ Toast notifications for confirmations" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  If updates don't appear instantly, check:" -ForegroundColor Yellow
    Write-Host "   • Browser console for socket connection logs" -ForegroundColor Gray
    Write-Host "   • Network tab for socket.io connections" -ForegroundColor Gray
    Write-Host "   • Terminal for socket server logs" -ForegroundColor Gray
    Write-Host ""
}

# Function to cleanup processes
function Stop-TestEnvironment {
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    
    # Stop background jobs
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    
    # Kill any remaining node processes
    Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "  Test environment stopped" -ForegroundColor Gray
}

# Main execution
try {
    Write-Host "🔧 Setting up test environment..." -ForegroundColor Yellow

    # Start services
    $socketJob = Start-SocketServer
    $nextJob = Start-NextJS

    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep 3

    # Check if services are running (simplified check)
    Write-Host "✅ Services should be starting!" -ForegroundColor Green
    
    # Open dashboards
    Open-Dashboards
    
    # Show test instructions
    Show-TestInstructions
    
    # Keep script running
    Write-Host "Press Ctrl+C to stop the test environment..." -ForegroundColor Yellow
    Write-Host "Or close this PowerShell window when done testing." -ForegroundColor Gray
    
    # Wait for user input
    try {
        while ($true) {
            Start-Sleep 1
        }
    }
    catch {
        # User pressed Ctrl+C
    }
}
finally {
    Stop-TestEnvironment
}
