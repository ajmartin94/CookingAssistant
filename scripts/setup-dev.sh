#!/bin/bash
#
# Development Environment Setup Script
#
# This script sets up all dependencies needed for development:
# - System packages for Playwright browsers
# - Python virtual environment and backend dependencies
# - Node.js and frontend dependencies
# - Playwright browsers
# - Default configuration files
# - Database migrations
#
# Usage:
#   ./scripts/setup-dev.sh          # Full setup
#   ./scripts/setup-dev.sh --skip-system  # Skip system packages (if already installed)
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Cooking Assistant Dev Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
SKIP_SYSTEM=false
for arg in "$@"; do
    case $arg in
        --skip-system)
            SKIP_SYSTEM=true
            shift
            ;;
    esac
done

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step headers
step() {
    echo ""
    echo -e "${GREEN}▶ $1${NC}"
    echo "----------------------------------------"
}

# Function to print warnings
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print errors
error() {
    echo -e "${RED}✖ $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✔ $1${NC}"
}

#
# Step 1: Check prerequisites
#
step "Checking prerequisites"

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo "Python: $PYTHON_VERSION"

    # Check if version is 3.10+
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
        error "Python 3.10 or higher is required (found $PYTHON_VERSION)"
        exit 1
    fi
else
    error "Python 3 is not installed"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "Node.js: $NODE_VERSION"

    # Check if version is 20+
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        warn "Node.js 20 or higher is recommended (found $NODE_VERSION)"
    fi
else
    error "Node.js is not installed"
    echo "Please install Node.js 20 LTS or higher"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "npm: $NPM_VERSION"
else
    error "npm is not installed"
    exit 1
fi

success "Prerequisites check passed"

#
# Step 2: Install system dependencies for Playwright (Linux/WSL only)
#
if [ "$SKIP_SYSTEM" = false ]; then
    step "Installing system dependencies for Playwright browsers"

    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        OS=$(uname -s)
    fi

    case "$OS" in
        ubuntu|debian)
            echo "Detected: $OS"
            echo "Installing Playwright browser dependencies..."
            echo "This requires sudo access."
            echo ""

            # Check for sudo
            if ! command_exists sudo; then
                error "sudo is required but not installed"
                exit 1
            fi

            # Install dependencies
            sudo apt-get update
            sudo apt-get install -y --no-install-recommends \
                libasound2t64 \
                libatk-bridge2.0-0t64 \
                libatk1.0-0t64 \
                libatspi2.0-0t64 \
                libcairo2 \
                libcups2t64 \
                libdbus-1-3 \
                libdrm2 \
                libgbm1 \
                libglib2.0-0t64 \
                libnspr4 \
                libnss3 \
                libpango-1.0-0 \
                libx11-6 \
                libxcb1 \
                libxcomposite1 \
                libxdamage1 \
                libxext6 \
                libxfixes3 \
                libxkbcommon0 \
                libxrandr2 \
                xvfb \
                fonts-noto-color-emoji \
                fonts-unifont \
                libfontconfig1 \
                libfreetype6 \
                xfonts-cyrillic \
                xfonts-scalable \
                fonts-liberation \
                fonts-ipafont-gothic \
                fonts-wqy-zenhei \
                fonts-tlwg-loma-otf \
                fonts-freefont-ttf \
                2>/dev/null || {
                    # Try without t64 suffix for older Ubuntu/Debian
                    sudo apt-get install -y --no-install-recommends \
                        libasound2 \
                        libatk-bridge2.0-0 \
                        libatk1.0-0 \
                        libatspi2.0-0 \
                        libcairo2 \
                        libcups2 \
                        libdbus-1-3 \
                        libdrm2 \
                        libgbm1 \
                        libglib2.0-0 \
                        libnspr4 \
                        libnss3 \
                        libpango-1.0-0 \
                        libx11-6 \
                        libxcb1 \
                        libxcomposite1 \
                        libxdamage1 \
                        libxext6 \
                        libxfixes3 \
                        libxkbcommon0 \
                        libxrandr2 \
                        xvfb \
                        fonts-noto-color-emoji \
                        fonts-unifont \
                        libfontconfig1 \
                        libfreetype6 \
                        xfonts-cyrillic \
                        xfonts-scalable \
                        fonts-liberation \
                        fonts-ipafont-gothic \
                        fonts-wqy-zenhei \
                        fonts-tlwg-loma-otf \
                        fonts-freefont-ttf
                }

            success "System dependencies installed"
            ;;
        Darwin|macos)
            echo "Detected: macOS"
            echo "Playwright will handle browser dependencies automatically"
            ;;
        *)
            warn "Unknown OS: $OS"
            echo "You may need to install Playwright browser dependencies manually"
            echo "Run: npx playwright install-deps"
            ;;
    esac
else
    echo "Skipping system dependencies (--skip-system flag)"
fi

#
# Step 3: Setup backend
#
step "Setting up backend"

cd "$PROJECT_ROOT/backend"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    success "Virtual environment created"
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet
success "Python dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        success ".env file created"
    else
        warn "No .env.example found, skipping .env creation"
    fi
else
    echo ".env file already exists"
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head 2>/dev/null || {
    warn "Alembic migrations failed (database may already be up to date)"
}
success "Backend setup complete"

# Deactivate for now
deactivate

#
# Step 4: Setup frontend
#
step "Setting up frontend"

cd "$PROJECT_ROOT/frontend"

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install --silent
success "Node.js dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        success ".env file created"
    else
        warn "No .env.example found, skipping .env creation"
    fi
else
    echo ".env file already exists"
fi

success "Frontend setup complete"

#
# Step 5: Install Playwright browsers
#
step "Installing Playwright browsers"

cd "$PROJECT_ROOT"

echo "Installing Chromium browser..."
npx playwright install chromium
success "Chromium installed"

# Optional: Install other browsers
# echo "Installing Firefox..."
# npx playwright install firefox
# echo "Installing WebKit..."
# npx playwright install webkit

success "Playwright browsers installed"

#
# Step 6: Verify installation
#
step "Verifying installation"

cd "$PROJECT_ROOT"

# Check backend
echo "Checking backend..."
cd backend
source venv/bin/activate
python3 -c "import fastapi; print(f'FastAPI: {fastapi.__version__}')" 2>/dev/null && success "Backend OK" || error "Backend check failed"
deactivate

# Check frontend
echo "Checking frontend..."
cd "$PROJECT_ROOT/frontend"
node -e "console.log('React:', require('react/package.json').version)" 2>/dev/null && success "Frontend OK" || error "Frontend check failed"

# Check Playwright
echo "Checking Playwright..."
cd "$PROJECT_ROOT"
npx playwright --version >/dev/null 2>&1 && success "Playwright OK" || error "Playwright check failed"

#
# Done!
#
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To start development:"
echo ""
echo "  Backend (terminal 1):"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    python -m app.main"
echo ""
echo "  Frontend (terminal 2):"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "To run tests:"
echo "    npm run test:e2e        # E2E tests"
echo "    cd backend && pytest    # Backend tests"
echo "    cd frontend && npm test # Frontend tests"
echo ""
