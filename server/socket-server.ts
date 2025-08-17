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

// Import database functions
import { getPartnerVendorsForCompany } from '../lib/database'

// Store for active connections
const connectedUsers = new Map<string, { userType: string; userId: string; socketId: string }>()
const bookingRequests = new Map<string, any>()

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket: any) => {
  console.log("  Socket connected:", socket.id)

  // Store user connection info
  const { userType, userId } = socket.handshake.query as { userType: string; userId: string }
  
  if (userType && userId) {
    connectedUsers.set(socket.id, { userType, userId, socketId: socket.id })
    console.log(`  ${userType} ${userId} connected with socket ${socket.id}`)

    // Join user-specific room
    socket.join(`${userType}:${userId}`)
    
    // Join type-specific rooms
    socket.join(userType) // "company" or "vendor"
  }

  // Handle booking request creation (from companies)
  socket.on("create_booking_request", async (bookingData: any) => {
    console.log("  Creating booking request:", bookingData)
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // First, create the booking record in database
      const bookingDBData: any = {
        company_id: bookingData.companyId,
        pickup_location: bookingData.pickupLocation,
        dropoff_location: bookingData.destination,
        pickup_time: bookingData.scheduledTime,
        passenger_count: 1, // Default passenger count
        status: "pending",
        price: parseFloat(bookingData.estimatedFare.replace('$', '')),
        created_at: new Date().toISOString()
      }

      // Add optional fields only if they exist in the database schema
      if (bookingData.passengerName) {
        bookingDBData.passenger_name = bookingData.passengerName
      }
      if (bookingData.passengerPhone) {
        bookingDBData.passenger_phone = bookingData.passengerPhone
      }
      if (bookingData.vehicleType) {
        bookingDBData.vehicle_type = bookingData.vehicleType
      }
      if (bookingData.specialRequests) {
        bookingDBData.special_requirements = bookingData.specialRequests
      }

      console.log("  Attempting to create booking with data:", bookingDBData)

      const { data: booking, error: dbError } = await supabase
        .from('bookings')
        .insert([bookingDBData])
        .select()
        .single()

      if (dbError) {
        console.error("  Database error creating booking:", dbError)
        socket.emit("booking_request_error", { 
          requestId, 
          error: "Failed to save booking to database" 
        })
        return
      }

      const requestWithId = {
        ...bookingData,
        requestId,
        bookingId: booking.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      // Store the booking request
      bookingRequests.set(requestId, requestWithId)

      // Get partner vendors for this company
      const partnerVendors = await getPartnerVendorsForCompany(bookingData.companyId)
      
      if (partnerVendors.length === 0) {
        console.log(`  No partner vendors found for company ${bookingData.companyId}`)
        socket.emit("booking_request_error", { 
          requestId, 
          error: "No partner vendors available. Please establish partnerships first." 
        })
        return
      }

      // Send to connected partner vendors only
      let sentToVendors = 0
      for (const vendor of partnerVendors) {
        const vendorSocketId = Array.from(connectedUsers.entries())
          .find(([socketId, user]) => user.userType === 'vendor' && user.userId === vendor.id)

        if (vendorSocketId) {
          socket.to(vendorSocketId[0]).emit("new_booking_request", requestWithId)
          sentToVendors++
        }
      }

      console.log(`  Booking request ${requestId} sent to ${sentToVendors} partner vendors out of ${partnerVendors.length} total partners`)
      
      // Confirm to the company that sent it
      socket.emit("booking_request_created", { 
        ...requestWithId, 
        bookingId: booking.id,
        sentToVendors,
        totalPartners: partnerVendors.length,
        message: `Booking request sent to ${sentToVendors} available vendors`
      })
      
    } catch (error) {
      console.error("  Error creating booking request:", error)
      socket.emit("booking_request_error", { 
        requestId, 
        error: "Failed to create booking request" 
      })
    }
  })

  // Handle booking request acceptance (from vendors)
  socket.on("accept_booking_request", ({ requestId, vendorId }: { requestId: string, vendorId: string }) => {
    console.log("  Vendor accepting booking request:", requestId, vendorId)
    
    const request = bookingRequests.get(requestId)
    if (request) {
      // Update request status
      request.status = "accepted"
      request.acceptedBy = vendorId
      request.acceptedAt = new Date().toISOString()
      
      bookingRequests.set(requestId, request)

      // Notify the company that created the request
      socket.to(`company:${request.companyId}`).emit("booking_status_update", {
        requestId,
        status: "accepted",
        vendorId,
        request
      })

      // Notify all vendors that this request is no longer available
      socket.to("vendor").emit("booking_request_accepted", { requestId, vendorId })
      
      console.log(`  Booking request ${requestId} accepted by vendor ${vendorId}`)
    }
  })

  // Handle booking request rejection (from vendors)
  socket.on("reject_booking_request", ({ requestId, vendorId }: { requestId: string, vendorId: string }) => {
    console.log("  Vendor rejecting booking request:", requestId, vendorId)
    
    const request = bookingRequests.get(requestId)
    if (request) {
      // Just log the rejection, don't change the overall status
      // Other vendors can still accept it
      socket.emit("booking_request_rejected", { requestId, vendorId })
    }
  })

  // Handle ride status updates
  socket.on("update_ride_status", (rideData: any) => {
    console.log("  Ride status update:", rideData)

    // Broadcast to both companies and vendors
    io.emit("ride_status_updated", rideData)
  })

  // Handle real-time location updates for ongoing rides
  socket.on("update_ride_location", (locationData: { bookingId: string, location: string, vendorId: string }) => {
    console.log("  Ride location update:", locationData)
    
    const request = bookingRequests.get(locationData.bookingId)
    if (request) {
      // Notify the company about location update
      socket.to(`company:${request.companyId}`).emit("ride_location_updated", {
        bookingId: locationData.bookingId,
        location: locationData.location,
        timestamp: new Date().toISOString()
      })
    }
  })

  // Handle user requesting their ongoing rides
  socket.on("get_user_ongoing_rides", async (userData: { userId: string, userType: 'company' | 'vendor' }) => {
    console.log("  User requesting ongoing rides:", userData)
    
    try {
      const { getOngoingRidesForUser } = await import('../lib/database')
      const ongoingRides = await getOngoingRidesForUser(userData.userId, userData.userType)
      
      socket.emit("user_ongoing_rides", {
        userId: userData.userId,
        ongoingRides,
        count: ongoingRides.length
      })
    } catch (error) {
      console.error("  Error fetching ongoing rides:", error)
      socket.emit("user_ongoing_rides_error", { 
        userId: userData.userId, 
        error: "Failed to fetch ongoing rides" 
      })
    }
  })

  // Handle user requesting their current partners
  socket.on("get_user_current_partners", async (userData: { userId: string, userType: 'company' | 'vendor' }) => {
    console.log("  User requesting current partners:", userData)
    
    try {
      const { getPartnershipsByCompany, getPartnershipsByVendor } = await import('../lib/database')
      
      let partnerships = []
      if (userData.userType === 'company') {
        partnerships = await getPartnershipsByCompany(userData.userId)
      } else {
        partnerships = await getPartnershipsByVendor(userData.userId)
      }
      
      socket.emit("user_current_partners", {
        userId: userData.userId,
        partnerships,
        count: partnerships.length
      })
    } catch (error) {
      console.error("  Error fetching current partners:", error)
      socket.emit("user_current_partners_error", { 
        userId: userData.userId, 
        error: "Failed to fetch current partners" 
      })
    }
  })

  // Handle user requesting available partners
  socket.on("get_user_available_partners", async (userData: { userId: string, userType: 'company' | 'vendor' }) => {
    console.log("  User requesting available partners:", userData)
    
    try {
      const { getAvailableVendorsForPartnership, getAvailableCompaniesForPartnership } = await import('../lib/database')
      
      let availablePartners = []
      if (userData.userType === 'company') {
        availablePartners = await getAvailableVendorsForPartnership(userData.userId)
      } else {
        availablePartners = await getAvailableCompaniesForPartnership(userData.userId)
      }
      
      socket.emit("user_available_partners", {
        userId: userData.userId,
        availablePartners,
        count: availablePartners.length,
        partnerType: userData.userType === 'company' ? 'vendors' : 'companies'
      })
    } catch (error) {
      console.error("  Error fetching available partners:", error)
      socket.emit("user_available_partners_error", { 
        userId: userData.userId, 
        error: "Failed to fetch available partners" 
      })
    }
  })

  // Handle new partnership creation
  socket.on("create_partnership", async (partnershipData: { companyId: string, vendorId: string, requesterId: string }) => {
    console.log("  Creating new partnership:", partnershipData)
    
    try {
      const { createPartnership } = await import('../lib/database')
      const partnership = await createPartnership(partnershipData.companyId, partnershipData.vendorId)
      
      if (partnership) {
        // Notify both parties about the new partnership
        socket.to(`company:${partnershipData.companyId}`).emit("partnership_created", {
          partnership,
          message: "New vendor partnership established"
        })
        
        socket.to(`vendor:${partnershipData.vendorId}`).emit("partnership_created", {
          partnership,
          message: "New company partnership established"
        })
        
        // Confirm to requester
        socket.emit("partnership_creation_success", { partnership })
      } else {
        socket.emit("partnership_creation_error", { error: "Failed to create partnership" })
      }
    } catch (error) {
      console.error("  Error creating partnership:", error)
      socket.emit("partnership_creation_error", { error: "Failed to create partnership" })
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
const port = process.env.SOCKET_PORT || 3001
httpServer.listen(port, () => {
  console.log(`  Socket.IO server running on port ${port}`)
})

module.exports = { io }
