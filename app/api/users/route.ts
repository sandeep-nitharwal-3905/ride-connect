import { NextRequest, NextResponse } from "next/server"
import { createUser, getAllVendors, getAllCompanies, createPartnership } from "../../../lib/database"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    // Create the new user
    const newUser = await createUser(userData)
    
    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    // If this is a new company, create partnerships with all existing vendors
    if (newUser.user_type === 'company') {
      const allVendors = await getAllVendors()
      
      for (const vendor of allVendors) {
        await createPartnership(newUser.id, vendor.id)
      }
      
      console.log(`Created partnerships between company ${newUser.id} and ${allVendors.length} vendors`)
    }
    
    // If this is a new vendor, create partnerships with all existing companies
    if (newUser.user_type === 'vendor') {
      const allCompanies = await getAllCompanies()
      
      for (const company of allCompanies) {
        await createPartnership(company.id, newUser.id)
      }
      
      console.log(`Created partnerships between vendor ${newUser.id} and ${allCompanies.length} companies`)
    }

    return NextResponse.json({ 
      user: newUser,
      message: `User created successfully with partnerships established` 
    })
    
  } catch (error) {
    console.error("Error in user creation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const [companies, vendors] = await Promise.all([
      getAllCompanies(),
      getAllVendors()
    ])

    return NextResponse.json({
      companies,
      vendors
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
