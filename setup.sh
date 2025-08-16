#!/bin/bash

echo "🚀 RideConnect Setup Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install missing dependency
echo "🔧 Installing @supabase/auth-helpers-nextjs..."
npm install @supabase/auth-helpers-nextjs

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard/company
EOF
    echo "✅ .env.local file created. Please update it with your Supabase credentials."
else
    echo "✅ .env.local file already exists."
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Set up your Supabase database (run scripts/01-create-tables.sql)"
echo "3. Run 'npm run dev:all' to start the application"
echo ""
echo "📚 For detailed instructions, see RUN_GUIDE.md"
echo ""
echo "🚀 Setup complete! Happy coding!" 