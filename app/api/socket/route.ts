import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import { getPartnerVendorsForCompany } from "../../../lib/database"

// Store for active connections
const connectedUsers = new Map<string, { userType: string; userId: string; socketId: string }>()
const bookingRequests = new Map<string, any>()

// Global variable to store the server instance
declare global {
  var socketIOServer: SocketIOServer | undefined
}

let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io && !global.socketIOServer) {
    console.log("  Initializing Socket.IO server")

    // Create HTTP server for Socket.IO
    const httpServer = createServer()

    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
    })

    io.on("connection", (socket) => {
      console.log("  New socket connection:", socket.id)

      const { userType, userId } = socket.handshake.query

      if (userType && userId) {
        connectedUsers.set(socket.id, {
          userType: userType as string,
          userId: userId as string,
          socketId: socket.id,
        })

        console.log(`  ${userType} ${userId} connected`)

        // Join room based on user type
        socket.join(`${userType}s`)
      }

      // Handle booking request creation (from companies)
      socket.on("create_booking_request", async (bookingData: any) => {
        console.log("  New booking request received:", bookingData)

        const requestId = `BR${Date.now()}`
        const fullBookingData = {
          ...bookingData,
          id: requestId,
          status: "pending",
          createdAt: new Date().toISOString(),
        }

        bookingRequests.set(requestId, fullBookingData)

        try {
          // Get partner vendors for this company
          const partnerVendors = await getPartnerVendorsForCompany(bookingData.companyId)
          
          if (partnerVendors.length === 0) {
            console.log(`  No partner vendors found for company ${bookingData.companyId}`)
            socket.emit("booking_request_error", { 
              requestId, 
              error: "No partner vendors available" 
            })
            return
          }

          // Send to connected partner vendors only
          let sentToVendors = 0
          for (const vendor of partnerVendors) {
            const vendorSocketId = Array.from(connectedUsers.entries())
              .find(([socketId, user]) => user.userType === 'vendor' && user.userId === vendor.id)

            if (vendorSocketId) {
              io?.to(vendorSocketId[0]).emit("new_booking_request", fullBookingData)
              sentToVendors++
            }
          }

          console.log(`  Booking request ${requestId} sent to ${sentToVendors} partner vendors`)

          // Confirm to company
          socket.emit("booking_request_created", { 
            requestId, 
            status: "sent_to_vendors",
            sentToVendors 
          })

        } catch (error) {
          console.error("  Error getting partner vendors:", error)
          socket.emit("booking_request_error", { 
            requestId, 
            error: "Failed to get partner vendors" 
          })
        }
      })

      // Handle booking request acceptance (from vendors)
      socket.on("accept_booking_request", ({ requestId, vendorId }) => {
        console.log("  Booking request accepted:", requestId, "by vendor:", vendorId)

        const booking = bookingRequests.get(requestId)
        if (booking && booking.status === "pending") {
          booking.status = "accepted"
          booking.acceptedBy = vendorId
          booking.acceptedAt = new Date().toISOString()

          bookingRequests.set(requestId, booking)

          // Notify all vendors that this request is no longer available
          io?.to("vendors").emit("booking_request_accepted", {
            requestId,
            acceptedBy: vendorId,
            status: "no_longer_available",
          })

          // Notify companies about the acceptance
          io?.to("companies").emit("booking_status_update", {
            requestId,
            status: "accepted",
            vendorId,
          })

          console.log("  Booking acceptance broadcast to all users")
        }
      })

      // Handle booking request rejection (from vendors)
      socket.on("reject_booking_request", ({ requestId, vendorId }) => {
        console.log("  Booking request rejected:", requestId, "by vendor:", vendorId)

        // Just log the rejection, don't change the overall status
        // Other vendors can still accept it
        socket.emit("booking_request_rejected", { requestId, vendorId })
      })

      // Handle ride status updates
      socket.on("update_ride_status", (rideData) => {
        console.log("  Ride status update:", rideData)

        // Broadcast to both companies and vendors
        io?.emit("ride_status_updated", rideData)
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

    // Start the HTTP server
    const port = process.env.SOCKET_PORT || 3001
    httpServer.listen(port, () => {
      console.log(`  Socket.IO server running on port ${port}`)
    })

    // Store globally to persist across requests
    global.socketIOServer = io
  } else {
    io = global.socketIOServer || io
  }

  return new Response("Socket.IO server initialized", { status: 200 })
}
