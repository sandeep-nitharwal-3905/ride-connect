import { supabase } from "./supabase/client"

export interface User {
  id: string
  email: string
  user_type: "company" | "vendor"
  company_name?: string
  vendor_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  company_id: string
  vendor_id?: string
  pickup_location: string
  dropoff_location: string
  pickup_time: string
  passenger_count: number
  special_requirements?: string
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "in_progress"
  price?: number
  current_location?: string
  created_at: string
  updated_at: string
  company?: User
  vendor?: User
}

export interface Partnership {
  id: string
  company_id: string
  vendor_id: string
  status: "active" | "inactive"
  created_at: string
  company?: User
  vendor?: User
}

// Client-side database operations
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserByEmail:", error)
    return null
  }
}

export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").insert(userData).select().single()

    if (error) {
      console.error("Error creating user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createUser:", error)
    return null
  }
}

export async function getBookingsByCompany(companyId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching company bookings:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getBookingsByCompany:", error)
    return []
  }
}

export async function getBookingsByVendor(vendorId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        company:users!bookings_company_id_fkey(id, company_name, email)
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching vendor bookings:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getBookingsByVendor:", error)
    return []
  }
}

export async function createBooking(bookingData: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<Booking | null> {
  try {
    const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

    if (error) {
      console.error("Error creating booking:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createBooking:", error)
    return null
  }
}

export async function updateBookingStatus(bookingId: string, status: Booking["status"], vendorId?: string): Promise<boolean> {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (vendorId) {
      updateData.vendor_id = vendorId
    }

    const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

    if (error) {
      console.error("Error updating booking status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateBookingStatus:", error)
    return false
  }
}

export async function getPartnershipsByCompany(companyId: string): Promise<Partnership[]> {
  try {
    const { data, error } = await supabase
      .from("partnerships")
      .select(`
        *,
        vendor:users!partnerships_vendor_id_fkey(id, vendor_name, email)
      `)
      .eq("company_id", companyId)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching company partnerships:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPartnershipsByCompany:", error)
    return []
  }
}

export async function getPartnershipsByVendor(vendorId: string): Promise<Partnership[]> {
  try {
    const { data, error } = await supabase
      .from("partnerships")
      .select(`
        *,
        company:users!partnerships_company_id_fkey(id, company_name, email)
      `)
      .eq("vendor_id", vendorId)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching vendor partnerships:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPartnershipsByVendor:", error)
    return []
  }
}

export async function getPendingBookingsByVendor(vendorId: string): Promise<Booking[]> {
  try {
    // Get partnerships first to find which companies this vendor works with
    const partnerships = await getPartnershipsByVendor(vendorId)
    
    if (partnerships.length === 0) {
      return []
    }

    const companyIds = partnerships.map(p => p.company_id)

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        company:users!bookings_company_id_fkey(id, company_name, email)
      `)
      .in("company_id", companyIds)
      .is("vendor_id", null)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching pending bookings:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPendingBookingsByVendor:", error)
    return []
  }
}

export async function createPartnership(companyId: string, vendorId: string): Promise<Partnership | null> {
  try {
    const { data, error } = await supabase
      .from("partnerships")
      .insert({
        company_id: companyId,
        vendor_id: vendorId,
        status: "active"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating partnership:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createPartnership:", error)
    return null
  }
}

export async function getAllVendors(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", "vendor")
      .order("vendor_name", { ascending: true })

    if (error) {
      console.error("Error fetching vendors:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllVendors:", error)
    return []
  }
}

export async function getAllCompanies(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", "company")
      .order("company_name", { ascending: true })

    if (error) {
      console.error("Error fetching companies:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllCompanies:", error)
    return []
  }
}

export async function getPartnerVendorsForCompany(companyId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from("partnerships")
      .select(`
        vendor:users!partnerships_vendor_id_fkey(*)
      `)
      .eq("company_id", companyId)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching partner vendors:", error)
      return []
    }

    return data?.map((p: any) => p.vendor).filter(Boolean) || []
  } catch (error) {
    console.error("Error in getPartnerVendorsForCompany:", error)
    return []
  }
}

// Get ongoing rides for a specific user (company or vendor)
export async function getOngoingRidesForUser(userId: string, userType: 'company' | 'vendor'): Promise<Booking[]> {
  try {
    let query = supabase
      .from("bookings")
      .select(`
        *,
        company:users!bookings_company_id_fkey(id, company_name, email),
        vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)
      `)
      .in("status", ["accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(50)

    if (userType === 'company') {
      query = query.eq("company_id", userId)
    } else {
      query = query.eq("vendor_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching ongoing rides:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getOngoingRidesForUser:", error)
    return []
  }
}

// Get available vendors that a company can partner with (not already partnered)
export async function getAvailableVendorsForPartnership(companyId: string): Promise<User[]> {
  try {
    // Get current partner vendor IDs
    const { data: partnerships } = await supabase
      .from("partnerships")
      .select("vendor_id")
      .eq("company_id", companyId)
      .eq("status", "active")

    const partnerVendorIds = partnerships?.map((p: any) => p.vendor_id) || []

    // Get all vendors not in the partnership list
    let query = supabase
      .from("users")
      .select("*")
      .eq("user_type", "vendor")
      .order("vendor_name", { ascending: true })

    if (partnerVendorIds.length > 0) {
      query = query.not("id", "in", `(${partnerVendorIds.join(",")})`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching available vendors:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAvailableVendorsForPartnership:", error)
    return []
  }
}

// Get available companies that a vendor can partner with (not already partnered)
export async function getAvailableCompaniesForPartnership(vendorId: string): Promise<User[]> {
  try {
    // Get current partner company IDs
    const { data: partnerships } = await supabase
      .from("partnerships")
      .select("company_id")
      .eq("vendor_id", vendorId)
      .eq("status", "active")

    const partnerCompanyIds = partnerships?.map((p: any) => p.company_id) || []

    // Get all companies not in the partnership list
    let query = supabase
      .from("users")
      .select("*")
      .eq("user_type", "company")
      .order("company_name", { ascending: true })

    if (partnerCompanyIds.length > 0) {
      query = query.not("id", "in", `(${partnerCompanyIds.join(",")})`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching available companies:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAvailableCompaniesForPartnership:", error)
    return []
  }
}

// Update ride status (for real-time updates)
export async function updateRideStatus(
  bookingId: string, 
  newStatus: Booking["status"], 
  location?: string
): Promise<boolean> {
  try {
    const updateData: any = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    }
    
    // Add location tracking for in-progress rides
    if (location && newStatus === "in_progress") {
      updateData.current_location = location
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)

    if (error) {
      console.error("Error updating ride status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateRideStatus:", error)
    return false
  }
}
