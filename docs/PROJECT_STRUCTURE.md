# PixelPrep Project Structure

This document outlines the standardized directory structure and organization principles for the PixelPrep project.

## 📁 Root Directory Overview

```
pixelprep/
├── 📁 backend/              # Python backend application
├── 📁 frontend/             # React frontend application
├── 📁 docs/                 # All project documentation
├── 📁 config/               # Configuration files and templates
├── 📁 scripts/              # Utility and automation scripts
├── 📁 .github/              # GitHub workflows and templates
├── 📁 .git/                 # Git repository data
├── 📁 .venv/                # Python virtual environment
├── 📄 .env                  # Environment variables (gitignored)
├── 📄 .env.example          # Environment template
├── 📄 .gitignore            # Git ignore rules
├── 📄 .python-version       # Python version specification
├── 📄 README.md             # Main project documentation
├── 📄 justfile              # Build automation commands
├── 📄 pyproject.toml        # Python project configuration
└── 📄 uv.lock               # Python dependency lock file
```

## 🐍 Backend Structure (`/backend/`)

```
backend/
├── src/
│   ├── api/                 # FastAPI routes and endpoints
│   │   ├── __init__.py
│   │   ├── main.py          # Main application entry point
│   │   ├── main--test.py    # Main application tests
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── auth--test.py    # Authentication tests
│   │   ├── optimize.py      # Image optimization endpoints
│   │   └── optimize--test.py # Optimization tests
│   ├── processors/          # Image processing modules
│   │   ├── __init__.py
│   │   ├── base.py          # Base processor class
│   │   ├── base--test.py    # Base processor tests
│   │   ├── instagram.py     # Instagram preset processor
│   │   ├── instagram--test.py
│   │   ├── jury.py          # Jury submission processor
│   │   ├── jury--test.py
│   │   ├── web.py           # Web display processor
│   │   ├── web--test.py
│   │   ├── email.py         # Email newsletter processor
│   │   ├── email--test.py
│   │   ├── compress.py      # Compression processor
│   │   ├── compress--test.py
│   │   ├── custom.py        # Custom preset processor
│   │   ├── custom--test.py
│   │   └── optimization_utils.py # Shared processing utilities
│   └── storage/             # Data persistence modules
│       ├── __init__.py
│       ├── temporary.py     # In-memory storage for anonymous users
│       ├── temporary--test.py
│       ├── persistent.py    # Database storage for authenticated users
│       ├── persistent--test.py
│       ├── supabase_client.py # Supabase client configuration
│       └── supabase_client--test.py
└── __init__.py              # Backend package marker
```

### Backend Testing Strategy
- **Colocated Tests**: Test files use `--test.py` suffix and live alongside source files
- **pytest Configuration**: Configured in `pyproject.toml` for auto-discovery
- **Test Coverage**: 60+ tests covering all processors, API endpoints, and storage

## ⚛️ Frontend Structure (`/frontend/`)

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── CustomOptionsPanel.tsx
│   │   ├── DarkModeToggle.tsx
│   │   ├── DebugPanel.tsx
│   │   ├── ImageOptimizer.tsx
│   │   ├── LoginPrompt.tsx
│   │   ├── PresetSelector.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── ResultsDisplay.tsx
│   │   ├── SimpleTooltip.tsx
│   │   ├── SizePreview.tsx
│   │   ├── UnifiedWorkflow.tsx
│   │   ├── UploadZone.tsx
│   │   └── UserHeader.tsx
│   ├── contexts/            # React context providers
│   │   └── UploadContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useDarkMode.ts
│   ├── services/            # API and external service integrations
│   │   ├── api.ts           # Backend API client
│   │   ├── auth.ts          # Authentication service
│   │   ├── config.ts        # Configuration management
│   │   ├── storage.ts       # Local storage utilities
│   │   └── supabase.ts      # Supabase client
│   ├── utils/               # Utility functions
│   │   ├── commonUtils.ts   # General utilities
│   │   ├── imageAnalysis.ts # Image processing utilities
│   │   └── sizeEstimation.ts # File size estimation
│   ├── assets/              # Static assets
│   │   └── react.svg
│   ├── archive/             # Archived/alternative versions
│   │   └── App-Simplified.tsx
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   ├── types.ts             # TypeScript type definitions
│   └── vite-env.d.ts        # Vite environment types
├── public/                  # Static public assets
├── dist/                    # Built application (gitignored)
├── .env                     # Frontend environment variables (gitignored)
├── package.json             # Node.js dependencies and scripts
├── package-lock.json        # Node.js dependency lock file
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # TypeScript app-specific config
├── tsconfig.node.json       # TypeScript Node.js config
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js        # PostCSS configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # Frontend-specific documentation
```

### Frontend Architecture
- **React 19**: Latest React with modern hooks and concurrent features
- **TypeScript**: Full type safety with strict configuration
- **TailwindCSS**: Utility-first CSS framework with EntryThingy design system
- **Vite**: Fast build tool with HMR support
- **Component Organization**: Logical grouping by functionality

## 📚 Documentation Structure (`/docs/`)

```
docs/
├── README.md                # Documentation overview
├── CLAUDE.md                # Technical development notes
├── PHASE2_SETUP.md          # Database and auth setup guide
├── PHASE3_PREPARATION.md    # Frontend deployment preparation
├── PROJECT_STRUCTURE.md     # This file - project organization
├── architecture/            # System architecture documentation
│   ├── AUTHENTICATION.md    # Auth system design
│   ├── AUTH_TOGGLE_FEATURE.md # Auth toggle implementation
│   └── DESIGN_SYSTEM.md     # UI/UX design system
├── deployment/              # Deployment guides and procedures
│   ├── DEPLOYMENT.md        # General deployment guide
│   ├── PRODUCTION_ENV_SETUP.md # Production environment setup
│   └── URGENT_SECURITY_FIXES.md # Security patches
├── testing/                 # Testing documentation
│   ├── TESTING_v2.1.0.md    # Version-specific testing
│   └── QUICK_TEST_GUIDE.md  # Quick testing procedures
├── ux/                      # User experience documentation
│   └── ACTUAL_UX_FIXES_IMPLEMENTED.md # UX improvements log
└── releases/                # Release-specific documentation
    └── v2.1.0/              # Version 2.1.0 release docs
        ├── DEPLOYMENT-v2.1.0.md
        ├── DEPLOYMENT_STATUS_v2.1.0.md
        ├── KNOWN-ISSUES-v2.1.0.md
        ├── PRODUCTION-DEPLOYMENT-GUIDE.md
        ├── STAGED-DEPLOYMENT-v2.1.0.md
        └── test_new_features.md
```

### Documentation Principles
- **Hierarchical Organization**: Top-level categories with logical subcategories
- **Version-Specific**: Release documentation isolated by version
- **Audience-Specific**: Technical, deployment, and user-facing docs separated
- **Living Documentation**: Regular updates to reflect current state

## ⚙️ Configuration Structure (`/config/`)

```
config/
├── README.md                # Configuration overview
├── environments/            # Environment-specific configurations
│   ├── .env.development     # Development environment
│   ├── .env.example         # Template for new environments
│   └── .env.phase1          # Phase 1 minimal configuration
└── templates/               # Configuration templates
    ├── .env.phase1.template # Phase 1 setup template
    └── .env.production.template # Production deployment template
```

### Configuration Management
- **Environment Separation**: Clear dev/staging/production boundaries
- **Template System**: Reusable configuration templates
- **Security Focus**: No secrets in templates, comprehensive .gitignore

## 🔧 Scripts Structure (`/scripts/`)

```
scripts/
├── download_test_images.py      # Test image download utility
├── test_all_presets.py          # Comprehensive preset testing
├── test_optimization.py         # Optimization algorithm testing
├── feature-flag-manager.py      # Feature flag management
├── monitoring-setup.py          # System monitoring setup
├── rollback-procedures.py       # Production rollback automation
└── phase2_validation.py         # Phase 2 deployment validation
```

### Script Categories
- **Testing Scripts**: Automated testing and validation
- **Deployment Scripts**: Production deployment automation
- **Utility Scripts**: Development and maintenance utilities
- **Monitoring Scripts**: System health and performance monitoring

## 🔄 Git Workflow

### Branch Naming Conventions
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/description` - Feature development
- `hotfix/issue-description` - Production hotfixes
- `release/version` - Release preparation

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🏗️ Build and Deployment

### Development Workflow
```bash
just bootstrap    # Initial setup
just dev         # Start development server
just test        # Run test suite
just lint        # Code formatting and linting
```

### Environment Variables
- **Root `.env`**: Backend configuration
- **Frontend `.env`**: React environment variables (VITE_ prefix)
- **Templates**: In `/config/templates/` for different deployment phases

### Deployment Targets
- **Backend**: Render.com (Python/FastAPI)
- **Frontend**: GitHub Pages (Static React build)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage + Memory-based temporary

## 🔐 Security Considerations

### File Exclusions (.gitignore)
- All environment files except `.env.example`
- All image files (temporary processing files)
- All build artifacts and dependencies
- IDE and OS-specific files
- Security credentials and keys

### Environment Security
- JWT secrets rotation
- Database credentials protection
- API key management
- CORS origin restrictions

## 📋 Quality Standards

### Code Organization
- **Separation of Concerns**: Clear module boundaries
- **Colocated Tests**: Tests live with their source code
- **Consistent Naming**: Clear, descriptive file and directory names
- **Documentation**: README files at each major level

### Testing Standards
- 60+ automated tests
- Colocated test files using `--test.py` suffix
- Integration and unit test coverage
- Production validation scripts

### Development Tools
- **Python**: uv package manager, ruff linting/formatting
- **Frontend**: ESLint, TypeScript strict mode, Tailwind
- **Automation**: justfile for common tasks
- **CI/CD**: GitHub Actions for deployment

---

This structure promotes maintainability, scalability, and team collaboration while following modern development best practices.