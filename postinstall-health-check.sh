#!/bin/bash
# ModuleMancer Post-Install Health Check
# Verifies project health after dependency changes

set -e

echo "🏥 ModuleMancer Post-Install Health Check"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[HEALTH CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0

# Function to run a check
run_check() {
    local check_name="$1"
    local command="$2"
    local success_msg="$3"
    local warning_msg="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_status "Running: $check_name"
    
    if eval "$command" &>/dev/null; then
        print_success "$success_msg"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        if [ -n "$warning_msg" ]; then
            print_warning "$warning_msg"
            WARNINGS=$((WARNINGS + 1))
        else
            print_error "Check failed: $check_name"
        fi
    fi
}

echo ""
print_status "Checking CLIENT health..."
echo "-------------------------"

cd client

# Check if node_modules exists
run_check "Client node_modules" \
    "[ -d node_modules ]" \
    "Client dependencies are installed" \
    "Client node_modules missing - run 'npm install'"

# Check for security vulnerabilities (moderate and above)
run_check "Client security audit" \
    "npm audit --audit-level moderate" \
    "No moderate+ vulnerabilities found in client" \
    "Client has security vulnerabilities - review npm audit output"

# Check for missing dependencies
run_check "Client dependency check" \
    "npx depcheck --json | jq -e '.missing | length == 0'" \
    "No missing dependencies in client" \
    "Client has missing dependencies - check depcheck output"

# Test if build works
run_check "Client build test" \
    "npm run build" \
    "Client builds successfully" \
    "Client build failed - check build configuration"

cd ..

echo ""
print_status "Checking SERVER health..."
echo "-------------------------"

cd server

# Check if node_modules exists
run_check "Server node_modules" \
    "[ -d node_modules ]" \
    "Server dependencies are installed" \
    "Server node_modules missing - run 'npm install'"

# Check for security vulnerabilities (moderate and above)
run_check "Server security audit" \
    "npm audit --audit-level moderate" \
    "No moderate+ vulnerabilities found in server" \
    "Server has security vulnerabilities - review npm audit output"

# Check for missing dependencies  
run_check "Server dependency check" \
    "npx depcheck --json | jq -e '.missing | length == 0'" \
    "No missing dependencies in server" \
    "Server has missing dependencies - check depcheck output"

# Test if server can start (syntax check)
run_check "Server syntax check" \
    "node --check server.mjs" \
    "Server code syntax is valid" \
    "Server has syntax errors"

cd ..

echo ""
print_status "Checking ENVIRONMENT setup..."
echo "------------------------------"

# Check for environment files
run_check "Production env files" \
    "[ -f server/.env.production ] && [ -f client/.env.production ]" \
    "Production environment files exist" \
    "Missing production .env files"

# Check for development env files (warn only)
run_check "Development env files" \
    "[ -f server/.env ] && [ -f client/.env ]" \
    "Development environment files exist" \
    "Consider creating .env files for development (see .env.production examples)"

echo ""
print_status "Checking VERSION consistency..."
echo "-------------------------------"

# Check axios versions
CLIENT_AXIOS=$(cd client && node -p "require('./package.json').dependencies.axios" 2>/dev/null || echo "missing")
SERVER_AXIOS=$(cd server && node -p "require('./package.json').dependencies.axios" 2>/dev/null || echo "missing")

if [ "$CLIENT_AXIOS" = "$SERVER_AXIOS" ]; then
    print_success "Axios versions are consistent: $CLIENT_AXIOS"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    print_warning "Axios version mismatch - Client: $CLIENT_AXIOS, Server: $SERVER_AXIOS"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""
print_status "Checking for OUTDATED packages..."
echo "----------------------------------"

cd client
OUTDATED_CLIENT=$(npx npm-check-updates --target minor --silent | grep -c "^>" || echo "0")
if [ "$OUTDATED_CLIENT" -gt 0 ]; then
    print_warning "Client has $OUTDATED_CLIENT minor/patch updates available"
    WARNINGS=$((WARNINGS + 1))
else
    print_success "Client packages are up to date (minor/patch level)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

cd ../server
OUTDATED_SERVER=$(npx npm-check-updates --target minor --silent | grep -c "^>" || echo "0")
if [ "$OUTDATED_SERVER" -gt 0 ]; then
    print_warning "Server has $OUTDATED_SERVER minor/patch updates available"
    WARNINGS=$((WARNINGS + 1))
else
    print_success "Server packages are up to date (minor/patch level)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

cd ..

echo ""
echo "🎯 HEALTH CHECK SUMMARY"
echo "======================="
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Warnings: $WARNINGS"
echo "Failed: $((TOTAL_CHECKS - PASSED_CHECKS - WARNINGS))"

if [ $((TOTAL_CHECKS - PASSED_CHECKS - WARNINGS)) -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        print_success "🎉 All health checks passed! Your project is in excellent shape."
        echo ""
        echo "ModuleMancer Health Score: 10/10 🏆"
    else
        print_warning "⚠️ Health checks passed with $WARNINGS warnings. Review above for improvements."
        echo ""
        SCORE=$((10 - WARNINGS))
        echo "ModuleMancer Health Score: $SCORE/10"
    fi
else
    print_error "❌ Some health checks failed. Please address the issues above."
    echo ""
    FAILED=$((TOTAL_CHECKS - PASSED_CHECKS - WARNINGS))
    SCORE=$((10 - (FAILED * 3) - WARNINGS))
    if [ $SCORE -lt 0 ]; then SCORE=0; fi
    echo "ModuleMancer Health Score: $SCORE/10"
fi

echo ""
echo "📊 Next Steps:"
echo "- Review DEPENDENCY_AUDIT_REPORT.md for detailed analysis"
echo "- Consider running major version updates when ready"
echo "- Set up automated dependency monitoring (Dependabot/Renovate)"
echo "- Schedule regular health checks (monthly recommended)"
echo ""
echo "🔍 ModuleMancer recommends running this health check after any dependency changes."