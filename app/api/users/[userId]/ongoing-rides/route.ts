import { NextRequest, NextResponse } from "next/server"
import { getOngoingRidesForUser } from "../../../../../lib/database"

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

    const ongoingRides = await getOngoingRidesForUser(resolvedParams.userId, userType)
    
    return NextResponse.json({ 
      ongoingRides,
      count: ongoingRides.length 
    })
    
  } catch (error) {
    console.error("Error fetching ongoing rides:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
