-- Additional Performance Indexes for Faster Queries
-- Run this to optimize the existing database

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_company_status ON bookings(company_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status ON bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_status ON bookings(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_partnerships_company_status ON partnerships(company_id, status);
CREATE INDEX IF NOT EXISTS idx_partnerships_vendor_status ON partnerships(vendor_id, status);

-- Indexes for date-based filtering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_desc ON bookings(created_at DESC);

-- Analyze tables to update query planner statistics
ANALYZE users;
ANALYZE partnerships;
ANALYZE bookings;
