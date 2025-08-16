import { createSupabaseServerClient } from "./supabase/server"

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

// Database operations
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data
}

export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("users").insert(userData).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  return data
}

export async function getBookingsByCompany(companyId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient()
  
  // Try with current_location first, fallback if column doesn't exist
  let selectFields = `
    id,
    company_id,
    vendor_id,
    pickup_location,
    dropoff_location,
    pickup_time,
    passenger_count,
    special_requirements,
    status,
    price,
    current_location,
    created_at,
    updated_at,
    vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)
  `
  
  let { data, error } = await supabase
    .from("bookings")
    .select(selectFields)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100)

  // If current_location column doesn't exist, retry without it
  if (error && error.message?.includes('current_location does not exist')) {
    console.log("current_location column not found, retrying without it...")
    selectFields = `
      id,
      company_id,
      vendor_id,
      pickup_location,
      dropoff_location,
      pickup_time,
      passenger_count,
      special_requirements,
      status,
      price,
      created_at,
      updated_at,
      vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)
    `
    
    const retry = await supabase
      .from("bookings")
      .select(selectFields)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100)
      
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error("Error fetching company bookings:", error)
    return []
  }

  return data || []
}

export async function getBookingsByVendor(vendorId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient()
  
  // Try with current_location first, fallback if column doesn't exist
  let selectFields = `
    id,
    company_id,
    vendor_id,
    pickup_location,
    dropoff_location,
    pickup_time,
    passenger_count,
    special_requirements,
    status,
    price,
    current_location,
    created_at,
    updated_at,
    company:users!bookings_company_id_fkey(id, company_name, email)
  `
  
  let { data, error } = await supabase
    .from("bookings")
    .select(selectFields)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(100)

  // If current_location column doesn't exist, retry without it
  if (error && error.message?.includes('current_location does not exist')) {
    console.log("current_location column not found, retrying without it...")
    selectFields = `
      id,
      company_id,
      vendor_id,
      pickup_location,
      dropoff_location,
      pickup_time,
      passenger_count,
      special_requirements,
      status,
      price,
      created_at,
      updated_at,
      company:users!bookings_company_id_fkey(id, company_name, email)
    `
    
    const retry = await supabase
      .from("bookings")
      .select(selectFields)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(100)
      
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error("Error fetching vendor bookings:", error)
    return []
  }

  return data || []
}

export async function getPendingBookingsForVendor(vendorId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient()

  // Get partnerships first to find which companies this vendor works with
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select("company_id")
    .eq("vendor_id", vendorId)
    .eq("status", "active")

  if (!partnerships || partnerships.length === 0) {
    return []
  }

  const companyIds = partnerships.map((p: any) => p.company_id)

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      company:users!bookings_company_id_fkey(*)
    `)
    .in("company_id", companyIds)
    .eq("status", "pending")
    .is("vendor_id", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending bookings:", error)
    return []
  }

  return data || []
}

export async function getPartnershipsByCompany(companyId: string): Promise<Partnership[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("partnerships")
    .select(`
      *,
      vendor:users!partnerships_vendor_id_fkey(*)
    `)
    .eq("company_id", companyId)
    .eq("status", "active")

  if (error) {
    console.error("Error fetching company partnerships:", error)
    return []
  }

  return data || []
}

export async function getPartnershipsByVendor(vendorId: string): Promise<Partnership[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("partnerships")
    .select(`
      *,
      company:users!partnerships_company_id_fkey(*)
    `)
    .eq("vendor_id", vendorId)
    .eq("status", "active")

  if (error) {
    console.error("Error fetching vendor partnerships:", error)
    return []
  }

  return data || []
}

export async function createBooking(
  bookingData: Omit<Booking, "id" | "created_at" | "updated_at">,
): Promise<Booking | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("bookings").insert(bookingData).select().single()

  if (error) {
    console.error("Error creating booking:", error)
    return null
  }

  return data
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"],
  vendorId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const updateData: any = { status, updated_at: new Date().toISOString() }
  if (vendorId) {
    updateData.vendor_id = vendorId
  }

  const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

  if (error) {
    console.error("Error updating booking status:", error)
    return false
  }

  return true
}

export async function createPartnership(companyId: string, vendorId: string): Promise<Partnership | null> {
  const supabase = await createSupabaseServerClient()
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
}

export async function getPartnerVendorsForCompany(companyId: string): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
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
}

export async function getAllVendors(): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
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
}

export async function getAllCompanies(): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
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
}

// Get ongoing rides for a specific user (company or vendor) - OPTIMIZED
export async function getOngoingRidesForUser(userId: string, userType: 'company' | 'vendor'): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from("bookings")
    .select(`
      id,
      company_id,
      vendor_id,
      pickup_location,
      dropoff_location,
      pickup_time,
      status,
      price,
      created_at,
      ${userType === 'company' 
        ? 'vendor:users!bookings_vendor_id_fkey(id, vendor_name, email)' 
        : 'company:users!bookings_company_id_fkey(id, company_name, email)'
      }
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
}

// Get available vendors that a company can partner with (not already partnered)
export async function getAvailableVendorsForPartnership(companyId: string): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
  
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
}

// Get available companies that a vendor can partner with (not already partnered)
export async function getAvailableCompaniesForPartnership(vendorId: string): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
  
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
}

// Update ride status (for real-time updates)
export async function updateRideStatus(
  bookingId: string, 
  newStatus: Booking["status"], 
  location?: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
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
}
