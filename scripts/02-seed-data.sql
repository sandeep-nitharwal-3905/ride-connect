-- Insert sample companies
INSERT INTO users (email, user_type, company_name, phone, address) VALUES
('acme@company.com', 'company', 'Acme Corporation', '+1-555-0101', '123 Business Ave, New York, NY'),
('techcorp@company.com', 'company', 'TechCorp Solutions', '+1-555-0102', '456 Innovation Dr, San Francisco, CA'),
('globalinc@company.com', 'company', 'Global Inc', '+1-555-0103', '789 Enterprise Blvd, Chicago, IL')
ON CONFLICT (email) DO NOTHING;

-- Insert sample vendors
INSERT INTO users (email, user_type, vendor_name, phone, address) VALUES
('swift@vendor.com', 'vendor', 'Swift Transport', '+1-555-0201', '321 Fleet St, New York, NY'),
('rapid@vendor.com', 'vendor', 'Rapid Rides', '+1-555-0202', '654 Speed Way, San Francisco, CA'),
('elite@vendor.com', 'vendor', 'Elite Transportation', '+1-555-0203', '987 Luxury Lane, Chicago, IL'),
('metro@vendor.com', 'vendor', 'Metro Mobility', '+1-555-0204', '147 City Center, New York, NY')
ON CONFLICT (email) DO NOTHING;

-- Create partnerships between companies and vendors
INSERT INTO partnerships (company_id, vendor_id, status)
SELECT 
  c.id as company_id,
  v.id as vendor_id,
  'active' as status
FROM users c
CROSS JOIN users v
WHERE c.user_type = 'company' 
  AND v.user_type = 'vendor'
  AND c.company_name IN ('Acme Corporation', 'TechCorp Solutions')
  AND v.vendor_name IN ('Swift Transport', 'Rapid Rides', 'Elite Transportation')
ON CONFLICT (company_id, vendor_id) DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (company_id, vendor_id, pickup_location, dropoff_location, pickup_time, passenger_count, status, price)
SELECT 
  c.id as company_id,
  v.id as vendor_id,
  'JFK Airport Terminal 1' as pickup_location,
  'Manhattan Financial District' as dropoff_location,
  NOW() + INTERVAL '2 hours' as pickup_time,
  2 as passenger_count,
  'accepted' as status,
  85.00 as price
FROM users c, users v
WHERE c.user_type = 'company' 
  AND v.user_type = 'vendor'
  AND c.company_name = 'Acme Corporation'
  AND v.vendor_name = 'Swift Transport'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bookings (company_id, pickup_location, dropoff_location, pickup_time, passenger_count, status)
SELECT 
  c.id as company_id,
  'LaGuardia Airport Terminal B' as pickup_location,
  'Brooklyn Heights' as dropoff_location,
  NOW() + INTERVAL '4 hours' as pickup_time,
  1 as passenger_count,
  'pending' as status
FROM users c
WHERE c.user_type = 'company' 
  AND c.company_name = 'TechCorp Solutions'
LIMIT 1
ON CONFLICT DO NOTHING;
