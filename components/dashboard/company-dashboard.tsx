"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Building2, LogOut, Calendar, MapPin, Clock, Users, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { RidesTable } from "@/components/dashboard/rides-table"
import { CreateBookingDialog } from "@/components/dashboard/create-booking-dialog"
import { OngoingRidesSection } from "@/components/dashboard/ongoing-rides-section"
import { CurrentPartnersSection } from "@/components/dashboard/current-partners-section"
import { AvailablePartnersSection } from "@/components/dashboard/available-partners-section"
import { useRouter } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import { useUserData } from "@/hooks/use-user-data"
import { useAuth } from "@/lib/auth-context"
import { Booking } from "@/lib/database-client"
import { PerformanceMonitor } from "@/lib/performance"
import SocketService from "@/lib/socket"

export function CompanyDashboard() {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [allRides, setAllRides] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isConnected, connect } = useSocket()
  const { user, signOut } = useAuth()
  const userData = useUserData(user?.id || "", 'company')

  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!user) {
      router.push("/auth/company/login")
      return
    }
    
    if (user.user_type !== "company") {
      router.push("/auth/company/login")
      return
    }
  }, [user, router])

  useEffect(() => {
    if (user?.id && !isConnected) {
      console.log("  Company dashboard connecting to socket...")
      connect("company", user.id)
    }
  }, [isConnected, connect, user?.id])

  // Fetch all rides for the company
  const fetchAllRides = useCallback(async () => {
    if (!user?.id) return

    await PerformanceMonitor.measure(`fetchAllRides-company-${user.id}`, async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/bookings?companyId=${user.id}`)
        
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
    })
  }, [user?.id])

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (isConnected) {
      const socketService = SocketService.getInstance()
      const socket = socketService.getSocket()

      if (socket) {
        const handleBookingStatusUpdate = (data: any) => {
          console.log("  Booking status update received:", data)
          // Refresh ongoing rides and all rides when status changes
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        const handleNewBookingRequest = (data: any) => {
          console.log("  New booking request received:", data)
          // Refresh data when new requests come in
          userData.refresh.ongoingRides()
          fetchAllRides()
        }

        socket.on("booking_status_update", handleBookingStatusUpdate)
        socket.on("new_booking_request", handleNewBookingRequest)

        return () => {
          socket.off("booking_status_update", handleBookingStatusUpdate)
          socket.off("new_booking_request", handleNewBookingRequest)
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
  if (!user || user.user_type !== "company") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Categorize rides by status
  const ongoingRides = allRides.filter(ride => ['accepted', 'in_progress'].includes(ride.status))
  const completedRides = allRides.filter(ride => ride.status === 'completed')
  const cancelledRides = allRides.filter(ride => ride.status === 'cancelled')
  const pendingRides = allRides.filter(ride => ride.status === 'pending')

  // Calculate today's rides
  const today = new Date().toDateString()
  const todaysRides = allRides.filter(ride => 
    ride.created_at && new Date(ride.created_at).toDateString() === today
  )

  // Calculate success rate
  const totalCompletedRides = allRides.filter(ride => 
    ['completed', 'cancelled'].includes(ride.status)
  ).length
  const successRate = totalCompletedRides > 0 
    ? ((completedRides.length / totalCompletedRides) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Company Dashboard
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{user.company_name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsBookingDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create New Booking
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <Clock className="mr-2 h-4 w-4" />
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
              <CardTitle className="text-sm font-medium">Ongoing Rides</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{ongoingRides.length}</div>
              <p className="text-xs text-muted-foreground">Active right now</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Rides</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysRides.length}</div>
              <p className="text-xs text-muted-foreground">Completed + Ongoing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.currentPartners.length}</div>
              <p className="text-xs text-muted-foreground">Vendor partnerships</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{successRate}%</div>
              <p className="text-xs text-muted-foreground">Ride completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rides" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="rides">Ride Management</TabsTrigger>
            <TabsTrigger value="partners">Partners & Vendors</TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-6">
            <div className="grid gap-6">
              {/* Ongoing Rides */}
              <OngoingRidesSection userId={user.id} userType="company" />

              {/* Pending Rides */}
              {pendingRides.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Pending Rides ({pendingRides.length})
                    </CardTitle>
                    <CardDescription>Rides waiting for vendor acceptance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RidesTable rides={pendingRides} type="pending" />
                  </CardContent>
                </Card>
              )}

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
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No rides yet</p>
                      <p className="text-muted-foreground">Create your first booking to get started</p>
                      <Button 
                        onClick={() => setIsBookingDialogOpen(true)} 
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="grid gap-6">
              <CurrentPartnersSection userId={user.id} userType="company" />
              <AvailablePartnersSection userId={user.id} userType="company" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateBookingDialog 
        open={isBookingDialogOpen} 
        onOpenChange={setIsBookingDialogOpen} 
        companyId={user.id}
        companyName={user.company_name || user.email}
      />
    </div>
  )
}
