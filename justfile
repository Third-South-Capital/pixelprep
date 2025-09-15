# PixelPrep Build Automation

set dotenv-load

# Install deps + setup dev env
bootstrap:
    uv sync --dev
    @echo "📋 Creating .env from .env.example if it doesn't exist..."
    @test -f .env || cp .env.example .env
    @echo "✅ Bootstrap complete - configure .env then run 'just dev'"

# Install deps only
install:
    uv sync

# Run all tests
test:
    uv run pytest

# Run tests with coverage report
test-coverage:
    uv run pytest --cov=backend/src --cov-report=html --cov-report=term

# Run only fast tests (skip slow integration tests)
test-fast:
    uv run pytest -m "not slow"

# Run specific test category
test-api:
    uv run pytest -m api

test-processors:
    uv run pytest -m processor

test-auth:
    uv run pytest -m auth

# Run production validation
test-production:
    python scripts/phase2_validation.py

# Run ruff check + format
lint:
    uv run ruff check .
    uv run ruff format .

# Check environment variables are configured
check-env:
    @echo "🔍 Checking environment configuration..."
    @test -f .env || (echo "❌ .env file not found. Run 'just bootstrap' first." && exit 1)
    @test "${SUPABASE_URL}" != "https://your-project-id.supabase.co" || (echo "❌ SUPABASE_URL not configured in .env" && exit 1)
    @test "${SUPABASE_SERVICE_KEY}" != "your_service_key_here" || (echo "❌ SUPABASE_SERVICE_KEY not configured in .env" && exit 1)
    @echo "✅ Environment variables configured"

# Install new dependencies
deps:
    uv sync --dev
    @echo "✅ Dependencies updated"

# Placeholder for deployment
build:
    @echo "🚧 Build command placeholder - will add deployment logic later"

# Start uvicorn dev server on :8000 with environment variables
dev:
    @just check-env
    uv run uvicorn backend.src.api.main:app --reload --host 0.0.0.0 --port 8000

# Start dev server without env check (for testing)
dev-no-check:
    uv run uvicorn backend.src.api.main:app --reload --host 0.0.0.0 --port 8000