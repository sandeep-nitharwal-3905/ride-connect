"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { MapPin, User, Clock, Loader2, Wifi, WifiOff, Plus } from "lucide-react"
import SocketService from "@/lib/socket"

interface CreateBookingDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  companyId?: string
  companyName?: string
  onBookingCreated?: () => void
}

export function CreateBookingDialog({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange, 
  companyId = "company_001", 
  companyName = "Your Company",
  onBookingCreated
}: CreateBookingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerPhone: "",
    pickupLocation: "",
    destination: "",
    scheduledTime: "",
    vehicleType: "",
    specialRequests: "",
  })
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const onOpenChange = externalOnOpenChange || setInternalOpen
  const { toast } = useToast()
  const { isConnected, connect } = useSocket()

  useEffect(() => {
    if (!isConnected) {
      connect("company", companyId)
    }
  }, [isConnected, connect, companyId])

  useEffect(() => {
    const socketService = SocketService.getInstance()
    const socket = socketService.getSocket()

    if (socket) {
      const handleBookingRequestCreated = (data: { requestId: string; status: string }) => {
        console.log("  Booking request created:", data)
        setIsLoading(false) // Reset loading state

        toast({
          title: "Booking Request Sent!",
          description: `Your booking request (ID: ${data.requestId}) has been sent to partner vendors.`,
        })
        onOpenChange(false)
        
        // Call the callback to refresh parent component
        if (onBookingCreated) {
          onBookingCreated()
        }
      }

      const handleBookingStatusUpdate = (data: { requestId: string; status: string; vendorId?: string }) => {
        console.log("  Booking status update received:", data)
        
        if (data.status === "accepted") {
          toast({
            title: "Booking Accepted!",
            description: `Your booking request has been accepted by a vendor.`,
          })
        }
      }

      const handleBookingError = (data: { message: string }) => {
        console.log("  Booking error received:", data)
        setIsLoading(false)
        toast({
          title: "Booking Error",
          description: data.message,
          variant: "destructive",
        })
      }

      socket.on("booking_request_created", handleBookingRequestCreated)
      socket.on("booking_status_update", handleBookingStatusUpdate)
      socket.on("booking_error", handleBookingError)

      return () => {
        socket.off("booking_request_created", handleBookingRequestCreated)
        socket.off("booking_status_update", handleBookingStatusUpdate)
        socket.off("booking_error", handleBookingError)
      }
    }
  }, [toast, onOpenChange])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const socketService = SocketService.getInstance()

      if (!isConnected) {
        throw new Error("Not connected to real-time service")
      }

      // Calculate estimated fare based on distance and vehicle type
      const calculateFare = (vehicleType: string, pickupLocation: string, destination: string) => {
        // Base fare calculation (in a real app, this would use actual distance calculation)
        const baseFares = {
          'standard': 15,
          'premium': 25,
          'luxury': 35,
          'suv': 30
        }
        
        const baseFare = baseFares[vehicleType as keyof typeof baseFares] || 15
        
        // Distance estimation based on route complexity for initial pricing
        const estimatedDistance = Math.max(1, (pickupLocation.length + destination.length) / 20)
        const distanceFare = estimatedDistance * 2
        
        return (baseFare + distanceFare).toFixed(2)
      }

      const bookingData = {
        ...formData,
        companyId: companyId,
        companyName: companyName,
        estimatedFare: "$" + calculateFare(formData.vehicleType, formData.pickupLocation, formData.destination),
        urgency: "normal",
      }

      console.log("  Creating booking request:", bookingData)
      socketService.createBookingRequest(bookingData)

      // Set a timeout to prevent loading state from getting stuck
      setTimeout(() => {
        if (isLoading) {
          console.log("  Booking request timeout - resetting loading state")
          setIsLoading(false)
          toast({
            title: "Request Timeout",
            description: "The booking request may still be processing. Please check your bookings.",
            variant: "destructive",
          })
        }
      }, 10000) // 10 second timeout

      // Reset form
      setFormData({
        passengerName: "",
        passengerPhone: "",
        pickupLocation: "",
        destination: "",
        scheduledTime: "",
        vehicleType: "",
        specialRequests: "",
      })
      
      // Note: Loading state will be reset by socket response or timeout
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking request",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const TriggerButton = () => (
    <Button onClick={() => onOpenChange(true)} className="bg-primary hover:bg-primary/90">
      <Plus className="mr-2 h-4 w-4" />
      Book a Ride
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!externalOpen && <DialogTrigger asChild><TriggerButton /></DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Booking Request
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            Fill out the details below to request a ride from your partner vendors.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passengerName">
                  <User className="inline h-4 w-4 mr-2" />
                  Passenger Name
                </Label>
                <Input
                  id="passengerName"
                  placeholder="Enter passenger name"
                  value={formData.passengerName}
                  onChange={(e) => handleInputChange("passengerName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengerPhone">Phone Number</Label>
                <Input
                  id="passengerPhone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.passengerPhone}
                  onChange={(e) => handleInputChange("passengerPhone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation">
                <MapPin className="inline h-4 w-4 mr-2" />
                Pickup Location
              </Label>
              <Input
                id="pickupLocation"
                placeholder="Enter pickup address"
                value={formData.pickupLocation}
                onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">
                <MapPin className="inline h-4 w-4 mr-2" />
                Destination
              </Label>
              <Input
                id="destination"
                placeholder="Enter destination address"
                value={formData.destination}
                onChange={(e) => handleInputChange("destination", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">
                  <Clock className="inline h-4 w-4 mr-2" />
                  Scheduled Time
                </Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special requirements or notes..."
                value={formData.specialRequests}
                onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isConnected}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Booking Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
