const { io } = require('socket.io-client');

console.log('🧪 Testing Pending Rides Status Update Issue...\n');

// Test scenario: Create booking and accept it, then verify UI should update

const companySocket = io('http://localhost:3001', {
  query: {
    userType: 'company',
    userId: '333983fb-fb53-40d2-9739-7db829d3405d'
  }
});

const vendorSocket = io('http://localhost:3001', {
  query: {
    userType: 'vendor',
    userId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0'
  }
});

let testBookingId = null;
let testRequestId = null;
let statusUpdateReceived = false;

companySocket.on('connect', () => {
  console.log('✅ Company connected to socket');
  
  companySocket.on('booking_request_created', (data) => {
    console.log('📋 Booking created:', {
      requestId: data.requestId,
      bookingId: data.bookingId,
      status: data.status
    });
    testRequestId = data.requestId;
    testBookingId = data.bookingId;
  });

  companySocket.on('booking_status_update', (data) => {
    console.log('📊 Status update received:', {
      requestId: data.requestId,
      status: data.status,
      vendorId: data.vendorId
    });
    statusUpdateReceived = true;
    
    // This is what should cause the UI to update
    if (data.status === 'accepted') {
      console.log('✅ EXPECTED: Pending ride should change to accepted status');
      console.log('✅ EXPECTED: Ride should move from pending to ongoing section');
    }
  });

  companySocket.on('pending_rides_updated', (data) => {
    console.log('🔄 Pending rides update:', {
      action: data.action,
      bookingId: data.booking?.id,
      status: data.booking?.status
    });
    
    if (data.action === 'accepted') {
      console.log('✅ EXPECTED: Frontend should remove this ride from pending list');
    }
  });

  companySocket.on('ongoing_rides_updated', (data) => {
    console.log('🏃 Ongoing rides update:', {
      action: data.action,
      bookingId: data.booking?.id,
      status: data.booking?.status
    });
    
    if (data.action === 'added') {
      console.log('✅ EXPECTED: Frontend should add this ride to ongoing list');
    }
  });
});

vendorSocket.on('connect', () => {
  console.log('✅ Vendor connected to socket');
  
  vendorSocket.on('new_booking_request', (data) => {
    console.log('📨 New booking request received:', {
      requestId: data.requestId,
      companyId: data.companyId
    });

    // Accept after 2 seconds
    setTimeout(() => {
      console.log('🤝 Vendor accepting request...');
      vendorSocket.emit('accept_booking_request', {
        requestId: data.requestId,
        vendorId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0'
      });
    }, 2000);
  });

  vendorSocket.on('booking_acceptance_confirmed', (data) => {
    console.log('✅ Vendor acceptance confirmed:', {
      requestId: data.requestId,
      bookingId: data.bookingId
    });
  });
});

// Create test booking after connections
setTimeout(() => {
  console.log('📝 Creating test booking...\n');
  
  const testBookingData = {
    companyId: '333983fb-fb53-40d2-9739-7db829d3405d',
    companyName: 'Test Company',
    passengerName: 'Test User',
    passengerPhone: '+1234567890',
    pickupLocation: 'Test Pickup Location',
    destination: 'Test Destination',
    scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    vehicleType: 'standard',
    estimatedFare: '$25.00',
    urgency: 'normal',
    specialRequests: 'Status update test'
  };

  companySocket.emit('create_booking_request', testBookingData);
}, 1000);

// Summary after test
setTimeout(() => {
  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  
  if (statusUpdateReceived) {
    console.log('✅ Socket events are working correctly');
    console.log('✅ Status change from pending → accepted is successful');
    console.log('');
    console.log('🔍 IF YOU STILL SEE "PENDING" IN THE UI:');
    console.log('  1. Check browser console for any JavaScript errors');
    console.log('  2. Ensure the company dashboard is connected to socket');
    console.log('  3. Verify the React state is updating correctly');
    console.log('  4. Check if any caching is preventing UI updates');
    console.log('  5. Try refreshing the browser page');
  } else {
    console.log('❌ Status update not received - socket issue detected');
  }
  
  console.log('\n🧹 Disconnecting...');
  companySocket.disconnect();
  vendorSocket.disconnect();
  process.exit(0);
}, 8000);

companySocket.on('connect_error', (err) => {
  console.error('❌ Company connection error:', err.message);
});

vendorSocket.on('connect_error', (err) => {
  console.error('❌ Vendor connection error:', err.message);
});
