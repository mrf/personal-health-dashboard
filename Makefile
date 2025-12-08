.PHONY: install install-backend install-frontend dev dev-backend dev-frontend test test-backend test-frontend build clean help audit security

# Default target
help:
	@echo "Personal Health Dashboard - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all dependencies (backend + frontend)"
	@echo "  make install-backend  Install backend dependencies only"
	@echo "  make install-frontend Install frontend dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Run both backend and frontend (requires 2 terminals)"
	@echo "  make dev-backend      Run backend server only"
	@echo "  make dev-frontend     Run frontend server only"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests (backend + frontend)"
	@echo "  make test-backend     Run backend tests only"
	@echo "  make test-frontend    Run frontend tests only"
	@echo "  make coverage         Run tests with coverage reports"
	@echo ""
	@echo "Build:"
	@echo "  make build            Build frontend for production"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo ""
	@echo "Security:"
	@echo "  make audit            Run npm security audit (high+ only)"
	@echo "  make security         Run full security check"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Remove build artifacts and caches"
	@echo "  make reset-db         Clear the health database"

# =============================================================================
# Installation
# =============================================================================

install: install-backend install-frontend
	@echo "✓ All dependencies installed"

install-backend:
	@echo "Installing backend dependencies..."
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt -q
	@echo "✓ Backend ready"

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Frontend ready"

# =============================================================================
# Development Servers
# =============================================================================

dev:
	@echo "Starting development servers..."
	@echo "Backend:  http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@trap 'kill 0' INT TERM; \
		(cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000) & \
		(cd frontend && npm run dev) & \
		wait

dev-backend:
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# =============================================================================
# Testing
# =============================================================================

test: test-backend test-frontend
	@echo ""
	@echo "✓ All tests passed"

test-backend:
	@echo "Running backend tests..."
	cd backend && . venv/bin/activate && python -m pytest tests/ -v

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm run test:run

coverage:
	@echo "Running tests with coverage..."
	cd backend && . venv/bin/activate && python -m pytest tests/ -v --cov=app --cov-report=xml --cov-report=term-missing
	@echo ""
	cd frontend && npm run test:coverage

# =============================================================================
# Build & Quality
# =============================================================================

build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "✓ Build complete: frontend/dist/"

typecheck:
	@echo "Running TypeScript type check..."
	cd frontend && npx tsc --noEmit
	@echo "✓ No type errors"

lint:
	@echo "Linting..."
	-cd backend && . venv/bin/activate && pip install ruff -q && ruff check app/
	cd frontend && npx tsc --noEmit
	@echo "✓ Lint complete"

audit:
	@echo "Running security audit..."
	cd frontend && npm audit --audit-level=high
	@echo "✓ Audit complete"

security: audit
	@echo "Running full security check..."
	cd frontend && npm audit
	@echo ""
	@echo "Note: Dev-only vulnerabilities (esbuild/vite) don't affect production builds"

# =============================================================================
# Utilities
# =============================================================================

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/coverage
	rm -rf backend/.pytest_cache
	rm -rf backend/app/__pycache__
	rm -rf backend/app/routers/__pycache__
	rm -rf backend/tests/__pycache__
	rm -rf backend/.coverage
	rm -rf backend/coverage.xml
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Clean complete"

reset-db:
	@echo "Clearing health database..."
	rm -f data/health.db
	@echo "✓ Database cleared"

# =============================================================================
# Quick start for new users
# =============================================================================

setup: install
	@echo ""
	@echo "============================================"
	@echo "  Setup complete!"
	@echo "============================================"
	@echo ""
	@echo "To start developing, run:"
	@echo "  make dev"
	@echo ""
	@echo "Then open http://localhost:5173"
	@echo ""
