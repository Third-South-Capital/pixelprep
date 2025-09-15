# PixelPrep Testing Guide

This guide outlines the testing strategy, conventions, and procedures for the PixelPrep project.

## 🧪 Testing Philosophy

PixelPrep follows a comprehensive testing approach with:
- **60+ automated tests** covering all major functionality
- **Colocated tests** using the `--test.py` suffix
- **pytest-based** testing framework with async support
- **Real-world validation** using actual image processing scenarios

## 📁 Test Organization

### File Naming Convention
- Primary pattern: `module--test.py` (colocated with source)
- Alternative patterns: `test_*.py`, `*_test.py` (also supported)
- Test files live alongside the code they test

### Test Categories
```
backend/src/
├── api/
│   ├── main--test.py        # FastAPI application tests
│   ├── auth--test.py        # Authentication endpoint tests
│   └── optimize--test.py    # Image optimization API tests
├── processors/
│   ├── base--test.py        # Base processor class tests
│   ├── instagram--test.py   # Instagram preset tests
│   ├── jury--test.py        # Jury submission preset tests
│   ├── web--test.py         # Web display preset tests
│   ├── email--test.py       # Email newsletter preset tests
│   ├── compress--test.py    # Compression preset tests
│   └── custom--test.py      # Custom preset tests
└── storage/
    ├── temporary--test.py   # Memory storage tests
    ├── persistent--test.py  # Database storage tests
    └── supabase_client--test.py # Supabase integration tests
```

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all tests
just test
# or
uv run pytest

# Run specific test file
uv run pytest backend/src/processors/instagram--test.py

# Run tests with coverage
uv run pytest --cov=backend/src

# Run only fast tests (skip slow integration tests)
uv run pytest -m "not slow"

# Run only API tests
uv run pytest -m api

# Run only processor tests
uv run pytest -m processor
```

### Test Markers

Use pytest markers to categorize and filter tests:

```python
import pytest

@pytest.mark.unit
def test_basic_functionality():
    """Unit test example"""
    pass

@pytest.mark.integration
def test_api_integration():
    """Integration test example"""
    pass

@pytest.mark.slow
def test_large_image_processing():
    """Slow test that processes large images"""
    pass

@pytest.mark.auth
def test_authentication_flow():
    """Authentication-related test"""
    pass
```

### Available Markers
- `unit`: Fast unit tests
- `integration`: Integration tests requiring external services
- `slow`: Tests that take significant time (>5 seconds)
- `auth`: Authentication and authorization tests
- `api`: API endpoint tests
- `processor`: Image processing tests

## 🖼️ Image Processing Tests

### Test Image Sources
All processor tests use real artwork samples from:
- `scripts/download_test_images.py` - Downloads standardized test images
- Various dimensions, formats, and quality levels
- Consistent baseline for reproducible testing

### Processor Test Structure
```python
def test_instagram_processing():
    """Test Instagram square preset"""
    # 1. Load test image
    # 2. Apply Instagram preset
    # 3. Verify dimensions (1080x1080)
    # 4. Verify file size (<4MB)
    # 5. Verify format (JPEG)
    # 6. Verify color profile (sRGB)
```

### Processing Validation
Each processor test validates:
- **Dimensions**: Exact pixel dimensions match preset requirements
- **File Size**: Output size within specified limits
- **Format**: Correct image format (JPEG, WebP, etc.)
- **Quality**: Visual quality preservation
- **Metadata**: Proper EXIF and color profile handling

## 🔐 Authentication Tests

### Test Structure
```python
# Anonymous user tests
def test_anonymous_upload():
    """Test image upload without authentication"""
    pass

# Authenticated user tests
def test_authenticated_upload():
    """Test image upload with valid JWT"""
    pass

# Authorization tests
def test_protected_endpoint_access():
    """Test access control on protected endpoints"""
    pass
```

### Authentication Test Scenarios
- **Anonymous Processing**: Verify temporary storage and cleanup
- **JWT Validation**: Test token creation, validation, and expiration
- **Protected Endpoints**: Ensure proper access control
- **User Gallery**: Test authenticated user image management

## 🗄️ Storage Tests

### Dual Storage Testing
PixelPrep uses dual storage architecture:

```python
# Temporary storage (anonymous users)
def test_memory_storage():
    """Test in-memory storage for anonymous users"""
    pass

# Persistent storage (authenticated users)
def test_database_storage():
    """Test Supabase storage for authenticated users"""
    pass
```

### Storage Test Coverage
- **Memory Storage**: Create, retrieve, cleanup
- **Database Storage**: CRUD operations with RLS
- **File Storage**: Supabase Storage integration
- **Cleanup**: Temporary file removal

## 🌐 API Tests

### FastAPI Test Client
```python
from fastapi.testclient import TestClient
from backend.src.api.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test API health check"""
    response = client.get("/health")
    assert response.status_code == 200
```

### API Test Categories
- **Health Checks**: Service availability
- **Upload Endpoints**: File upload handling
- **Processing Endpoints**: Image optimization
- **Authentication**: OAuth flows and JWT handling
- **Error Handling**: Proper error responses

## 📊 Test Configuration

### pytest Configuration (pyproject.toml)
```toml
[tool.pytest.ini_options]
testpaths = ["backend", "scripts"]
python_files = ["*--test.py", "*_test.py", "test_*.py"]
addopts = "-v --tb=short --strict-markers --disable-warnings"
asyncio_mode = "auto"
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "slow: Slow-running tests",
    "auth: Authentication-related tests",
    "api: API endpoint tests",
    "processor: Image processor tests"
]
```

### Environment Setup for Testing
```bash
# Set test environment
export TESTING=true

# Use test database (if different from development)
export SUPABASE_URL=test-project-url
export SUPABASE_ANON_KEY=test-anon-key
```

## 🔄 Continuous Integration

### GitHub Actions Integration
- Tests run on every push and pull request
- Multiple Python versions tested
- Environment isolation
- Test result reporting

### Pre-commit Testing
```bash
# Run before committing
just test
just lint

# Or use git hooks for automatic testing
```

## 📈 Testing Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Test names should describe the scenario
2. **Single Responsibility**: One concept per test
3. **Arrange-Act-Assert**: Clear test structure
4. **Cleanup**: Proper resource cleanup in teardown
5. **Isolation**: Tests should not depend on each other

### Image Processing Test Guidelines
1. **Use Real Images**: Test with actual artwork samples
2. **Validate All Aspects**: Dimensions, size, format, quality
3. **Performance Testing**: Ensure processing time limits
4. **Error Scenarios**: Test invalid inputs and edge cases

### Mock Strategy
- **External Services**: Mock Supabase and OAuth providers
- **File System**: Use temporary directories for file operations
- **Network Calls**: Mock HTTP requests to external APIs
- **Time-Dependent**: Mock datetime for consistent testing

## 🚨 Production Validation

### Deployment Testing
Before production deployment:

```bash
# Run full test suite
uv run pytest

# Run production validation script
python scripts/phase2_validation.py

# Test all presets with real images
python scripts/test_all_presets.py

# Verify optimization performance
python scripts/test_optimization.py
```

### Monitoring Tests
- **Performance**: Response time monitoring
- **Uptime**: Service availability checks
- **Quality**: Image processing quality validation
- **Storage**: Database and file storage health

## 📋 Test Maintenance

### Regular Maintenance Tasks
1. **Update Test Images**: Refresh test image samples quarterly
2. **Review Slow Tests**: Optimize or mark appropriately
3. **Coverage Analysis**: Ensure critical paths are tested
4. **Dependency Updates**: Keep testing libraries current

### Adding New Tests
When adding new features:
1. Write tests first (TDD approach)
2. Add appropriate markers
3. Update this documentation
4. Ensure CI passes

---

This testing strategy ensures PixelPrep maintains high quality, reliability, and performance across all components and deployment scenarios.