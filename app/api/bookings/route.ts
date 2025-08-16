import { NextRequest, NextResponse } from "next/server"
import { getBookingsByCompany, getBookingsByVendor, Booking } from "../../../lib/database-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const vendorId = searchParams.get('vendorId')
    
    if (!companyId && !vendorId) {
      return NextResponse.json(
        { error: "Either companyId or vendorId is required" },
        { status: 400 }
      )
    }

    let bookings: Booking[] = []
    
    if (companyId) {
      bookings = await getBookingsByCompany(companyId)
    } else if (vendorId) {
      bookings = await getBookingsByVendor(vendorId)
    }
    
    return NextResponse.json({ 
      bookings,
      count: bookings.length 
    })
    
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
