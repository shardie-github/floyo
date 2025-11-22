#!/bin/bash
# Development helper script for solo operators
# Makes it easy to start, test, and maintain the project

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main menu
show_menu() {
    echo ""
    echo "=========================================="
    echo "  Floyo Development Helper"
    echo "=========================================="
    echo ""
    echo "1) Install dependencies"
    echo "2) Start development servers"
    echo "3) Run tests"
    echo "4) Run linters"
    echo "5) Format code"
    echo "6) Check environment setup"
    echo "7) Database operations"
    echo "8) Clean build artifacts"
    echo "9) Full health check"
    echo "0) Exit"
    echo ""
    read -p "Choose an option: " choice
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    
    if command_exists python3; then
        print_info "Installing Python dependencies..."
        pip install -r requirements.txt || pip3 install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "Python not found. Skipping Python dependencies."
    fi
    
    if command_exists npm; then
        print_info "Installing Node dependencies..."
        npm install
        cd frontend && npm install && cd ..
        print_success "Node dependencies installed"
    else
        print_warning "npm not found. Skipping Node dependencies."
    fi
}

# Start development servers
start_dev() {
    print_info "Starting development servers..."
    print_info "Frontend will run on http://localhost:3000"
    print_info "Backend will run on http://localhost:8000"
    
    # Start backend in background
    if command_exists python3; then
        cd backend
        python3 -m uvicorn main:app --reload &
        BACKEND_PID=$!
        cd ..
        print_success "Backend started (PID: $BACKEND_PID)"
    fi
    
    # Start frontend
    if command_exists npm; then
        cd frontend
        npm run dev
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    if command_exists pytest; then
        print_info "Running Python tests..."
        cd backend
        pytest tests/unit/ -v || true
        cd ..
    fi
    
    if command_exists npm; then
        print_info "Running TypeScript tests..."
        cd frontend
        npm test || true
        cd ..
    fi
}

# Run linters
run_linters() {
    print_info "Running linters..."
    
    if command_exists ruff; then
        print_info "Linting Python code..."
        cd backend
        ruff check . || true
        cd ..
    fi
    
    if command_exists npm; then
        print_info "Linting TypeScript code..."
        cd frontend
        npm run lint || true
        cd ..
    fi
}

# Format code
format_code() {
    print_info "Formatting code..."
    
    if command_exists black; then
        print_info "Formatting Python code..."
        cd backend
        black . || true
        cd ..
    fi
    
    if command_exists npm; then
        print_info "Formatting TypeScript code..."
        npm run format || true
    fi
}

# Check environment
check_env() {
    print_info "Checking environment setup..."
    
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found. Copying from .env.example..."
        cp .env.example .env.local 2>/dev/null || print_warning "No .env.example found"
    else
        print_success ".env.local exists"
    fi
    
    # Check for critical env vars
    if [ -f ".env.local" ]; then
        print_info "Checking critical environment variables..."
        source .env.local 2>/dev/null || true
        
        if [ -z "$SUPABASE_URL" ]; then
            print_warning "SUPABASE_URL not set"
        else
            print_success "SUPABASE_URL is set"
        fi
    fi
}

# Database operations
db_ops() {
    echo ""
    echo "Database Operations:"
    echo "1) Generate Prisma client"
    echo "2) Run migrations"
    echo "3) Open Prisma Studio"
    echo "0) Back to main menu"
    read -p "Choose: " db_choice
    
    case $db_choice in
        1)
            print_info "Generating Prisma client..."
            npm run prisma:generate
            ;;
        2)
            print_info "Running migrations..."
            npm run prisma:migrate
            ;;
        3)
            print_info "Opening Prisma Studio..."
            npm run prisma:studio
            ;;
    esac
}

# Clean build artifacts
clean() {
    print_info "Cleaning build artifacts..."
    
    # Remove Python cache
    find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Remove Node build artifacts
    rm -rf frontend/.next 2>/dev/null || true
    rm -rf frontend/node_modules/.cache 2>/dev/null || true
    
    # Remove test artifacts
    rm -rf .pytest_cache 2>/dev/null || true
    rm -rf htmlcov 2>/dev/null || true
    rm -rf coverage 2>/dev/null || true
    
    print_success "Clean complete"
}

# Full health check
health_check() {
    print_info "Running full health check..."
    
    echo ""
    print_info "1. Checking dependencies..."
    install_deps
    
    echo ""
    print_info "2. Checking environment..."
    check_env
    
    echo ""
    print_info "3. Running linters..."
    run_linters
    
    echo ""
    print_info "4. Running tests..."
    run_tests
    
    echo ""
    print_success "Health check complete!"
}

# Main loop
main() {
    while true; do
        show_menu
        
        case $choice in
            1) install_deps ;;
            2) start_dev ;;
            3) run_tests ;;
            4) run_linters ;;
            5) format_code ;;
            6) check_env ;;
            7) db_ops ;;
            8) clean ;;
            9) health_check ;;
            0) 
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_warning "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
