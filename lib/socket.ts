import { io, type Socket } from "socket.io-client"

class SocketService {
  private socket: Socket | null = null
  private static instance: SocketService

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  connect(userType: "company" | "vendor", userId: string): Socket {
    if (!this.socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
      console.log("  [SocketService] Environment variables:")
      console.log("  - NEXT_PUBLIC_SOCKET_URL:", process.env.NEXT_PUBLIC_SOCKET_URL)
      console.log("  - NODE_ENV:", process.env.NODE_ENV)
      console.log("  [SocketService] Connecting to socket server at:", socketUrl)
      console.log("  [SocketService] User type:", userType, "User ID:", userId)
      
      this.socket = io(socketUrl, {
        query: { userType, userId },
      })

      this.socket.on("connect", () => {
        console.log("  [SocketService] Socket connected:", this.socket?.id)
      })

      this.socket.on("disconnect", () => {
        console.log("  [SocketService] Socket disconnected")
      })

      this.socket.on("connect_error", (error) => {
        console.error("  [SocketService] Socket connection error:", error)
      })
    }

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  // Company events
  createBookingRequest(bookingData: any): void {
    if (this.socket) {
      console.log("  Emitting booking request:", bookingData)
      this.socket.emit("create_booking_request", bookingData)
    }
  }

  // Vendor events
  acceptBookingRequest(requestId: string, vendorId: string): void {
    if (this.socket) {
      console.log("  Accepting booking request:", requestId)
      this.socket.emit("accept_booking_request", { requestId, vendorId })
    }
  }

  rejectBookingRequest(requestId: string, vendorId: string): void {
    if (this.socket) {
      console.log("  Rejecting booking request:", requestId)
      this.socket.emit("reject_booking_request", { requestId, vendorId })
    }
  }

  // Event listeners
  onNewBookingRequest(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on("new_booking_request", callback)
    }
  }

  onBookingRequestAccepted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on("booking_request_accepted", callback)
    }
  }

  onBookingRequestRejected(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on("booking_request_rejected", callback)
    }
  }

  onBookingStatusUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on("booking_status_update", callback)
    }
  }

  // Remove event listeners
  off(event: string, callback?: any): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

export default SocketService
