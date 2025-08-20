# 🚗 RideConnect - Transportation Partnership Platform

A modern platform that connects transportation companies with service vendors for seamless ride management and real-time operations.

## 🌟 Features

- **Multi-user Authentication**: Separate login/signup flows for companies and vendors
- **Real-time Communication**: Live updates for booking requests, status changes, and ride tracking
- **Partnership Management**: Companies can establish partnerships with vendors
- **Booking System**: Complete ride booking workflow from request to completion
- **Dashboard Analytics**: Comprehensive dashboards for both companies and vendors
- **Live Tracking**: Real-time location updates and ride status monitoring

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO for real-time communication
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, Custom Design System
- **State Management**: React Hooks, Context API

## 📋 Prerequisites

- **Node.js 20+** (REQUIRED for Supabase compatibility)
- **npm/pnpm/yarn** package manager
- **Git**
- **Supabase account** for database and authentication

⚠️ **Important**: Node.js 18 and below are deprecated for Supabase. Use Node.js 20+ for optimal compatibility.

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repository-url>
cd ride-connect

# Verify Node.js version (must be 20+)
node --version

# Install dependencies
npm install

# Install required Supabase auth helpers
npm install @supabase/auth-helpers-nextjs
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 3. Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the database scripts in order (see [DATABASE.md](./DATABASE.md) for details)

### 4. Run the Application

```bash
# Run both frontend and socket server concurrently
npm run dev:all

# OR run separately:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Socket server
npm run socket
```

### 5. Access the Application

- **Main App**: http://localhost:3000
- **Company Login**: http://localhost:3000/auth/company/login
- **Vendor Login**: http://localhost:3000/auth/vendor/login
- **Socket.IO Server**: http://localhost:3001

## 🎯 Application Flow

### For Companies:
1. **Sign up** as a company
2. **Establish partnerships** with vendors
3. **Create booking requests** for rides
4. **Monitor real-time** ride status and vendor responses
5. **Track ongoing rides** with live location updates

### For Vendors:
1. **Sign up** as a service vendor
2. **Accept partnership requests** from companies
3. **Receive real-time** booking notifications
4. **Accept/reject ride requests**
5. **Update ride status** and location in real-time

## 🔧 Development

### Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Dashboard pages
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard components
│   └── ui/            # UI components
├── lib/               # Utility libraries
├── hooks/             # Custom React hooks
├── scripts/           # Database SQL scripts
├── server/            # Socket.IO server
└── styles/           # CSS styles
```

### Available Scripts

```bash
npm run dev          # Start Next.js development server
npm run socket       # Start Socket.IO server
npm run dev:all      # Start both servers concurrently
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🧪 Testing

### Create Test Accounts

1. **Company Account**: Visit `/auth/company/signup`
2. **Vendor Account**: Visit `/auth/vendor/signup`
3. **Verify emails** in Supabase dashboard
4. **Test login flows** and dashboard access

### Test Real-time Features

1. Login as company and vendor in different browsers
2. Create a partnership between them
3. Create a booking as company
4. Accept/reject booking as vendor
5. Verify real-time updates in company dashboard

## 🔍 Troubleshooting

### Common Issues

- **Node.js Version**: Ensure you're using Node.js 20+
- **Port Conflicts**: Use `npx kill-port 3000` or `npx kill-port 3001`
- **Supabase Connection**: Verify environment variables and project status
- **Authentication Issues**: Check email confirmation and user type validation
- **Socket.IO**: Ensure both servers are running and firewall allows port 3001

### Debug Commands

```bash
# Check Node.js version
node --version

# Kill processes on ports
npx kill-port 3000
npx kill-port 3001

# Check running processes
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

## 📊 Monitoring

- **Frontend Logs**: Browser console
- **Backend Logs**: Terminal running socket server
- **Database Logs**: Supabase dashboard
- **Real-time Events**: Socket.IO admin panel (if configured)

## 🚀 Production Deployment

1. **Build the application**: `npm run build`
2. **Set production environment variables**
3. **Deploy to your preferred platform** (Vercel, Netlify, etc.)
4. **Update Socket.IO server URL** in environment variables
5. **Configure CORS settings** for production domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the [DATABASE.md](./DATABASE.md) for database-related questions
2. Review console logs for error messages
3. Verify all prerequisites are met
4. Ensure environment variables are correctly set

---

**Happy coding! 🎉**