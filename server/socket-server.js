const { createServer } = require('http')
const { Server: SocketIOServer } = require('socket.io')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('  Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('  Service Key:', supabaseServiceKey ? 'Set' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('  Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Store for active connections
const connectedUsers = new Map()
const bookingRequests = new Map()

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  console.log("  Socket connected:", socket.id)

  // Store user connection info
  const { userType, userId } = socket.handshake.query
  
  if (userType && userId) {
    connectedUsers.set(socket.id, { userType, userId, socketId: socket.id })
    console.log(`  ${userType} ${userId} connected with socket ${socket.id}`)

    // Join user-specific room
    socket.join(`${userType}:${userId}`)
    
    // Join type-specific rooms
    socket.join(userType) // "company" or "vendor"
  }

  // Handle booking request creation (from companies)
  socket.on("create_booking_request", (bookingData) => {
    console.log("  Creating booking request:", bookingData)
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const requestWithId = {
      ...bookingData,
      requestId,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    // Store the booking request
    bookingRequests.set(requestId, requestWithId)

    // Broadcast to all vendors
    socket.to("vendor").emit("new_booking_request", requestWithId)
    
    // Confirm to the company that sent it
    socket.emit("booking_request_created", requestWithId)
    
    console.log(`  Booking request ${requestId} created and broadcast to vendors`)
  })

  // Handle booking request acceptance (from vendors)
  socket.on("accept_booking_request", async ({ requestId, vendorId }) => {
    console.log("  Vendor accepting booking request:", requestId, vendorId)
    
    const request = bookingRequests.get(requestId)
    if (request) {
      try {
        // Create booking in database
        const bookingData = {
          company_id: request.companyId,
          vendor_id: vendorId,
          pickup_location: request.pickupLocation,
          dropoff_location: request.destination,
          pickup_time: request.scheduledTime,
          passenger_name: request.passengerName,
          passenger_phone: request.passengerPhone,
          vehicle_type: request.vehicleType,
          special_requests: request.specialRequests || null,
          status: "accepted",
          price: parseFloat(request.estimatedFare.replace('$', '')),
          created_at: new Date().toISOString()
        }

        const { data: booking, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select()
          .single()

        if (error) {
          console.error("  Database error creating booking:", error)
          socket.emit("booking_error", { message: "Failed to save booking to database" })
          return
        }

        console.log("  Booking saved to database:", booking)

        // Update request status in memory
        request.status = "accepted"
        request.acceptedBy = vendorId
        request.acceptedAt = new Date().toISOString()
        request.bookingId = booking.id
        
        bookingRequests.set(requestId, request)

        // Notify the company that created the request
        socket.to(`company:${request.companyId}`).emit("booking_status_update", {
          requestId,
          status: "accepted",
          vendorId,
          bookingId: booking.id,
          request,
          booking
        })

        // Notify all vendors that this request is no longer available
        socket.to("vendor").emit("booking_request_accepted", { requestId, vendorId })
        
        // Confirm to the vendor
        socket.emit("booking_acceptance_confirmed", { 
          requestId, 
          bookingId: booking.id,
          message: "Booking accepted successfully" 
        })
        
        console.log(`  Booking request ${requestId} accepted by vendor ${vendorId}, booking ID: ${booking.id}`)
      } catch (error) {
        console.error("  Error processing booking acceptance:", error)
        socket.emit("booking_error", { message: "Failed to process booking acceptance" })
      }
    } else {
      console.log("  Booking request not found:", requestId)
      socket.emit("booking_error", { message: "Booking request not found" })
    }
  })

  // Handle booking request rejection (from vendors)
  socket.on("reject_booking_request", ({ requestId, vendorId }) => {
    console.log("  Vendor rejecting booking request:", requestId, vendorId)
    
    const request = bookingRequests.get(requestId)
    if (request) {
      // Just log the rejection, don't change the overall status
      // Other vendors can still accept it
      socket.emit("booking_request_rejected", { requestId, vendorId })
    }
  })

  // Handle ride status updates
  socket.on("update_ride_status", (rideData) => {
    console.log("  Ride status update:", rideData)

    // Broadcast to both companies and vendors
    io.emit("ride_status_updated", rideData)
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("  Socket disconnected:", socket.id)

    const user = connectedUsers.get(socket.id)
    if (user) {
      console.log(`  ${user.userType} ${user.userId} disconnected`)
      connectedUsers.delete(socket.id)
    }
  })
})

// Start the server
const port = process.env.SOCKET_PORT || 3001
httpServer.listen(port, () => {
  console.log(`  Socket.IO server running on port ${port}`)
})

module.exports = { io }
