#!/bin/bash

# Real-time Pending Rides Test Script
# This script tests the complete real-time flow for pending rides updates

echo "🚀 Starting Real-time Pending Rides Test..."

# Function to check if a process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo "✅ $1 is running"
        return 0
    else
        echo "❌ $1 is not running"
        return 1
    fi
}

# Function to start socket server
start_socket_server() {
    echo "📡 Starting Socket Server..."
    if ! check_process "socket-server.js"; then
        cd "$(dirname "$0")"
        node server/socket-server.js &
        SOCKET_PID=$!
        echo "  Socket server started with PID: $SOCKET_PID"
        sleep 3
    fi
}

# Function to start Next.js dev server
start_nextjs() {
    echo "🌐 Starting Next.js Dev Server..."
    if ! check_process "next dev"; then
        cd "$(dirname "$0")"
        npm run dev &
        NEXTJS_PID=$!
        echo "  Next.js server started with PID: $NEXTJS_PID"
        sleep 5
    fi
}

# Function to open browser windows
open_dashboards() {
    echo "🌐 Opening Dashboard Windows..."
    
    # Company Dashboard
    echo "  Opening Company Dashboard: http://localhost:3000/dashboard/company"
    if command -v start &> /dev/null; then
        start http://localhost:3000/dashboard/company
    elif command -v open &> /dev/null; then
        open http://localhost:3000/dashboard/company
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/dashboard/company
    else
        echo "  Please manually open: http://localhost:3000/dashboard/company"
    fi
    
    sleep 2
    
    # Vendor Dashboard
    echo "  Opening Vendor Dashboard: http://localhost:3000/dashboard/vendor"
    if command -v start &> /dev/null; then
        start http://localhost:3000/dashboard/vendor
    elif command -v open &> /dev/null; then
        open http://localhost:3000/dashboard/vendor
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/dashboard/vendor
    else
        echo "  Please manually open: http://localhost:3000/dashboard/vendor"
    fi
}

# Function to display test instructions
show_test_instructions() {
    echo ""
    echo "🧪 REAL-TIME TEST INSTRUCTIONS:"
    echo "==============================="
    echo ""
    echo "1. 📋 COMPANY DASHBOARD:"
    echo "   - Login as a company user"
    echo "   - Click 'Create New Booking' button"
    echo "   - Fill in ride details and submit"
    echo "   - ✅ Verify: New ride appears in 'Pending Rides' section"
    echo ""
    echo "2. 🚐 VENDOR DASHBOARD:"
    echo "   - Login as a vendor user"
    echo "   - ✅ Verify: New booking request appears"
    echo "   - Click 'Accept' on the booking request"
    echo ""
    echo "3. 📊 REAL-TIME UPDATE VERIFICATION:"
    echo "   - ✅ Check Company Dashboard IMMEDIATELY:"
    echo "     • Ride status changes from 'pending' to 'accepted'"
    echo "     • Ride moves from 'Pending Rides' to 'Ongoing Rides'"
    echo "     • Vendor information appears on the ride"
    echo "     • NO PAGE REFRESH NEEDED - should update instantly!"
    echo ""
    echo "4. 🔄 ADDITIONAL TESTS:"
    echo "   - Open multiple company dashboard tabs"
    echo "   - ✅ Verify: All tabs update simultaneously"
    echo "   - Vendor can update ride status (in-progress, completed)"
    echo "   - ✅ Verify: Company sees status updates in real-time"
    echo ""
    echo "📝 EXPECTED BEHAVIOR:"
    echo "===================="
    echo "✅ Instant UI updates (no page refresh)"
    echo "✅ Cross-tab synchronization"
    echo "✅ Real-time status transitions"
    echo "✅ Automatic section movement (pending → ongoing)"
    echo "✅ Toast notifications for confirmations"
    echo ""
    echo "⚠️  If updates don't appear instantly, check:"
    echo "   • Browser console for socket connection logs"
    echo "   • Network tab for socket.io connections"
    echo "   • Terminal for socket server logs"
    echo ""
}

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if [ ! -z "$SOCKET_PID" ]; then
        kill $SOCKET_PID 2>/dev/null
        echo "  Stopped Socket Server"
    fi
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null
        echo "  Stopped Next.js Server"
    fi
}

# Trap cleanup on script exit
trap cleanup EXIT

# Main execution
echo "🔧 Setting up test environment..."

# Start services
start_socket_server
start_nextjs

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 3

# Check if services are running
if check_process "socket-server.js" && check_process "next"; then
    echo "✅ All services are running!"
    
    # Open dashboards
    open_dashboards
    
    # Show test instructions
    show_test_instructions
    
    # Keep script running
    echo "Press Ctrl+C to stop the test environment..."
    while true; do
        sleep 1
    done
else
    echo "❌ Some services failed to start!"
    echo "Please check the error messages above and try again."
    exit 1
fi
