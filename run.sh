#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────────────────────
# DeepBlue – Project Launcher
# Sets up a Python virtual environment and starts the live demo API server
# ─────────────────────────────────────────────────────────────────────────────

set -e

PYTHON=/opt/homebrew/bin/python3.11
VENV_DIR="$(dirname "$0")/demo/.venv"
DEMO_DIR="$(dirname "$0")/demo"

# ── ANSI colours ─────────────────────────────────────────────────────────────
BLUE='\033[0;34m'; CYAN='\033[0;36m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; RESET='\033[0m'

banner() {
  echo ""
  echo "${BLUE}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo "${BLUE}${BOLD}║   🌊  DeepBlue – Oceanographic Research Platform             ║${RESET}"
  echo "${BLUE}${BOLD}║        Enterprise DevOps Demo  |  v2.4.1                     ║${RESET}"
  echo "${BLUE}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

step() { echo "${CYAN}▶  $1${RESET}"; }
ok()   { echo "${GREEN}✔  $1${RESET}"; }
warn() { echo "${YELLOW}⚠  $1${RESET}"; }
fail() { echo "${RED}✖  $1${RESET}"; exit 1; }

banner

# ── Check Python ──────────────────────────────────────────────────────────────
step "Checking Python 3.11..."
if ! command -v "$PYTHON" &>/dev/null; then
  fail "Python 3.11 not found at $PYTHON. Install via: brew install python@3.11"
fi
ok "$($PYTHON --version)"

# ── Create virtual environment ────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
  step "Creating virtual environment..."
  $PYTHON -m venv "$VENV_DIR"
  ok "Virtual environment created at demo/.venv"
else
  ok "Virtual environment already exists"
fi

# ── Activate venv ─────────────────────────────────────────────────────────────
source "$VENV_DIR/bin/activate"

# ── Install dependencies ───────────────────────────────────────────────────────
step "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r "$DEMO_DIR/requirements.txt"
ok "All dependencies installed"

# ── Print startup info ────────────────────────────────────────────────────────
echo ""
echo "${BOLD}${GREEN}  🚀 Starting DeepBlue Demo API Server...${RESET}"
echo ""
echo "  ${BOLD}Available Endpoints:${RESET}"
echo "  ${CYAN}http://localhost:8000${RESET}               Platform overview"
echo "  ${CYAN}http://localhost:8000/docs${RESET}          Interactive API docs (Swagger UI)"
echo "  ${CYAN}http://localhost:8000/redoc${RESET}         ReDoc documentation"
echo "  ${CYAN}http://localhost:8000/metrics${RESET}       Prometheus metrics scrape endpoint"
echo "  ${CYAN}http://localhost:8000/health${RESET}        Health status"
echo ""
echo "  ${BOLD}Key API Routes:${RESET}"
echo "  GET  ${CYAN}/v1/sensors${RESET}                   List all 50 global sensors"
echo "  GET  ${CYAN}/v1/ocean-basins${RESET}              Per-basin climate stats"
echo "  GET  ${CYAN}/v1/alerts${RESET}                    Active anomaly alerts"
echo "  GET  ${CYAN}/v1/ingestion/feed${RESET}            Live data ingestion stream"
echo "  GET  ${CYAN}/v1/climate/summary${RESET}           Global climate metrics"
echo "  GET  ${CYAN}/v1/infrastructure/status${RESET}     Simulated EKS cluster status"
echo "  POST ${CYAN}/v1/sensors/ingest${RESET}            Ingest a sensor reading"
echo ""
echo "  ${BOLD}API Key (for write endpoints):${RESET}"
echo "  ${YELLOW}X-Api-Key: deepblue-demo-key-2026${RESET}"
echo ""
echo "  ${BOLD}Press Ctrl+C to stop.${RESET}"
echo ""
echo "  ${BLUE}────────────────────────────────────────────────────────────────${RESET}"
echo ""

# ── Start server ──────────────────────────────────────────────────────────────
cd "$DEMO_DIR"
python main.py
