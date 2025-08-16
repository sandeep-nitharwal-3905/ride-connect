import { NextRequest, NextResponse } from "next/server"
import { getPartnershipsByCompany, getPartnershipsByVendor } from "../../../../../lib/database"

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

    let partnerships = []
    
    if (userType === 'company') {
      partnerships = await getPartnershipsByCompany(resolvedParams.userId)
    } else {
      partnerships = await getPartnershipsByVendor(resolvedParams.userId)
    }
    
    return NextResponse.json({ 
      partnerships,
      count: partnerships.length 
    })
    
  } catch (error) {
    console.error("Error fetching current partners:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
