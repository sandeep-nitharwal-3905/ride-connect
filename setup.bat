@echo off
echo 🚀 RideConnect Setup Script
echo ==========================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node -v') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version %NODE_VERSION% detected. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Install missing dependency
echo 🔧 Installing @supabase/auth-helpers-nextjs...
call npm install @supabase/auth-helpers-nextjs

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    (
        echo # Supabase Configuration
        echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo.
        echo # Socket.IO Configuration
        echo NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
        echo SOCKET_PORT=3001
        echo.
        echo # Development Settings
        echo NODE_ENV=development
        echo NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard/company
    ) > .env.local
    echo ✅ .env.local file created. Please update it with your Supabase credentials.
) else (
    echo ✅ .env.local file already exists.
)

echo.
echo 🎯 Next Steps:
echo 1. Update .env.local with your Supabase credentials
echo 2. Set up your Supabase database (run scripts/01-create-tables.sql)
echo 3. Run 'npm run dev:all' to start the application
echo.
echo 📚 For detailed instructions, see RUN_GUIDE.md
echo.
echo 🚀 Setup complete! Happy coding!
pause 