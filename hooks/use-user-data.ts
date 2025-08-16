import { useState, useEffect, useCallback } from "react"
import { useSocket } from "./use-socket"
import { User, Booking, Partnership } from "../lib/database-client"
import { PerformanceMonitor } from "../lib/performance"

interface UserDataState {
  ongoingRides: Booking[]
  currentPartners: Partnership[]
  availablePartners: User[]
  loading: {
    ongoingRides: boolean
    currentPartners: boolean
    availablePartners: boolean
  }
  error: {
    ongoingRides: string | null
    currentPartners: string | null
    availablePartners: string | null
  }
}

export function useUserData(userId: string, userType: 'company' | 'vendor') {
  const { socket, isConnected } = useSocket()
  const [data, setData] = useState<UserDataState>({
    ongoingRides: [],
    currentPartners: [],
    availablePartners: [],
    loading: {
      ongoingRides: false,
      currentPartners: false,
      availablePartners: false
    },
    error: {
      ongoingRides: null,
      currentPartners: null,
      availablePartners: null
    }
  })

  // Fetch ongoing rides
  const fetchOngoingRides = useCallback(async () => {
    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, ongoingRides: true },
      error: { ...prev.error, ongoingRides: null }
    }))

    try {
      if (isConnected && socket) {
        // Try real-time first
        socket.emit("get_user_ongoing_rides", { userId, userType })
        
        // Set a timeout for real-time response
        setTimeout(() => {
          setData(prev => {
            if (prev.loading.ongoingRides) {
              // If still loading, fallback to API
              fetchOngoingRidesAPI()
            }
            return prev
          })
        }, 3000)
      } else {
        // Fallback to API
        await fetchOngoingRidesAPI()
      }
    } catch (error) {
      console.error("Error in fetchOngoingRides:", error)
      await fetchOngoingRidesAPI()
    }
  }, [isConnected, socket, userId, userType])

  // API fallback for ongoing rides
  const fetchOngoingRidesAPI = useCallback(async () => {
    try {
      await PerformanceMonitor.measure(`fetchOngoingRides-${userType}-${userId}`, async () => {
        const response = await fetch(`/api/users/${userId}/ongoing-rides?userType=${userType}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        setData(prev => ({
          ...prev,
          ongoingRides: result.ongoingRides || [],
          loading: { ...prev.loading, ongoingRides: false }
        }))
      })
    } catch (error) {
      console.error("Error fetching ongoing rides from API:", error)
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, ongoingRides: false },
        error: { ...prev.error, ongoingRides: error instanceof Error ? error.message : "Failed to fetch ongoing rides" }
      }))
    }
  }, [userId, userType])

  // Fetch current partners
  const fetchCurrentPartners = useCallback(async () => {
    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, currentPartners: true },
      error: { ...prev.error, currentPartners: null }
    }))

    try {
      if (isConnected && socket) {
        // Try real-time first
        socket.emit("get_user_current_partners", { userId, userType })
        
        // Set a timeout for real-time response
        setTimeout(() => {
          setData(prev => {
            if (prev.loading.currentPartners) {
              // If still loading, fallback to API
              fetchCurrentPartnersAPI()
            }
            return prev
          })
        }, 3000)
      } else {
        // Fallback to API
        await fetchCurrentPartnersAPI()
      }
    } catch (error) {
      console.error("Error in fetchCurrentPartners:", error)
      await fetchCurrentPartnersAPI()
    }
  }, [isConnected, socket, userId, userType])

  // API fallback for current partners
  const fetchCurrentPartnersAPI = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/current-partners?userType=${userType}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setData(prev => ({
        ...prev,
        currentPartners: result.partnerships || [],
        loading: { ...prev.loading, currentPartners: false }
      }))
    } catch (error) {
      console.error("Error fetching current partners from API:", error)
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, currentPartners: false },
        error: { ...prev.error, currentPartners: error instanceof Error ? error.message : "Failed to fetch current partners" }
      }))
    }
  }, [userId, userType])

  // Fetch available partners
  const fetchAvailablePartners = useCallback(async () => {
    setData(prev => ({
      ...prev,
      loading: { ...prev.loading, availablePartners: true },
      error: { ...prev.error, availablePartners: null }
    }))

    try {
      if (isConnected && socket) {
        // Try real-time first
        socket.emit("get_user_available_partners", { userId, userType })
        
        // Set a timeout for real-time response
        setTimeout(() => {
          setData(prev => {
            if (prev.loading.availablePartners) {
              // If still loading, fallback to API
              fetchAvailablePartnersAPI()
            }
            return prev
          })
        }, 3000)
      } else {
        // Fallback to API
        await fetchAvailablePartnersAPI()
      }
    } catch (error) {
      console.error("Error in fetchAvailablePartners:", error)
      await fetchAvailablePartnersAPI()
    }
  }, [isConnected, socket, userId, userType])

  // API fallback for available partners
  const fetchAvailablePartnersAPI = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/available-partners?userType=${userType}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setData(prev => ({
        ...prev,
        availablePartners: result.availablePartners || [],
        loading: { ...prev.loading, availablePartners: false }
      }))
    } catch (error) {
      console.error("Error fetching available partners from API:", error)
      setData(prev => ({
        ...prev,
        loading: { ...prev.loading, availablePartners: false },
        error: { ...prev.error, availablePartners: error instanceof Error ? error.message : "Failed to fetch available partners" }
      }))
    }
  }, [userId, userType])

  // Create new partnership
  const createPartnership = useCallback(async (partnerId: string) => {
    console.log('createPartnership called with partnerId:', partnerId)
    console.log('isConnected:', isConnected, 'socket:', !!socket)
    
    // Force API usage for debugging - temporarily disable socket
    if (true) { // !isConnected || !socket) {
      // Fallback to API if socket not available
      console.log('Using API fallback for partnership creation')
      try {
        const partnershipData = {
          companyId: userType === 'company' ? userId : partnerId,
          vendorId: userType === 'vendor' ? userId : partnerId,
        }
        console.log('Sending partnership data to API:', partnershipData)
        
        const response = await fetch('/api/partnerships', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partnershipData),
        })

        console.log('API response status:', response.status)
        const responseData = await response.json()
        console.log('API response data:', responseData)

        if (response.ok) {
          // Refresh data after successful creation
          console.log('Partnership created successfully, refreshing data...')
          fetchCurrentPartners()
          fetchAvailablePartners()
          return true
        } else {
          console.error('Partnership creation failed:', responseData)
          throw new Error(responseData.error || 'Failed to create partnership')
        }
      } catch (error) {
        console.error("Error creating partnership via API:", error)
        return false
      }
    }
    
    // This code path is currently disabled for debugging
    if (socket && isConnected) {
      try {
        console.log('Using socket for partnership creation')
        const partnershipData = userType === 'company' 
          ? { companyId: userId, vendorId: partnerId, requesterId: userId }
          : { companyId: partnerId, vendorId: userId, requesterId: userId }
        
        console.log('Emitting create_partnership with data:', partnershipData)
        socket!.emit("create_partnership", partnershipData)
        return true
      } catch (error) {
        console.error("Error creating partnership:", error)
        return false
      }
    }
    
    return false
  }, [isConnected, socket, userId, userType, fetchCurrentPartners, fetchAvailablePartners])

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleOngoingRides = (ridesData: any) => {
      if (ridesData.userId === userId) {
        setData(prev => ({
          ...prev,
          ongoingRides: ridesData.ongoingRides || [],
          loading: { ...prev.loading, ongoingRides: false }
        }))
      }
    }

    const handleCurrentPartners = (partnersData: any) => {
      if (partnersData.userId === userId) {
        setData(prev => ({
          ...prev,
          currentPartners: partnersData.partnerships || [],
          loading: { ...prev.loading, currentPartners: false }
        }))
      }
    }

    const handleAvailablePartners = (partnersData: any) => {
      if (partnersData.userId === userId) {
        setData(prev => ({
          ...prev,
          availablePartners: partnersData.availablePartners || [],
          loading: { ...prev.loading, availablePartners: false }
        }))
      }
    }

    const handlePartnershipCreated = (partnershipData: any) => {
      // Refresh data when new partnership is created
      fetchCurrentPartners()
      fetchAvailablePartners()
    }

    const handleRideStatusUpdate = (updateData: any) => {
      // Update ongoing rides when status changes
      setData(prev => ({
        ...prev,
        ongoingRides: prev.ongoingRides.map(ride => 
          ride.id === updateData.bookingId 
            ? { ...ride, status: updateData.status }
            : ride
        )
      }))
    }

    socket.on("user_ongoing_rides", handleOngoingRides)
    socket.on("user_current_partners", handleCurrentPartners)
    socket.on("user_available_partners", handleAvailablePartners)
    socket.on("partnership_created", handlePartnershipCreated)
    socket.on("ride_status_updated", handleRideStatusUpdate)

    return () => {
      socket.off("user_ongoing_rides", handleOngoingRides)
      socket.off("user_current_partners", handleCurrentPartners)
      socket.off("user_available_partners", handleAvailablePartners)
      socket.off("partnership_created", handlePartnershipCreated)
      socket.off("ride_status_updated", handleRideStatusUpdate)
    }
  }, [socket, userId, fetchCurrentPartners, fetchAvailablePartners])

  // Initial data load
  useEffect(() => {
    if (isConnected) {
      fetchOngoingRides()
      fetchCurrentPartners()
      fetchAvailablePartners()
    }
  }, [isConnected, fetchOngoingRides, fetchCurrentPartners, fetchAvailablePartners])

  return {
    ...data,
    refresh: {
      ongoingRides: fetchOngoingRides,
      currentPartners: fetchCurrentPartners,
      availablePartners: fetchAvailablePartners,
      all: () => {
        fetchOngoingRides()
        fetchCurrentPartners()
        fetchAvailablePartners()
      }
    },
    createPartnership
  }
}
