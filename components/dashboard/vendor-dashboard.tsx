"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, LogOut, MapPin, Clock, Users, DollarSign, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react"
import { RidesTable } from "@/components/dashboard/rides-table"
import { BookingRequestsSection } from "@/components/dashboard/booking-requests-section"
import { OngoingRidesSection } from "@/components/dashboard/ongoing-rides-section"
import { CurrentPartnersSection } from "@/components/dashboard/current-partners-section"
import { AvailablePartnersSection } from "@/components/dashboard/available-partners-section"
import { useRouter } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import { useUserData } from "@/hooks/use-user-data"
import { useAuth } from "@/lib/auth-context"
import { Booking } from "@/lib/database-client"
import SocketService from "@/lib/socket"

export function VendorDashboard() {
  const [allRides, setAllRides] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isConnected, connect } = useSocket()
  const { user, signOut } = useAuth()
  const userData = useUserData(user?.id || "", 'vendor')

  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!user) {
      router.push("/auth/vendor/login")
      return
    }
    
    if (user.user_type !== "vendor") {
      router.push("/auth/vendor/login")
      return
    }
  }, [user, router])

  useEffect(() => {
    if (user?.id && !isConnected) {
      console.log("  Vendor dashboard connecting to socket...")
      connect("vendor", user.id)
    }
  }, [isConnected, connect, user?.id])

  // Fetch all rides for the vendor
  const fetchAllRides = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/bookings?vendorId=${user.id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      
      setAllRides(result.bookings || [])
    } catch (error) {
      console.error("Error fetching rides:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch rides")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (isConnected) {
      const socketService = SocketService.getInstance()
      const socket = socketService.getSocket()

      if (socket) {
        const handleBookingAcceptanceConfirmed = (data: any) => {
          console.log("  Booking acceptance confirmed:", data)
          // Immediately add the booking to ongoing rides if we have the data
          if (data.bookingId) {
            setAllRides(prev => prev.map(ride => 
              ride.id === data.bookingId 
                ? { ...ride, status: "accepted", vendor_id: user?.id }
                : ride
            ))
          }
          // Refresh ongoing rides when vendor accepts a booking
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        const handleBookingStatusUpdate = (data: any) => {
          console.log("  Booking status update received:", data)
          // Immediately update the booking status if we have the data
          if (data.bookingId && data.status) {
            setAllRides(prev => prev.map(ride => 
              ride.id === data.bookingId 
                ? { ...ride, status: data.status, updated_at: new Date().toISOString() }
                : ride
            ))
          }
          // Refresh data when booking status changes
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        const handleOngoingRidesUpdated = (data: any) => {
          console.log("  [Vendor Dashboard] Ongoing rides updated:", data)
          // Refresh ongoing rides when updates occur
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        const handleRideStatusUpdated = (data: any) => {
          console.log("  [Vendor Dashboard] Ride status updated:", data)
          // Update local state immediately if we have the booking data
          if (data.bookingId && data.status) {
            console.log("  [Vendor Dashboard] Updating ride status:", data.bookingId, "to", data.status)
            setAllRides(prev => prev.map(ride => 
              ride.id === data.bookingId 
                ? { ...ride, status: data.status, updated_at: new Date().toISOString() }
                : ride
            ))
          }
          // Refresh data when ride status changes
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        socket.on("booking_acceptance_confirmed", handleBookingAcceptanceConfirmed)
        socket.on("booking_status_update", handleBookingStatusUpdate)
        socket.on("ongoing_rides_updated", handleOngoingRidesUpdated)
        socket.on("ride_status_updated", handleRideStatusUpdated)

        return () => {
          socket.off("booking_acceptance_confirmed", handleBookingAcceptanceConfirmed)
          socket.off("booking_status_update", handleBookingStatusUpdate)
          socket.off("ongoing_rides_updated", handleOngoingRidesUpdated)
          socket.off("ride_status_updated", handleRideStatusUpdated)
        }
      }
    }
  }, [isConnected, userData.refresh, fetchAllRides])

  useEffect(() => {
    if (user?.id) {
      fetchAllRides()
    }
  }, [fetchAllRides, user?.id])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const handleRefresh = () => {
    fetchAllRides()
  }

  // Show loading if user data is not ready
  if (!user || user.user_type !== "vendor") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Filter rides by status
  const ongoingRides = allRides.filter(ride => ride.status === 'in_progress')
  const completedRides = allRides.filter(ride => ride.status === 'completed')
  const cancelledRides = allRides.filter(ride => ride.status === 'cancelled')

  // Filter today's rides
  const today = new Date().toDateString()
  const todaysRides = allRides.filter(ride => 
    ride.created_at && new Date(ride.created_at).toDateString() === today
  )

  // Calculate earnings
  const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.price || 0), 0)
  const todaysEarnings = todaysRides
    .filter(ride => ride.status === 'completed')
    .reduce((sum, ride) => sum + (ride.price || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Vendor Dashboard
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{user.vendor_name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Error loading data</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{ongoingRides.length}</div>
              <p className="text-xs text-muted-foreground">Currently handling</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Rides</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysRides.length}</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.currentPartners.length}</div>
              <p className="text-xs text-muted-foreground">Company partnerships</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${todaysEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From completed rides</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="requests">Booking Requests</TabsTrigger>
            <TabsTrigger value="rides">My Rides</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <BookingRequestsSection vendorId={user.id} />
          </TabsContent>

          <TabsContent value="rides" className="space-y-6">
            <div className="grid gap-6">
              {/* Ongoing Rides */}
              <OngoingRidesSection userId={user.id} userType="vendor" />

              {/* Completed Rides */}
              {completedRides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Completed Rides ({completedRides.length})
                    </CardTitle>
                    <CardDescription>Successfully completed rides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RidesTable rides={completedRides} type="completed" />
                  </CardContent>
                </Card>
              )}

              {/* Cancelled Rides */}
              {cancelledRides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Cancelled Rides ({cancelledRides.length})
                    </CardTitle>
                    <CardDescription>Rides that were cancelled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RidesTable rides={cancelledRides} type="cancelled" />
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading rides...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!loading && !error && allRides.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No rides assigned yet</p>
                      <p className="text-muted-foreground">Check the booking requests for new opportunities</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="grid gap-6">
              <CurrentPartnersSection userId={user.id} userType="vendor" />
              <AvailablePartnersSection userId={user.id} userType="vendor" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
