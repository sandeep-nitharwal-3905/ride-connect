"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { MapPin, User, Clock, Building2, Check, X, DollarSign, Wifi, WifiOff } from "lucide-react"
import SocketService from "@/lib/socket"

interface BookingRequest {
  id: string
  company?: string
  companyName?: string
  passenger?: string
  passengerName?: string
  pickupLocation: string
  destination: string
  scheduledTime: string
  vehicleType: string
  estimatedFare: string
  status: "pending" | "accepted" | "rejected" | "no_longer_available"
  specialRequests?: string
  urgency: "normal" | "urgent"
  createdAt?: string
}

interface BookingRequestsSectionProps {
  vendorId?: string
}

export function BookingRequestsSection({ vendorId = "vendor_001" }: BookingRequestsSectionProps) {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const { toast } = useToast()
  const { isConnected, connect } = useSocket()

  useEffect(() => {
    if (!isConnected) {
      connect("vendor", vendorId)
    }
  }, [isConnected, connect, vendorId])

  useEffect(() => {
    const socketService = SocketService.getInstance()
    const socket = socketService.getSocket()

    if (socket) {
      const handleNewBookingRequest = (bookingData: BookingRequest) => {
        console.log("  New booking request received:", bookingData)

        setRequests((prev) => {
          // Check if request already exists to prevent duplicates
          const existingRequest = prev.find(req => req.id === bookingData.id)
          if (existingRequest) {
            console.log("  Duplicate request ignored:", bookingData.id)
            return prev
          }
          return [bookingData, ...prev]
        })

        toast({
          title: "New Booking Request!",
          description: `${bookingData.companyName} has requested a ride to ${bookingData.destination}`,
        })
      }

      const handleBookingAccepted = (data: { requestId: string; acceptedBy: string; status: string }) => {
        console.log("  Booking request accepted by another vendor:", data)

        setRequests((prev) =>
          prev.map((req) => (req.id === data.requestId ? { ...req, status: "no_longer_available" as const } : req)),
        )

        toast({
          title: "Request No Longer Available",
          description: `Booking ${data.requestId} has been accepted by another vendor.`,
          variant: "destructive",
        })
      }

      const handleBookingError = (data: { requestId: string; error: string }) => {
        console.log("  Booking request error:", data)
        
        toast({
          title: "Booking Request Error",
          description: data.error,
          variant: "destructive",
        })
      }

      const handleBookingAcceptanceConfirmed = (data: { requestId: string; bookingId: string; message: string }) => {
        console.log("  Booking acceptance confirmed:", data)
        
        toast({
          title: "Booking Accepted Successfully!",
          description: `Booking ID: ${data.bookingId} - You can now see this in your ongoing rides.`,
        })
        
        // Remove the accepted request from the list
        setRequests(prev => prev.filter(req => req.id !== data.requestId))
      }

      socket.on("new_booking_request", handleNewBookingRequest)
      socket.on("booking_request_accepted", handleBookingAccepted)
      socket.on("booking_request_error", handleBookingError)
      socket.on("booking_acceptance_confirmed", handleBookingAcceptanceConfirmed)

      return () => {
        socket.off("new_booking_request", handleNewBookingRequest)
        socket.off("booking_request_accepted", handleBookingAccepted)
        socket.off("booking_request_error", handleBookingError)
        socket.off("booking_acceptance_confirmed", handleBookingAcceptanceConfirmed)
      }
    }
  }, [toast])

  const handleAcceptRequest = (requestId: string) => {
    const socketService = SocketService.getInstance()

    setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "accepted" as const } : req)))

    socketService.acceptBookingRequest(requestId, vendorId)

    toast({
      title: "Request Accepted",
      description: "You have successfully accepted the booking request. The company has been notified in real-time.",
    })
  }

  const handleRejectRequest = (requestId: string) => {
    const socketService = SocketService.getInstance()

    setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: "rejected" as const } : req)))

    socketService.rejectBookingRequest(requestId, vendorId)

    toast({
      title: "Request Rejected",
      description: "The booking request has been rejected. The company has been notified.",
      variant: "destructive",
    })
  }

  const getStatusBadge = (status: string, urgency: string) => {
    if (status === "pending") {
      return (
        <Badge variant="outline" className={urgency === "urgent" ? "border-red-500 text-red-700" : ""}>
          {urgency === "urgent" ? "URGENT PENDING" : "PENDING"}
        </Badge>
      )
    }
    if (status === "accepted") {
      return <Badge className="bg-green-100 text-green-800">ACCEPTED</Badge>
    }
    if (status === "rejected") {
      return <Badge variant="destructive">REJECTED</Badge>
    }
    if (status === "no_longer_available") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          NO LONGER AVAILABLE
        </Badge>
      )
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const processedRequests = requests.filter((req) => req.status !== "pending")

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Connected to real-time booking system</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Disconnected from real-time system</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Requests ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </CardTitle>
          <CardDescription>New booking requests waiting for your response (updates in real-time)</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pending requests at the moment.</p>
              <p className="text-sm mt-1">New requests will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <div
                  key={`pending-${request.id}-${index}`}
                  className={`p-4 border rounded-lg ${
                    request.urgency === "urgent" ? "border-red-200 bg-red-50" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Request #{request.id}</h4>
                        {getStatusBadge(request.status, request.urgency)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {request.companyName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <DollarSign className="h-5 w-5" />
                      {request.estimatedFare}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Passenger:</span> {request.passengerName}
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Pickup:</div>
                          <div className="text-muted-foreground">{request.pickupLocation}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Destination:</div>
                          <div className="text-muted-foreground">{request.destination}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Scheduled:</span>
                        <span>
                          {formatDateTime(request.scheduledTime).date} at {formatDateTime(request.scheduledTime).time}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Vehicle Type:</span>{" "}
                        <span className="capitalize">{request.vehicleType}</span>
                      </div>
                      {request.specialRequests && (
                        <div className="text-sm">
                          <span className="font-medium">Special Requests:</span>
                          <div className="text-muted-foreground mt-1">{request.specialRequests}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={!isConnected}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept Request
                    </Button>
                    <Button variant="outline" onClick={() => handleRejectRequest(request.id)} disabled={!isConnected}>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Previously processed booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No processed requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedRequests.map((request, index) => (
                <div key={`processed-${request.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">#{request.id}</div>
                      <div className="text-sm text-muted-foreground">{request.companyName}</div>
                    </div>
                    <div className="text-sm">
                      <div>{request.passengerName}</div>
                      <div className="text-muted-foreground">{request.destination}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{request.estimatedFare}</span>
                    {getStatusBadge(request.status, request.urgency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
