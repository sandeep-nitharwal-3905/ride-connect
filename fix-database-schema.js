// Script to add missing columns to the bookings table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  console.log('Adding missing columns to bookings table...')
  
  try {
    // Add passenger_name column
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' AND column_name = 'passenger_name'
            ) THEN
                ALTER TABLE bookings ADD COLUMN passenger_name TEXT;
                RAISE NOTICE 'Added passenger_name column';
            ELSE
                RAISE NOTICE 'passenger_name column already exists';
            END IF;
        END $$;
      `
    })

    // Add passenger_phone column
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' AND column_name = 'passenger_phone'
            ) THEN
                ALTER TABLE bookings ADD COLUMN passenger_phone TEXT;
                RAISE NOTICE 'Added passenger_phone column';
            ELSE
                RAISE NOTICE 'passenger_phone column already exists';
            END IF;
        END $$;
      `
    })

    // Add vehicle_type column
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' AND column_name = 'vehicle_type'
            ) THEN
                ALTER TABLE bookings ADD COLUMN vehicle_type TEXT;
                RAISE NOTICE 'Added vehicle_type column';
            ELSE
                RAISE NOTICE 'vehicle_type column already exists';
            END IF;
        END $$;
      `
    })

    if (error1 || error2 || error3) {
      console.error('Errors adding columns:', { error1, error2, error3 })
      return false
    }

    console.log('✅ Successfully added missing columns')
    
    // Verify the columns were added
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)

    if (!error && data) {
      console.log('Updated table columns:', Object.keys(data[0] || {}))
    }

    return true

  } catch (error) {
    console.error('❌ Error adding columns:', error)
    return false
  }
}

// Alternative approach using direct SQL
async function addColumnsDirect() {
  console.log('\\nTrying direct approach...')
  
  try {
    // Check current columns first
    const { data: currentData, error: currentError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)

    if (currentData && currentData.length > 0) {
      console.log('Current columns:', Object.keys(currentData[0]))
      
      const hasPassengerName = 'passenger_name' in currentData[0]
      const hasPassengerPhone = 'passenger_phone' in currentData[0] 
      const hasVehicleType = 'vehicle_type' in currentData[0]
      
      console.log('Missing columns check:')
      console.log('- passenger_name:', hasPassengerName ? '✅ exists' : '❌ missing')
      console.log('- passenger_phone:', hasPassengerPhone ? '✅ exists' : '❌ missing')
      console.log('- vehicle_type:', hasVehicleType ? '✅ exists' : '❌ missing')
      
      if (!hasPassengerName || !hasPassengerPhone || !hasVehicleType) {
        console.log('\\n⚠️  Some columns are missing from the database schema.')
        console.log('The booking creation will work without these optional fields.')
        console.log('To add them, run the SQL commands manually in your Supabase dashboard:')
        console.log('\\nALTER TABLE bookings ADD COLUMN passenger_name TEXT;')
        console.log('ALTER TABLE bookings ADD COLUMN passenger_phone TEXT;')
        console.log('ALTER TABLE bookings ADD COLUMN vehicle_type TEXT;')
      }
    }
    
    return true

  } catch (error) {
    console.error('❌ Error checking columns:', error)
    return false
  }
}

async function main() {
  console.log('=== BOOKINGS TABLE COLUMN CHECK ===\\n')
  
  await addColumnsDirect()
  
  console.log('\\n=== TESTING BOOKING CREATION (with current schema) ===\\n')
  
  // Test booking creation with current schema
  try {
    const testBooking = {
      company_id: "333983fb-fb53-40d2-9739-7db829d3405d",
      pickup_location: "Test Pickup Location",
      dropoff_location: "Test Dropoff Location", 
      pickup_time: new Date().toISOString(),
      passenger_count: 1,
      status: "pending",
      price: 25.00,
      special_requirements: "Test requirements"
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([testBooking])
      .select()
      .single()

    if (error) {
      console.error('❌ Test booking creation failed:', error)
    } else {
      console.log('✅ Test booking created successfully:', data.id)
      console.log('Booking data:', data)
    }

  } catch (error) {
    console.error('❌ Test booking error:', error)
  }
}

main().catch(console.error)
