import { NextRequest, NextResponse } from "next/server"
import { createPartnership, getPartnershipsByCompany, getPartnershipsByVendor } from "../../../lib/database-client"

export async function POST(request: NextRequest) {
  try {
    console.log('Partnership API route called')
    const body = await request.json()
    console.log('Request body:', body)
    const { companyId, vendorId } = body

    if (!companyId || !vendorId) {
      console.error('Missing required fields:', { companyId, vendorId })
      return NextResponse.json(
        { error: "Both companyId and vendorId are required" },
        { status: 400 }
      )
    }

    console.log('Creating partnership:', { companyId, vendorId })
    const partnership = await createPartnership(companyId, vendorId)
    console.log('Partnership creation result:', partnership)
    
    if (!partnership) {
      console.error('Partnership creation returned null')
      return NextResponse.json(
        { error: "Failed to create partnership" },
        { status: 500 }
      )
    }

    console.log('Partnership created successfully:', partnership)
    return NextResponse.json({ 
      partnership,
      message: "Partnership created successfully" 
    })
    
  } catch (error) {
    console.error("Error creating partnership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const vendorId = searchParams.get('vendorId')
    
    if (companyId) {
      const partnerships = await getPartnershipsByCompany(companyId)
      return NextResponse.json({ partnerships })
    }
    
    if (vendorId) {
      const partnerships = await getPartnershipsByVendor(vendorId)
      return NextResponse.json({ partnerships })
    }
    
    return NextResponse.json(
      { error: "Either companyId or vendorId is required" },
      { status: 400 }
    )
    
  } catch (error) {
    console.error("Error fetching partnerships:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
