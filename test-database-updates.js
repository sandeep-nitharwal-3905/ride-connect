const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from example.env
const envPath = path.join(__dirname, 'example.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/'/g, '');
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in example.env');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseUpdates() {
  console.log('🔍 Testing Database Updates...\n');

  try {
    // Fetch recent bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return;
    }

    console.log('📊 Recent bookings:');
    bookings.forEach(booking => {
      console.log(`  - ID: ${booking.id.slice(-8)}`);
      console.log(`    Status: ${booking.status}`);
      console.log(`    Vendor ID: ${booking.vendor_id || 'None'}`);
      console.log(`    Created: ${new Date(booking.created_at).toLocaleString()}`);
      console.log(`    Updated: ${new Date(booking.updated_at).toLocaleString()}`);
      console.log('');
    });

    // Check for recent status changes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentUpdates, error: updateError } = await supabase
      .from('bookings')
      .select('*')
      .gte('updated_at', oneHourAgo)
      .order('updated_at', { ascending: false });

    if (!updateError && recentUpdates.length > 0) {
      console.log('🕒 Recent updates (last hour):');
      recentUpdates.forEach(booking => {
        console.log(`  - ${booking.id.slice(-8)}: ${booking.status} (Updated: ${new Date(booking.updated_at).toLocaleString()})`);
      });
    } else {
      console.log('📝 No recent updates found in the last hour');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDatabaseUpdates();
