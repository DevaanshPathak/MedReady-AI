# MedReady AI Database Seeding Script
# This script clears and seeds the Supabase database with realistic demo data

Write-Host "🚀 MedReady AI Database Seeding Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
$currentPath = Get-Location
$expectedPath = "D:\MedReady-AI"

if ($currentPath.Path -ne $expectedPath) {
    Write-Host "⚠️  Changing directory to $expectedPath" -ForegroundColor Yellow
    Set-Location $expectedPath
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file with the following variables:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" -ForegroundColor Gray
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can find these values in your Supabase project dashboard under Settings > API" -ForegroundColor Yellow
    exit 1
}

# Check if package.json exists and install dependencies if needed
if (Test-Path "package.json") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
        try {
            if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
                pnpm install
            } elseif (Get-Command "npm" -ErrorAction SilentlyContinue) {
                npm install
            } else {
                Write-Host "❌ Neither npm nor pnpm found" -ForegroundColor Red
                exit 1
            }
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# Confirm before proceeding
Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE ALL existing data in your Supabase database!" -ForegroundColor Yellow
Write-Host "This includes:" -ForegroundColor Yellow
Write-Host "• All learning modules and assessments" -ForegroundColor Gray
Write-Host "• All user progress and certifications" -ForegroundColor Gray
Write-Host "• All deployment applications and emergency alerts" -ForegroundColor Gray
Write-Host "• Chat sessions and AI interactions" -ForegroundColor Gray
Write-Host ""
Write-Host "It will preserve:" -ForegroundColor Green
Write-Host "• User accounts (profiles table)" -ForegroundColor Gray
Write-Host "• Authentication data" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (type 'YES' to proceed)"

if ($confirmation -ne "YES") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Starting database seeding process..." -ForegroundColor Blue

# Run the seeding script
try {
    node "scripts/seed_demo_data.js"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Database seeding completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your MedReady AI platform now has:" -ForegroundColor Cyan
        Write-Host "• 8 comprehensive learning modules covering key medical specialties" -ForegroundColor White
        Write-Host "• 16 realistic medical assessments with evidence-based questions" -ForegroundColor White
        Write-Host "• 25 rural deployment opportunities across India" -ForegroundColor White
        Write-Host "• 4 emergency health alerts for different scenarios" -ForegroundColor White
        Write-Host "• 6 knowledge updates from authoritative sources" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 You can now start your application and explore the demo data!" -ForegroundColor Green
        Write-Host "Run: npm run dev (or pnpm dev)" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Seeding process failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error running seeding script: $_" -ForegroundColor Red
    Write-Host "Please check your Node.js installation and .env file configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Script completed!" -ForegroundColor Green