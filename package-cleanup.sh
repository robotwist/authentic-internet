#!/bin/bash
# ModuleMancer Package Cleanup Script
# Removes unused dependencies and adds missing ones

set -e

echo "🧹 ModuleMancer Package Cleanup Starting..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "Cleaning up CLIENT dependencies..."
echo "-----------------------------------"

cd client

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "Client package.json not found!"
    exit 1
fi

print_status "Removing unused client dependencies..."
npm uninstall @emotion/react @emotion/styled zustand 2>/dev/null || print_warning "Some client dependencies may not have been installed"

print_status "Removing unused client devDependencies..."
npm uninstall @types/react @types/react-dom eslint-config-standard eslint-plugin-import jsdom 2>/dev/null || print_warning "Some client devDependencies may not have been installed"

print_success "Client cleanup completed!"

cd ..

print_status "Cleaning up SERVER dependencies..."
echo "-----------------------------------"

cd server

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "Server package.json not found!"
    exit 1
fi

print_status "Removing unused server dependencies..."
npm uninstall crypto mongodb swagger-jsdoc swagger-ui-express uuid 2>/dev/null || print_warning "Some server dependencies may not have been installed"

print_status "Adding missing server dependencies..."
npm install chalk inquirer @jest/globals --save-dev

print_success "Server cleanup completed!"

cd ..

print_status "Running security audit fixes..."
echo "--------------------------------"

cd client
print_status "Fixing client vulnerabilities..."
npm audit fix || print_warning "Some client vulnerabilities may require manual intervention"

cd ../server
print_status "Fixing server vulnerabilities..."
npm audit fix || print_warning "Some server vulnerabilities may require manual intervention"

cd ..

print_status "Harmonizing dependency versions..."
echo "----------------------------------"

cd client
print_status "Updating client axios to match server..."
npm install axios@^1.8.1

cd ../server
print_status "Updating server axios to match client..."
npm install axios@^1.8.1

cd ..

print_success "🎉 ModuleMancer cleanup completed successfully!"
echo ""
echo "Summary of actions taken:"
echo "========================"
echo "✅ Removed unused client dependencies: @emotion/react, @emotion/styled, zustand"
echo "✅ Removed unused client devDependencies: @types/react, @types/react-dom, eslint-config-standard, eslint-plugin-import, jsdom"
echo "✅ Removed unused server dependencies: crypto, mongodb, swagger-jsdoc, swagger-ui-express, uuid"
echo "✅ Added missing server devDependencies: chalk, inquirer, @jest/globals"
echo "✅ Applied security vulnerability fixes"
echo "✅ Harmonized axios versions between client and server"
echo ""
echo "Next steps:"
echo "----------"
echo "1. Test your application to ensure everything still works"
echo "2. Review the DEPENDENCY_AUDIT_REPORT.md for major version updates"
echo "3. Consider creating .env.example files for development setup"
echo "4. Run 'npm run dev' to test the application"
echo ""
echo "🔍 Run './postinstall-health-check.sh' to verify the cleanup!"