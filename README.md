# PixelPrep - Professional Image Optimization for Artists

[![Production Status](https://img.shields.io/badge/status-production-success)](https://third-south-capital.github.io/pixelprep/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Third-South-Capital/pixelprep/releases/tag/v2.0.0)
[![Backend API](https://img.shields.io/badge/API-live-success)](https://pixelprep.onrender.com/health)
[![Design System](https://img.shields.io/badge/UI-EntryThingy-purple)](https://entrythingy.com)

> **🎨 Transform your artwork for any platform with professional optimization presets designed specifically for artists.**

**PixelPrep** is a production-ready freemium image optimization service featuring a professional **EntryThingy design system** interface. Upload artwork, select a preset, and download optimized versions instantly - perfect for Instagram, jury submissions, web galleries, and more.

## 🚀 Live Application

**🌐 Frontend**: [https://third-south-capital.github.io/pixelprep/](https://third-south-capital.github.io/pixelprep/)
**🔧 Backend API**: [https://pixelprep.onrender.com/](https://pixelprep.onrender.com/)

## Features

### 🎨 Professional Design System
- **EntryThingy UI**: Clean, professional interface matching EntryThingy's design language
- **Dark/Light Mode**: Complete theme support with user preference persistence
- **Typography**: Outfit font with proper hierarchy and accessibility
- **Responsive Design**: Optimized for all devices and screen sizes

### Image Optimization Presets
- **Instagram Square**: 1080×1080px, <4MB, JPEG, sRGB
- **Jury Submission**: 1920px longest side, 1-2MB, JPEG, 72-300 DPI  
- **Web Display**: 1920px wide, <500KB, WebP with JPEG fallback
- **Email Newsletter**: 600px wide, <200KB, JPEG
- **Quick Compress**: Keep dimensions, reduce file size by 70%

### Dual-Mode Operation
- **Anonymous Users**: Instant processing with temporary storage
- **Authenticated Users**: Persistent storage, image gallery, optimization history

### Authentication
- GitHub OAuth integration
- JWT-based session management
- User image galleries and management

## Quick Start

### Development Setup

```bash
# Clone and setup
git clone <repository>
cd pixelprep
just bootstrap

# Configure environment (copy and edit with real values)
cp .env.example .env

# Start development server
just dev
```

### API Usage

**Anonymous Upload:**
```bash
curl -X POST "http://localhost:8000/optimize/" \
  -F "file=@image.jpg" \
  -F "preset=instagram_square"
```

**Authenticated Upload:**
```bash
curl -X POST "http://localhost:8000/optimize/" \
  -H "Authorization: Bearer <jwt_token>" \
  -F "file=@image.jpg" \
  -F "preset=jury_submission"
```

## API Endpoints

### Core Processing
- `POST /optimize/` - Process image with preset
- `GET /optimize/processors` - List available presets

### Authentication  
- `GET /auth/github/login` - Start GitHub OAuth flow
- `GET /auth/me` - Get current user info
- `GET /auth/health` - Auth service status

### User Management (Protected)
- `GET /optimize/images` - User's image gallery
- `GET /optimize/images/{id}/optimizations` - Optimization history
- `DELETE /optimize/images/{id}` - Delete image
- `GET /optimize/usage` - Storage usage stats

## Development Commands

```bash
just bootstrap    # Setup development environment
just dev         # Start development server  
just test        # Run test suite
just lint        # Format and lint code
just check-env   # Verify environment configuration
```

## Architecture

### Tech Stack
- **Backend**: Python 3.11, FastAPI, Pillow (PIL), uvicorn
- **Frontend**: React 19, TypeScript, TailwindCSS v3, Vite
- **Design System**: EntryThingy UI with Outfit font, CSS variables, dark/light modes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage + Memory-based temporary storage
- **Auth**: GitHub OAuth + JWT tokens (HS256, 30-min expiry)
- **Testing**: pytest (60+ tests), colocated test files
- **Tooling**: uv, ruff, eslint, justfile
- **Deployment**: Render.com (backend), GitHub Pages (frontend)

### Project Structure
```
pixelprep/
├── backend/src/
│   ├── api/          # FastAPI endpoints (auth, optimize, main)
│   ├── processors/   # Image optimization logic (5 presets)
│   └── storage/      # Database and file storage (dual-mode)
├── frontend/src/
│   ├── components/   # React components
│   ├── services/     # API integration
│   └── types/        # TypeScript definitions
├── scripts/          # Utility scripts
├── .github/          # CI/CD workflows
└── docs/             # Documentation (CLAUDE.md, PHASE2_SETUP.md)
```

## Setup Requirements

### Phase 1 (Standalone)
- Python 3.11+
- uv package manager

### Phase 2 (Full Features)  
- Supabase project
- GitHub OAuth app
- Environment configuration

See [PHASE2_SETUP.md](./PHASE2_SETUP.md) for detailed setup instructions.

## Testing

Comprehensive test suite with 60+ tests covering:
- All 5 image processors with real artwork samples
- Complete API endpoint coverage (auth, optimize, gallery)
- Authentication flows (GitHub OAuth, JWT, protected routes)
- Dual storage operations (anonymous + authenticated)
- Error handling and edge cases
- Production validation suite

```bash
# Run all tests
just test

# Test specific component
uv run pytest backend/src/processors/instagram--test.py -v

# Run production validation
python phase2_validation.py
```

## Security

- Row Level Security (RLS) for user data isolation
- JWT token expiration (30min default)
- No sensitive data in codebase
- Environment variable configuration
- OAuth-only authentication (no passwords)

## Performance

- <2 second image processing
- 75-90% file size reduction
- Concurrent request handling
- Memory-efficient processing
- Production-ready error handling

## Development Status

- ✅ **Phase 1**: Core image optimization (5 presets, 60+ tests) - *COMPLETED*
- ✅ **Phase 2**: Authentication, persistent storage, user management (100% validation) - *COMPLETED*
- ✅ **Phase 3**: React frontend, professional UI/UX, production deployment - *COMPLETED*
- 🚀 **Current**: Live production system with dual-mode operation
- 📋 **Phase 4**: Premium features, batch processing, analytics

### Production Ready v1.0.0 ✅
**🌐 Frontend**: React 19 + TypeScript → GitHub Pages (live)  
**⚙️ Backend**: FastAPI + Python 3.11 → Render.com (live)  
**🗄️ Database**: Supabase PostgreSQL with RLS (configured)  
**🔐 Authentication**: GitHub OAuth + JWT (fully functional)  
**🎨 UI/UX**: Professional TailwindCSS interface (polished)  
**📊 Status**: **LIVE and serving users** at https://third-south-capital.github.io/pixelprep/

### Key Features in Production
- **Anonymous Processing**: Instant upload → optimize → download
- **Authenticated Users**: Persistent gallery + optimization history 
- **5 Professional Presets**: Instagram, Jury, Web, Email, Compression
- **Dual Storage Architecture**: Memory-based + Supabase persistence
- **GitHub OAuth**: Secure authentication with JWT tokens
- **CORS Configured**: Production + development domains

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Run `just lint` before commits
4. Update documentation

## License

Private project - all rights reserved.

---

For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md)