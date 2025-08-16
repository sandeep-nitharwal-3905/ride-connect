# 🚀 RideConnect - Complete Run Guide

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v20 or higher) - **REQUIRED for Supabase compatibility**
- **npm** or **pnpm** or **yarn**
- **Git**
- **Supabase account** (for database and authentication)

### **⚠️ Important Node.js Version Note**
- **Node.js 18 and below are DEPRECATED** for Supabase
- **Node.js 20+ is REQUIRED** for future compatibility
- **Node.js 22 LTS is RECOMMENDED** for best performance

---

## 🛠️ Installation Steps

### 1. **Verify Node.js Version**
```bash
node --version
# Must be v20.0.0 or higher
```

If you have Node.js 18 or below, upgrade first:
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
nvm alias default 20

# Or download from nodejs.org
```

### 2. **Clone the Repository**
```bash
git clone <your-repository-url>
cd "New folder (2)"
```

### 3. **Install Dependencies**
```bash
# Using npm
npm install

# OR using pnpm
pnpm install

# OR using yarn
yarn install
```

### 4. **Install Missing Dependencies**
```bash
# Install the required Supabase auth helpers for middleware
npm install @supabase/auth-helpers-nextjs
```

---

## ⚙️ Environment Configuration

### 1. **Create Environment File**
Create a `.env.local` file in the root directory:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 2. **Get Supabase Credentials**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🗄️ Database Setup

### 1. **Run Database Scripts**
Execute the SQL scripts in your Supabase SQL editor:

```sql
-- Run scripts/01-create-tables.sql
-- Run scripts/02-seed-data.sql (if you have sample data)
-- Run scripts/03-performance-indexes.sql
```

### 2. **Database Schema**
The system uses these main tables:
- `users` - Company and vendor profiles
- `partnerships` - Company-vendor relationships  
- `bookings` - Ride requests and tracking

---

## 🚀 Running the Application

### **Option 1: Run Everything Together (Recommended)**
```bash
npm run dev:all
```
This runs both the Next.js app and Socket.IO server concurrently.

### **Option 2: Run Separately**

#### **Terminal 1: Next.js Frontend**
```bash
npm run dev
```
Frontend will run on: http://localhost:3000

#### **Terminal 2: Socket.IO Server**
```bash
npm run socket
```
Socket server will run on: http://localhost:3001

---

## 🌐 Access Points

### **Frontend Application**
- **Main App**: http://localhost:3000
- **Company Login**: http://localhost:3000/auth/company/login
- **Vendor Login**: http://localhost:3000/auth/vendor/login
- **Company Dashboard**: http://localhost:3000/dashboard/company
- **Vendor Dashboard**: http://localhost:3000/dashboard/vendor

### **Backend Services**
- **Socket.IO Server**: http://localhost:3001
- **API Routes**: http://localhost:3000/api/*

---

## 🧪 Testing the Application

### 1. **Create Test Accounts**
First, create accounts through the signup forms:

#### **Company Account:**
- Go to: http://localhost:3000/auth/company/signup
- Fill in company details
- Verify email (check Supabase dashboard)

#### **Vendor Account:**
- Go to: http://localhost:3000/auth/vendor/signup
- Fill in vendor details
- Verify email (check Supabase dashboard)

### 2. **Test Login Flow**
- Login with created accounts
- Verify dashboard access
- Check real-time connections

### 3. **Test Real-time Features**
- Create a booking as a company
- Check if vendor receives real-time notification
- Accept/reject booking as vendor
- Verify real-time updates

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Node.js Version Issues**
```bash
# Check Node.js version
node --version

# If below v20, upgrade:
nvm install 20
nvm use 20
```

#### **2. Port Already in Use**
```bash
# Kill process using port 3000
npx kill-port 3000

# Kill process using port 3001
npx kill-port 3001
```

#### **3. Supabase Connection Issues**
- Verify environment variables are correct
- Check Supabase project is active
- Ensure database tables are created
- **Ensure Node.js 20+ is installed**

#### **4. Socket.IO Connection Issues**
- Verify Socket.IO server is running
- Check `NEXT_PUBLIC_SOCKET_URL` in environment
- Ensure no firewall blocking port 3001

#### **5. Authentication Issues**
- Check Supabase Auth settings
- Verify email confirmation is enabled
- Check user type validation in database
- **Verify Node.js version compatibility**

#### **6. Database Errors**
- Run database scripts in correct order
- Check Supabase RLS (Row Level Security) policies
- Verify table relationships and constraints

---

## 📱 Development Workflow

### **1. Frontend Development**
```bash
npm run dev
# Make changes to React components
# Hot reload will update browser
```

### **2. Backend Development**
```bash
npm run socket
# Make changes to socket-server.ts
# Restart server to see changes
```

### **3. Database Changes**
- Modify SQL scripts
- Run in Supabase SQL editor
- Update TypeScript interfaces if needed

---

## 🚀 Production Deployment

### **1. Build the Application**
```bash
npm run build
```

### **2. Start Production Server**
```bash
npm start
```

### **3. Environment Variables**
Ensure production environment variables are set:
- Supabase production credentials
- Production Socket.IO server URL
- Proper CORS settings

---

## 📊 Monitoring & Debugging

### **1. Console Logs**
- Frontend: Browser console
- Backend: Terminal running socket server
- Database: Supabase dashboard logs

### **2. Real-time Monitoring**
- Socket.IO admin panel (if configured)
- Supabase real-time logs
- Network tab in browser dev tools

---

## 🎯 Quick Start Checklist

- [ ] **Install Node.js 20+ (REQUIRED)**
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Install `@supabase/auth-helpers-nextjs`
- [ ] Create `.env.local` file
- [ ] Set up Supabase project
- [ ] Run database scripts
- [ ] Start development servers (`npm run dev:all`)
- [ ] Create test accounts
- [ ] Test real-time functionality

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Node.js version** - Must be 20+
2. **Check console logs** for error messages
3. **Verify environment variables** are set correctly
4. **Ensure all dependencies** are installed
5. **Check Supabase project** is active and configured
6. **Verify database tables** are created properly

---

## 🎉 Success!

Once everything is running:
- Frontend: http://localhost:3000 ✅
- Socket.IO: http://localhost:3001 ✅
- Database: Supabase connected ✅
- Authentication: Working ✅
- Real-time: Functional ✅
- **Node.js: Compatible version ✅**

You now have a fully functional RideConnect platform running locally! 🚀 