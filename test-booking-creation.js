// Test script to verify booking creation
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBookingCreation() {
  console.log('Testing booking creation...')
  
  try {
    // Test data matching what the frontend sends
    const testBookingData = {
      company_id: "333983fb-fb53-40d2-9739-7db829d3405d", // Use existing company ID
      pickup_location: "123 Main St, New York, NY",
      dropoff_location: "456 Broadway, New York, NY",
      pickup_time: new Date().toISOString(),
      passenger_count: 1,
      status: "pending",
      price: 25.50,
      created_at: new Date().toISOString()
    }

    console.log('Attempting to insert booking:', testBookingData)

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([testBookingData])
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return false
    }

    console.log('✅ Booking created successfully:', booking.id)
    console.log('Full booking data:', booking)
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function testTableStructure() {
  console.log('\\nTesting table structure...')
  
  try {
    // Try to get the table structure
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error querying bookings table:', error)
      return false
    }

    console.log('✅ Bookings table is accessible')
    if (data && data.length > 0) {
      console.log('Sample booking columns:', Object.keys(data[0]))
    }
    return true

  } catch (error) {
    console.error('❌ Error testing table structure:', error)
    return false
  }
}

async function runTests() {
  console.log('=== BOOKING DATABASE TEST ===\\n')
  
  const tableTest = await testTableStructure()
  if (!tableTest) {
    console.log('\\n❌ Table structure test failed. Check database setup.')
    return
  }

  const bookingTest = await testBookingCreation()
  if (bookingTest) {
    console.log('\\n✅ All tests passed! Booking creation is working.')
  } else {
    console.log('\\n❌ Booking creation test failed.')
  }
}

runTests().catch(console.error)
