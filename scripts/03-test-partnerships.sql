-- Add some additional sample partnerships for testing
INSERT INTO partnerships (company_id, vendor_id, status)
SELECT 
  c.id as company_id,
  v.id as vendor_id,
  'active' as status
FROM users c
CROSS JOIN users v
WHERE c.user_type = 'company' 
  AND v.user_type = 'vendor'
  AND c.company_name = 'Global Inc'
  AND v.vendor_name = 'Metro Mobility'
ON CONFLICT (company_id, vendor_id) DO NOTHING;

-- Create some inactive partnerships to test filtering
INSERT INTO partnerships (company_id, vendor_id, status)
SELECT 
  c.id as company_id,
  v.id as vendor_id,
  'inactive' as status
FROM users c
CROSS JOIN users v
WHERE c.user_type = 'company' 
  AND v.user_type = 'vendor'
  AND c.company_name = 'TechCorp Solutions'
  AND v.vendor_name = 'Metro Mobility'
ON CONFLICT (company_id, vendor_id) DO NOTHING;
