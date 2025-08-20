# 🗄️ Database Documentation - RideConnect

## 📋 Overview

RideConnect uses **Supabase (PostgreSQL)** as the primary database with the following main entities:
- **Users** (Companies and Vendors)
- **Partnerships** (Company-Vendor relationships)
- **Bookings** (Ride requests and tracking)

## 🏗️ Database Schema

### Users Table
Stores both company and vendor profiles with role-based differentiation.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'vendor')),
  company_name TEXT,
  vendor_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Partnerships Table
Manages relationships between companies and vendors.

```sql
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, vendor_id)
);
```

### Bookings Table
Core table for ride management and tracking.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  passenger_name TEXT,
  passenger_phone TEXT,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  vehicle_type TEXT,
  special_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'in_progress')),
  price DECIMAL(10,2),
  current_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📝 Database Scripts

Execute these scripts in order for proper database setup:

### 1. `01-create-tables.sql` *(Required)*
**Purpose**: Creates the main database structure
- Creates `users`, `partnerships`, and `bookings` tables with all necessary columns
- Sets up foreign key relationships and constraints
- Includes `passenger_name`, `passenger_phone`, `vehicle_type`, and `current_location` columns
- Establishes check constraints for data integrity
- Adds basic performance indexes

### 2. `02-seed-data.sql` *(Optional)*
**Purpose**: Populates initial test data for development
- Creates sample company and vendor users
- Establishes test partnerships between users
- Adds sample bookings for testing workflows
- Useful for development and testing environments

### 3. `03-performance-indexes.sql` *(Recommended)*
**Purpose**: Optimizes database performance for production
- Adds comprehensive indexes on frequently queried columns
- Improves query performance for dashboards and real-time operations
- Optimizes partnership and booking lookups
- Essential for production deployments

### 4. `05-add-missing-columns.sql` *(Legacy Migration)*
**Purpose**: Historical migration for older database instances
- Safely adds missing columns if they don't exist
- Only needed if upgrading from an older schema version
- Uses conditional checks to prevent duplicate columns
- Can be skipped for new installations using `01-create-tables.sql`

## 🚀 Setup Instructions

### 1. Initial Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the project URL and anon key

2. **Run Database Scripts**:
   ```sql
   -- Execute in Supabase SQL Editor in this order:
   
   -- Step 1: Create main structure (REQUIRED)
   \i scripts/01-create-tables.sql
   
   -- Step 2: Add sample data (OPTIONAL - for development/testing)
   \i scripts/02-seed-data.sql
   
   -- Step 3: Add performance indexes (RECOMMENDED - for production)
   \i scripts/03-performance-indexes.sql
   
   -- Step 4: Legacy migration (ONLY if upgrading from older schema)
   \i scripts/05-add-missing-columns.sql
   ```

### 2. Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Authentication Setup

Supabase Auth is configured for:
- **Email/Password authentication**
- **Email confirmation required**
- **Role-based access control** via `user_type`

## 🔄 Data Flow

### Booking Lifecycle

1. **Creation**: Company creates booking (`status: 'pending'`)
2. **Assignment**: System notifies partnered vendors
3. **Acceptance**: Vendor accepts (`status: 'accepted'`, `vendor_id` set)
4. **Progress**: Status updates to `'in_progress'` during ride
5. **Completion**: Final status `'completed'` or `'cancelled'`

### Real-time Updates

The database supports real-time operations through:
- **Socket.IO events** for immediate UI updates
- **Optimistic UI updates** for better user experience
- **Database triggers** for data consistency

## 🔍 Common Queries

### Get Company Bookings
```sql
SELECT b.*, u.vendor_name 
FROM bookings b 
LEFT JOIN users u ON b.vendor_id = u.id 
WHERE b.company_id = $1 
ORDER BY b.created_at DESC;
```

### Get Vendor Available Bookings
```sql
SELECT b.*, u.company_name 
FROM bookings b 
JOIN users u ON b.company_id = u.id 
JOIN partnerships p ON p.company_id = b.company_id 
WHERE p.vendor_id = $1 AND b.status = 'pending';
```

### Get Active Partnerships
```sql
SELECT p.*, 
       c.company_name, 
       v.vendor_name 
FROM partnerships p 
JOIN users c ON p.company_id = c.id 
JOIN users v ON p.vendor_id = v.id 
WHERE p.status = 'active';
```

## 🛠️ Schema Evolution

### Historical Changes

1. **Initial Schema**: Basic user and booking structure
2. **Partnership System**: Added company-vendor relationships
3. **Enhanced Booking**: Added passenger details and vehicle type
4. **Performance Optimization**: Added strategic indexes
5. **Real-time Support**: Optimized for Socket.IO integration

### Migration Guidelines

When updating the schema:
1. **Always use conditional migrations** (IF NOT EXISTS)
2. **Test on development first**
3. **Backup production data** before migrations
4. **Update TypeScript interfaces** to match schema changes
5. **Document changes** in this file

## 🔒 Security & Permissions

### Row Level Security (RLS)

Supabase RLS policies should be configured for:
- **Users**: Users can only read/update their own profile
- **Partnerships**: Companies can manage their partnerships
- **Bookings**: Companies see their bookings, vendors see assigned ones

### Example RLS Policies

```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Companies can read their bookings
CREATE POLICY "Companies can read their bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = company_id AND auth.uid()::text = id::text
    )
  );
```

## 📊 Performance Considerations

### Indexes Created

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Partnership queries
CREATE INDEX idx_partnerships_company_id ON partnerships(company_id);
CREATE INDEX idx_partnerships_vendor_id ON partnerships(vendor_id);

-- Booking operations
CREATE INDEX idx_bookings_company_id ON bookings(company_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### Query Optimization Tips

1. **Use specific indexes** for dashboard queries
2. **Limit result sets** with pagination
3. **Use compound indexes** for multi-column filters
4. **Monitor query performance** in Supabase dashboard

## 🐛 Troubleshooting

### Common Database Issues

1. **Migration Errors**: Ensure scripts run in correct order
2. **Constraint Violations**: Check data integrity before updates
3. **Permission Denied**: Verify RLS policies and user authentication
4. **Connection Issues**: Check environment variables and project status

### Debug Queries

```sql
-- Check table structure
\d users
\d partnerships  
\d bookings

-- Verify data integrity
SELECT COUNT(*) FROM users WHERE user_type NOT IN ('company', 'vendor');
SELECT COUNT(*) FROM bookings WHERE status NOT IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'in_progress');

-- Check relationships
SELECT COUNT(*) FROM partnerships p 
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = p.company_id);
```

## 📈 Future Enhancements

Potential schema improvements:
- **Ride History**: Archive completed rides separately
- **Payment Integration**: Add payment tracking tables
- **Rating System**: User feedback and rating tables
- **Geolocation**: Enhanced location tracking with coordinates
- **Notifications**: Message/notification history table

---

**For application setup, see [README.md](./README.md)**
