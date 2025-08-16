"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, LogOut, MapPin, Clock, Users, DollarSign, Wifi, WifiOff } from "lucide-react"
import { RidesTable } from "@/components/dashboard/rides-table"
import { BookingRequestsSection } from "@/components/dashboard/booking-requests-section"
import { OngoingRidesSection } from "@/components/dashboard/ongoing-rides-section"
import { CurrentPartnersSection } from "@/components/dashboard/current-partners-section"
import { AvailablePartnersSection } from "@/components/dashboard/available-partners-section"
import { useRouter } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import { useUserData } from "@/hooks/use-user-data"
import { Booking } from "@/lib/database-client"

interface VendorDashboardProps {
  userId?: string
  vendorName?: string
}

export function VendorDashboard({ userId = "vendor_001", vendorName = "Swift Transport" }: VendorDashboardProps) {
  const [allRides, setAllRides] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isConnected, connect } = useSocket()
  const userData = useUserData(userId, 'vendor')

  useEffect(() => {
    if (!isConnected) {
      console.log("  Vendor dashboard connecting to socket...")
      connect("vendor", userId)
    }
  }, [isConnected, connect, userId])

  // Fetch all rides for the vendor
  useEffect(() => {
    const fetchAllRides = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/bookings?vendorId=${userId}`)
        if (response.ok) {
          const result = await response.json()
          setAllRides(result.bookings || [])
        }
      } catch (error) {
        console.error("Error fetching rides:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllRides()
  }, [userId])

  const handleLogout = () => {
    router.push("/")
  }

  // Filter rides by status
  const ongoingRides = allRides.filter(ride => ride.status === 'in_progress')
  const completedRides = allRides.filter(ride => ride.status === 'completed')
  const cancelledRides = allRides.filter(ride => ride.status === 'cancelled')

  // Filter today's rides
  const today = new Date().toDateString()
  const todaysRides = allRides.filter(ride => 
    new Date(ride.created_at).toDateString() === today
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
              <p className="text-sm text-muted-foreground">{vendorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
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
            <BookingRequestsSection />
          </TabsContent>

          <TabsContent value="rides" className="space-y-6">
            <div className="grid gap-6">
              {/* Ongoing Rides */}
              <OngoingRidesSection userId={userId} userType="vendor" />

              {completedRides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Rides</CardTitle>
                    <CardDescription>Successfully completed rides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RidesTable rides={completedRides} type="completed" />
                  </CardContent>
                </Card>
              )}

              {cancelledRides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cancelled Rides</CardTitle>
                    <CardDescription>Rides that were cancelled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RidesTable rides={cancelledRides} type="cancelled" />
                  </CardContent>
                </Card>
              )}

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

              {!loading && allRides.length === 0 && (
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
              <CurrentPartnersSection userId={userId} userType="vendor" />
              <AvailablePartnersSection userId={userId} userType="vendor" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
