import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "../../../../lib/supabase/server"

// Diagnostic endpoint to check database schema
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check what columns exist in the bookings table
    const { data: columns, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "bookings")
      .order("ordinal_position")

    if (error) {
      console.error("Error checking schema:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Database schema check",
      bookings_columns: columns,
      missing_current_location: !columns?.some((col: any) => col.column_name === 'current_location')
    })
    
  } catch (error) {
    console.error("Schema check error:", error)
    return NextResponse.json(
      { error: "Failed to check database schema" },
      { status: 500 }
    )
  }
}
