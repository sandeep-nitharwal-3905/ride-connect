"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUserData } from "@/hooks/use-user-data"
import { useSocket } from "@/hooks/use-socket"
import { MapPin, Clock, User, Navigation, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import SocketService from "@/lib/socket"

interface OngoingRidesSectionProps {
  userId: string
  userType: 'company' | 'vendor'
}

export function OngoingRidesSection({ userId, userType }: OngoingRidesSectionProps) {
  const { ongoingRides, loading, error, refresh } = useUserData(userId, userType)
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()

  // Set up socket listeners for real-time ongoing rides updates
  useEffect(() => {
    if (isConnected) {
      const socketService = SocketService.getInstance()
      const socket = socketService.getSocket()

      if (socket) {
        const handleOngoingRidesUpdated = (data: any) => {
          console.log("  Ongoing rides section received update:", data)
          // Refresh ongoing rides when they're updated
          refresh.ongoingRides()
          
          // Show toast notification for status changes
          if (data.action === "added") {
            toast({
              title: "New Ongoing Ride",
              description: `A ride has been ${data.status === "accepted" ? "accepted" : "started"}.`,
            })
          } else if (data.action === "removed") {
            toast({
              title: "Ride Status Updated",
              description: `A ride has been ${data.newStatus}.`,
            })
          }
        }

        const handleRideStatusUpdated = (data: any) => {
          console.log("  Ongoing rides section received status update:", data)
          // Refresh ongoing rides when status changes
          refresh.ongoingRides()
        }

        socket.on("ongoing_rides_updated", handleOngoingRidesUpdated)
        socket.on("ride_status_updated", handleRideStatusUpdated)

        return () => {
          socket.off("ongoing_rides_updated", handleOngoingRidesUpdated)
          socket.off("ride_status_updated", handleRideStatusUpdated)
        }
      }
    }
  }, [isConnected, refresh.ongoingRides, toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString()
  }

  if (loading.ongoingRides) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Ongoing Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading ongoing rides...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error.ongoingRides) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Ongoing Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error.ongoingRides}</p>
            <Button onClick={refresh.ongoingRides} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Ongoing Rides
          </div>
          <Button 
            onClick={refresh.ongoingRides} 
            variant="outline" 
            size="sm"
            disabled={loading.ongoingRides}
          >
            <RefreshCw className={`h-4 w-4 ${loading.ongoingRides ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          {userType === 'company' 
            ? 'Rides your company has requested' 
            : 'Rides you are currently handling'
          } ({ongoingRides.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ongoingRides.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ongoing rides at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ongoingRides.map((ride) => (
              <div key={ride.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(ride.status)}>
                      {ride.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      #{ride.id.slice(-8)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatTime(ride.pickup_time)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Pickup:</strong> {ride.pickup_location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      <strong>Dropoff:</strong> {ride.dropoff_location}
                    </span>
                  </div>

                  {userType === 'company' && ride.vendor && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        <strong>Vendor:</strong> {ride.vendor.vendor_name}
                      </span>
                    </div>
                  )}

                  {userType === 'vendor' && ride.company && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">
                        <strong>Company:</strong> {ride.company.company_name}
                      </span>
                    </div>
                  )}

                  {ride.passenger_count && (
                    <div className="text-sm">
                      <strong>Passengers:</strong> {ride.passenger_count}
                    </div>
                  )}

                  {ride.special_requirements && (
                    <div className="text-sm">
                      <strong>Special Requirements:</strong> {ride.special_requirements}
                    </div>
                  )}

                  {ride.current_location && ride.status === 'in_progress' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                      <Navigation className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        <strong>Current Location:</strong> {ride.current_location}
                      </span>
                    </div>
                  )}

                  {/* Status Action Buttons for Vendors */}
                  {userType === 'vendor' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {ride.status === 'accepted' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(ride.id, 'in_progress')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Ride
                        </Button>
                      )}
                      {ride.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(ride.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Complete Ride
                        </Button>
                      )}
                      {(ride.status === 'accepted' || ride.status === 'in_progress') && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(ride.id, 'cancelled')}
                        >
                          Cancel Ride
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  function handleStatusUpdate(bookingId: string, newStatus: string) {
    if (socket && isConnected) {
      socket.emit("update_ride_status", {
        bookingId,
        newStatus,
        vendorId: userId,
        timestamp: new Date().toISOString()
      })
      
      toast({
        title: "Status Update",
        description: `Ride status changed to ${newStatus.replace('_', ' ')}`,
      })
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to update status. Please check your connection.",
        variant: "destructive"
      })
    }
  }
}
