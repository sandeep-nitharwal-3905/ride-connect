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
    console.log(`  [Socket Server] ${userType} ${userId} connected with socket ${socket.id}`)

    // Join user-specific room
    const userRoom = `${userType}:${userId}`
    socket.join(userRoom)
    console.log(`  [Socket Server] ${userType} ${userId} joined room: ${userRoom}`)
    
    // Join type-specific rooms
    socket.join(userType) // "company" or "vendor"
    console.log(`  [Socket Server] ${userType} ${userId} joined type room: ${userType}`)
    
    // Log all rooms this socket is in
    socket.rooms.forEach(room => {
      console.log(`  [Socket Server] Socket ${socket.id} is in room: ${room}`)
    })
  } else {
    console.log(`  [Socket Server] Socket connected without user info:`, socket.handshake.query)
  }

  // Handle booking request creation (from companies)
  socket.on("create_booking_request", async (bookingData) => {
    console.log("  Creating booking request:", bookingData)
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Create booking record in database with 'pending' status
      // Only use fields that exist in the current database schema
      const bookingDBData = {
        company_id: bookingData.companyId,
        pickup_location: bookingData.pickupLocation,
        dropoff_location: bookingData.destination,
        pickup_time: bookingData.scheduledTime,
        passenger_count: 1, // Default passenger count
        status: "pending",
        price: parseFloat(bookingData.estimatedFare.replace('$', '')),
        created_at: new Date().toISOString()
      }

      // Add special_requirements if provided (this field exists)
      if (bookingData.specialRequests) {
        bookingDBData.special_requirements = bookingData.specialRequests
      }

      console.log("  Attempting to create booking with data:", bookingDBData)

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingDBData])
        .select()
        .single()

      if (error) {
        console.error("  Database error creating booking:", error)
        socket.emit("booking_request_error", { 
          requestId, 
          error: "Failed to save booking to database" 
        })
        return
      }

      console.log("  Booking created in database:", booking.id)

      const requestWithId = {
        ...bookingData,
        requestId,
        bookingId: booking.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      // Store the booking request with DB booking ID
      bookingRequests.set(requestId, requestWithId)

      // Broadcast to all vendors
      socket.to("vendor").emit("new_booking_request", requestWithId)
      
      // Confirm to the company that sent it
      socket.emit("booking_request_created", {
        ...requestWithId,
        bookingId: booking.id,
        message: "Booking request created successfully"
      })

      // Emit a general ride status update to refresh company dashboard
      socket.emit("ride_created", {
        booking: booking,
        requestId: requestId,
        status: "pending"
      })

      // Also emit to company room to refresh dashboard
      socket.to(`company:${bookingData.companyId}`).emit("pending_rides_updated", {
        booking: booking,
        action: "created"
      })
      
      console.log(`  Booking request ${requestId} created with booking ID ${booking.id} and broadcast to vendors`)
    } catch (error) {
      console.error("  Error creating booking request:", error)
      socket.emit("booking_request_error", { 
        requestId, 
        error: "Failed to create booking request" 
      })
    }
  })

  // Handle booking request acceptance (from vendors)
  socket.on("accept_booking_request", async ({ requestId, vendorId }) => {
    console.log("  Vendor accepting booking request:", requestId, vendorId)
    
    const request = bookingRequests.get(requestId)
    if (request && request.status === "pending") {
      try {
        // Update existing booking record with vendor assignment and 'accepted' status
        const { data: booking, error } = await supabase
          .from('bookings')
          .update({
            vendor_id: vendorId,
            status: "accepted",
            updated_at: new Date().toISOString()
          })
          .eq('id', request.bookingId)
          .select()
          .single()

        if (error) {
          console.error("  Database error updating booking:", error)
          socket.emit("booking_error", { message: "Failed to update booking in database" })
          return
        }

        console.log("  Booking updated in database:", booking.id)

        // Update request status in memory
        request.status = "accepted"
        request.acceptedBy = vendorId
        request.acceptedAt = new Date().toISOString()
        
        bookingRequests.set(requestId, request)

        // Notify the company that created the request
        console.log(`  [Socket Server] Emitting booking_status_update to company:${request.companyId}`)
        socket.to(`company:${request.companyId}`).emit("booking_status_update", {
          requestId,
          status: "accepted",
          vendorId,
          bookingId: request.bookingId,
          request,
          booking
        })

        // Emit pending rides update to refresh company dashboard
        console.log(`  [Socket Server] Emitting pending_rides_updated to company:${request.companyId}`)
        socket.to(`company:${request.companyId}`).emit("pending_rides_updated", {
          booking: booking,
          action: "accepted"
        })

        // Emit ongoing rides update to refresh ongoing rides section
        console.log(`  [Socket Server] Emitting ongoing_rides_updated to company:${request.companyId}`)
        socket.to(`company:${request.companyId}`).emit("ongoing_rides_updated", {
          booking: booking,
          action: "added",
          status: "accepted"
        })

        // Notify all vendors that this request is no longer available
        socket.to("vendor").emit("booking_request_accepted", { requestId, vendorId })
        
        // Confirm to the vendor
        socket.emit("booking_acceptance_confirmed", { 
          requestId, 
          bookingId: request.bookingId,
          message: "Booking accepted successfully" 
        })
        
        console.log(`  Booking request ${requestId} accepted by vendor ${vendorId}, booking ID: ${request.bookingId}`)
      } catch (error) {
        console.error("  Error processing booking acceptance:", error)
        socket.emit("booking_error", { message: "Failed to process booking acceptance" })
      }
    } else if (request && request.status !== "pending") {
      console.log("  Booking request already processed:", requestId, "Status:", request.status)
      socket.emit("booking_error", { message: "Booking request already processed" })
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

  // Handle ride status updates with proper validation
  socket.on("update_ride_status", async (rideData) => {
    console.log("  Ride status update:", rideData)

    const { bookingId, newStatus, vendorId, location } = rideData

    try {
      // Validate status transition
      const validTransitions = {
        'pending': ['accepted', 'cancelled'],
        'accepted': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'rejected': []
      }

      // Get current booking status
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('status, vendor_id, company_id')
        .eq('id', bookingId)
        .single()

      if (fetchError || !currentBooking) {
        console.error("  Error fetching booking:", fetchError)
        socket.emit("ride_status_error", { message: "Booking not found" })
        return
      }

      // Check if transition is valid
      if (!validTransitions[currentBooking.status]?.includes(newStatus)) {
        console.error(`  Invalid status transition: ${currentBooking.status} → ${newStatus}`)
        socket.emit("ride_status_error", { 
          message: `Cannot change status from ${currentBooking.status} to ${newStatus}` 
        })
        return
      }

      // Build update data
      const updateData = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }
      
      // Add location tracking for in-progress rides
      if (location && newStatus === "in_progress") {
        updateData.current_location = location
      }

      // Update booking in database
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select(`
          *,
          company:users!bookings_company_id_fkey(id, company_name, email),
          vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)
        `)
        .single()

      if (updateError) {
        console.error("  Error updating ride status:", updateError)
        socket.emit("ride_status_error", { message: "Failed to update ride status" })
        return
      }

      console.log(`  Ride status updated: ${bookingId} → ${newStatus}`)

      // Broadcast to both company and vendor
      const statusUpdateData = {
        bookingId,
        status: newStatus,
        booking: updatedBooking,
        timestamp: new Date().toISOString(),
        location
      }

      // Notify company
      socket.to(`company:${currentBooking.company_id}`).emit("ride_status_updated", statusUpdateData)
      
      // Emit pending rides update if status affects pending state
      if (newStatus === "pending" || currentBooking.status === "pending") {
        socket.to(`company:${currentBooking.company_id}`).emit("pending_rides_updated", {
          booking: updatedBooking,
          action: "status_changed",
          oldStatus: currentBooking.status,
          newStatus: newStatus
        })
      }

      // Emit ongoing rides update if status affects ongoing rides (accepted, in_progress)
      const ongoingStatuses = ["accepted", "in_progress"]
      if (ongoingStatuses.includes(newStatus) || ongoingStatuses.includes(currentBooking.status)) {
        let action = "updated"
        if (ongoingStatuses.includes(newStatus) && !ongoingStatuses.includes(currentBooking.status)) {
          action = "added" // Moving to ongoing
        } else if (!ongoingStatuses.includes(newStatus) && ongoingStatuses.includes(currentBooking.status)) {
          action = "removed" // Moving out of ongoing
        }

        socket.to(`company:${currentBooking.company_id}`).emit("ongoing_rides_updated", {
          booking: updatedBooking,
          action: action,
          oldStatus: currentBooking.status,
          newStatus: newStatus
        })

        // Also notify vendor if assigned
        if (currentBooking.vendor_id) {
          socket.to(`vendor:${currentBooking.vendor_id}`).emit("ongoing_rides_updated", {
            booking: updatedBooking,
            action: action,
            oldStatus: currentBooking.status,
            newStatus: newStatus
          })
        }
      }
      
      // Notify vendor if assigned
      if (currentBooking.vendor_id) {
        socket.to(`vendor:${currentBooking.vendor_id}`).emit("ride_status_updated", statusUpdateData)
      }

      // Confirm to sender
      socket.emit("ride_status_update_confirmed", statusUpdateData)

    } catch (error) {
      console.error("  Error in ride status update:", error)
      socket.emit("ride_status_error", { message: "Failed to process status update" })
    }
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
const port = process.env.PORT || process.env.SOCKET_PORT || 3001
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`  Socket.IO server running on port ${port}`)
})

module.exports = { io }
