import { NextRequest, NextResponse } from "next/server"
import { getAvailableVendorsForPartnership, getAvailableCompaniesForPartnership } from "../../../../../lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('userType') as 'company' | 'vendor'
    
    if (!userType || !['company', 'vendor'].includes(userType)) {
      return NextResponse.json(
        { error: "Valid userType (company or vendor) is required" },
        { status: 400 }
      )
    }

    let availablePartners = []
    
    if (userType === 'company') {
      // For companies, get available vendors to partner with
      availablePartners = await getAvailableVendorsForPartnership(resolvedParams.userId)
    } else {
      // For vendors, get available companies to partner with
      availablePartners = await getAvailableCompaniesForPartnership(resolvedParams.userId)
    }
    
    return NextResponse.json({ 
      availablePartners,
      count: availablePartners.length,
      partnerType: userType === 'company' ? 'vendors' : 'companies'
    })
    
  } catch (error) {
    console.error("Error fetching available partners:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
