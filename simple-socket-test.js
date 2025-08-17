// Simple test to verify socket connection and events
const { io } = require('socket.io-client');

console.log('🔌 Testing Socket Connection...\n');

// Use the existing user IDs that are already connected
const companySocket = io('http://localhost:3001', {
  forceNew: true,
  query: {
    userType: 'company',
    userId: '333983fb-fb53-40d2-9739-7db829d3405d'
  }
});

companySocket.on('connect', () => {
  console.log('✅ Connected to socket server successfully');
  
  // Listen for all relevant events
  companySocket.on('booking_request_created', (data) => {
    console.log('📋 booking_request_created:', data.requestId);
  });
  
  companySocket.on('ride_created', (data) => {
    console.log('🚗 ride_created:', data.requestId);
  });
  
  companySocket.on('pending_rides_updated', (data) => {
    console.log('🔄 pending_rides_updated:', data.action);
  });
  
  companySocket.on('ongoing_rides_updated', (data) => {
    console.log('🏃 ongoing_rides_updated:', data.action, data.newStatus);
  });
  
  companySocket.on('booking_status_update', (data) => {
    console.log('📊 booking_status_update:', data.status);
  });
  
  // Test creating a booking after connection
  setTimeout(() => {
    console.log('\n📝 Creating test booking...');
    const testBookingData = {
      companyId: '333983fb-fb53-40d2-9739-7db829d3405d',
      companyName: 'Test Company',
      passengerName: 'Test User',
      passengerPhone: '+1234567890',
      pickupLocation: 'Test Pickup Location',
      destination: 'Test Destination',
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      vehicleType: 'standard',
      estimatedFare: '$20.00',
      urgency: 'normal',
      specialRequests: 'Test request'
    };
    
    companySocket.emit('create_booking_request', testBookingData);
  }, 1000);
  
  // Close after 8 seconds
  setTimeout(() => {
    console.log('\n✅ Test completed');
    companySocket.disconnect();
    process.exit(0);
  }, 8000);
});

companySocket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

companySocket.on('disconnect', () => {
  console.log('🔌 Disconnected from socket server');
});
