const { io } = require('socket.io-client');

// Test script to verify pending rides update functionality
console.log('🚀 Testing Pending Rides Update Functionality...\n');

// Connect as a company user
const companySocket = io('http://localhost:3001', {
  query: {
    userType: 'company',
    userId: '333983fb-fb53-40d2-9739-7db829d3405d' // Use the existing company UUID from socket output
  }
});

// Connect as a vendor user
const vendorSocket = io('http://localhost:3001', {
  query: {
    userType: 'vendor',
    userId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0' // Use the existing vendor UUID from socket output
  }
});

let testBookingId = null;
let testRequestId = null;

companySocket.on('connect', () => {
  console.log('✅ Company connected to socket server');
  
  // Listen for booking creation confirmation
  companySocket.on('booking_request_created', (data) => {
    console.log('📋 Company received booking creation confirmation:', {
      requestId: data.requestId,
      bookingId: data.bookingId,
      status: data.status
    });
    testRequestId = data.requestId;
    testBookingId = data.bookingId;
  });

  // Listen for pending rides updates
  companySocket.on('pending_rides_updated', (data) => {
    console.log('🔄 Company received pending rides update:', {
      action: data.action,
      bookingId: data.booking?.id,
      status: data.booking?.status
    });
  });

  // Listen for ride created event
  companySocket.on('ride_created', (data) => {
    console.log('🚗 Company received ride created event:', {
      requestId: data.requestId,
      bookingId: data.booking?.id,
      status: data.status
    });
  });

  // Listen for ongoing rides updates
  companySocket.on('ongoing_rides_updated', (data) => {
    console.log('🏃 Company received ongoing rides update:', {
      action: data.action,
      bookingId: data.booking?.id,
      status: data.booking?.status,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus
    });
  });

  // Listen for booking status updates
  companySocket.on('booking_status_update', (data) => {
    console.log('📊 Company received booking status update:', {
      requestId: data.requestId,
      status: data.status,
      vendorId: data.vendorId
    });
  });
});

vendorSocket.on('connect', () => {
  console.log('✅ Vendor connected to socket server');
  
  // Listen for new booking requests
  vendorSocket.on('new_booking_request', (data) => {
    console.log('📨 Vendor received new booking request:', {
      requestId: data.requestId,
      companyId: data.companyId,
      pickupLocation: data.pickupLocation,
      destination: data.destination
    });

    // Auto-accept the booking after 3 seconds to test status updates
    setTimeout(() => {
      console.log('🤝 Vendor accepting booking request...');
      vendorSocket.emit('accept_booking_request', {
        requestId: data.requestId,
        vendorId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0'
      });
    }, 3000);

    // Test status update after acceptance
    setTimeout(() => {
      if (testBookingId) {
        console.log('🚦 Vendor updating ride status to in_progress...');
        vendorSocket.emit('update_ride_status', {
          bookingId: testBookingId,
          newStatus: 'in_progress',
          vendorId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0',
          location: 'En route to pickup location'
        });
      }
    }, 6000);

    // Test completion after 9 seconds
    setTimeout(() => {
      if (testBookingId) {
        console.log('🏁 Vendor completing the ride...');
        vendorSocket.emit('update_ride_status', {
          bookingId: testBookingId,
          newStatus: 'completed',
          vendorId: '985063d2-d38a-48d9-9cae-ae5232ecc9f0'
        });
      }
    }, 9000);
  });

  // Listen for ongoing rides updates
  vendorSocket.on('ongoing_rides_updated', (data) => {
    console.log('🚐 Vendor received ongoing rides update:', {
      action: data.action,
      bookingId: data.booking?.id,
      status: data.booking?.status,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus
    });
  });

  // Listen for booking acceptance confirmation
  vendorSocket.on('booking_acceptance_confirmed', (data) => {
    console.log('✅ Vendor received booking acceptance confirmation:', {
      requestId: data.requestId,
      bookingId: data.bookingId
    });
    testBookingId = data.bookingId; // Store for status updates
  });
});

// Wait for connections, then create a test booking
setTimeout(() => {
  console.log('\n📝 Creating test booking request...');
  
  const testBookingData = {
    companyId: '333983fb-fb53-40d2-9739-7db829d3405d',
    companyName: 'Test Company Inc.',
    passengerName: 'John Doe',
    passengerPhone: '+1234567890',
    pickupLocation: '123 Main St, Downtown',
    destination: '456 Business Ave, Uptown',
    scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    vehicleType: 'standard',
    estimatedFare: '$25.50',
    urgency: 'normal',
    specialRequests: 'Test booking for pending rides update'
  };

  companySocket.emit('create_booking_request', testBookingData);
}, 2000);

// Cleanup after 18 seconds (extended to test full flow)
setTimeout(() => {
  console.log('\n🧹 Test completed. Disconnecting...');
  companySocket.disconnect();
  vendorSocket.disconnect();
  process.exit(0);
}, 18000);

// Handle errors
companySocket.on('connect_error', (err) => {
  console.error('❌ Company connection error:', err.message);
});

vendorSocket.on('connect_error', (err) => {
  console.error('❌ Vendor connection error:', err.message);
});

companySocket.on('booking_request_error', (data) => {
  console.error('❌ Company booking error:', data);
});

vendorSocket.on('booking_error', (data) => {
  console.error('❌ Vendor booking error:', data);
});
