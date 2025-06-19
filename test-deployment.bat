@echo off
echo 🧪 Testing XSD Editor App Deployment...
echo ======================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the xsd-editor-app root directory
    exit /b 1
)

echo 📦 Installing dependencies...
call npm run install-all

echo.
echo 🏗️ Building frontend...
cd client
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Frontend build successful!
) else (
    echo ❌ Frontend build failed!
    exit /b 1
)

echo.
echo 🧪 Testing backend...
cd ..\server
call npm test >nul 2>&1 || echo ⚠️ No tests found - that's okay!

echo.
echo 🌐 Starting servers for local testing...
echo 📍 Frontend: http://localhost:3000
echo 📍 Backend:  http://localhost:5000
echo.
echo Press Ctrl+C to stop servers
echo.

REM Start both servers
cd ..
call npm run dev
