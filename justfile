# PixelPrep Build Automation

# Install deps + setup dev env
bootstrap:
    uv sync --dev
    @echo "✅ Bootstrap complete - run 'just dev' to start development server"

# Install deps only
install:
    uv sync

# Run pytest on backend/
test:
    uv run pytest backend/

# Run ruff check + format
lint:
    uv run ruff check .
    uv run ruff format .

# Placeholder for deployment
build:
    @echo "🚧 Build command placeholder - will add deployment logic later"

# Start uvicorn dev server on :8000
dev:
    uv run uvicorn backend.src.api.main:app --reload --host 0.0.0.0 --port 8000