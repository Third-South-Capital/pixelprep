# PixelPrep - Professional Image Optimization for Artists

[![Production Status](https://img.shields.io/badge/status-live-success)](https://third-south-capital.github.io/pixelprep/)
[![Version](https://img.shields.io/badge/version-v2.1.5-blue)](#)
[![Backend API](https://img.shields.io/badge/API-live-green)](https://pixelprep.onrender.com/health)
[![Design System](https://img.shields.io/badge/UI-EntryThingy-purple)](https://entrythingy.com)

> **🎨 Transform your artwork for any platform with professional optimization presets designed specifically for artists.**

**PixelPrep** is a production-ready freemium image optimization service featuring a professional **EntryThingy design system** interface. Upload artwork, select a preset, and download optimized versions instantly - perfect for Instagram, jury submissions, web galleries, and more.

## 🚀 Live Application

**🌐 Frontend**: [https://third-south-capital.github.io/pixelprep/](https://third-south-capital.github.io/pixelprep/)
**🔧 Backend API**: [https://pixelprep.onrender.com/](https://pixelprep.onrender.com/) (Health: [/health](https://pixelprep.onrender.com/health))

## Features

### 🎨 Professional Design System
- **EntryThingy UI**: Clean, professional interface matching EntryThingy's design language
- **Enhanced Visual Hierarchy**: Prominent upload zone with clear primary action (v2.1.5)
- **Intuitive Status Indicators**: Redesigned step indicators as non-intrusive status elements
- **Dark/Light Mode**: Complete theme support with user preference persistence
- **Typography**: Outfit font with proper hierarchy and accessibility
- **Responsive Design**: Optimized for all devices and screen sizes

### Image Optimization Presets
- **Instagram Square**: 1080×1080px, <4MB, JPEG, sRGB
- **Jury Submission**: 1920px longest side, 1-2MB, JPEG, 72-300 DPI
- **Web Display**: 1920px wide, <500KB, WebP with JPEG fallback
- **Email Newsletter**: 600px wide, <200KB, JPEG
- **Quick Compress**: Keep dimensions, reduce file size by 70%
- **Custom Presets**: User-defined optimization with quality, format, and dimension controls (v2.1.0+)

### Enhanced User Experience
- **Smart Recommendations**: AI-powered preset suggestions based on image analysis
- **Before & After Comparisons**: Aligned measurement boxes for clear size savings (v2.1.5)
- **Real-Time Size Preview**: File size estimates before processing
- **Simplified Custom Controls**: Direct quality and dimension inputs (v2.1.1)

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
curl -X POST "https://pixelprep.onrender.com/optimize/" \
  -F "file=@image.jpg" \
  -F "preset=instagram_square"
```

**Authenticated Upload:**
```bash
curl -X POST "https://pixelprep.onrender.com/optimize/" \
  -H "Authorization: Bearer <jwt_token>" \
  -F "file=@image.jpg" \
  -F "preset=jury_submission"
```

## API Endpoints

### System Health
- `GET /health` - API health check

### Core Processing
- `POST /optimize/` - Process image with preset (supports `format=image|zip` query parameter)
- `GET /optimize/processors` - List available optimization presets

### Authentication
- `GET /auth/github/login` - Start GitHub OAuth flow
- `GET /auth/github/callback` - Handle GitHub OAuth callback
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout current user
- `GET /auth/health` - Auth service status
- `GET /auth/protected` - Test protected endpoint

### User Management (Protected)
- `GET /optimize/images` - User's image gallery
- `GET /optimize/images/{image_id}/optimizations` - Optimization history for specific image
- `DELETE /optimize/images/{image_id}` - Delete specific image
- `GET /optimize/usage` - Storage usage statistics

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
- **Frontend**: React 19.1.1, TypeScript, TailwindCSS v3.4, Vite 7.1.2
- **Design System**: EntryThingy UI with Outfit font, CSS variables, dark/light modes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage + Memory-based temporary storage
- **Auth**: GitHub OAuth + JWT tokens (HS256, 30-min expiry)
- **Testing**: pytest (60+ tests), colocated test files
- **Tooling**: uv, ruff, eslint, justfile
- **Deployment**: Development only (not yet deployed to production)

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

See [PHASE2_SETUP.md](./docs/PHASE2_SETUP.md) for detailed setup instructions.

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
python scripts/phase2_validation.py
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

## Production Status

- ✅ **Phase 1**: Core image optimization (5 presets, 60+ tests) - *COMPLETED*
- ✅ **Phase 2**: Authentication, persistent storage, user management - *COMPLETED*
- ✅ **Phase 3**: React frontend, professional UI/UX - *COMPLETED*
- ✅ **Phase 4**: Production deployment with enhanced UX - *LIVE*
- 📈 **Current**: Live production system serving users

### Production Live v2.1.5 ✅
**🌐 Frontend**: React 19.1.1 + TypeScript → GitHub Pages (Live)
**⚙️ Backend**: FastAPI + Python 3.11 → Render.com (Live)
**🗄️ Database**: Supabase PostgreSQL with RLS (Active)
**🔐 Authentication**: GitHub OAuth + JWT (Active)
**🎨 UI/UX**: Enhanced visual hierarchy with simplified workflow
**📊 Status**: **Production live**, serving artists worldwide

### Key Production Features
- **Enhanced Upload Zone**: Prominent visual hierarchy (v2.1.5)
- **Intuitive Status Flow**: Redesigned step indicators as status elements
- **Aligned Comparisons**: Before/after measurement boxes at consistent height
- **Smart Recommendations**: AI-powered preset suggestions based on image analysis
- **Custom Optimization**: User-defined quality, format, and dimensions (v2.1.0)
- **Anonymous + Authenticated**: Instant processing or persistent galleries
- **Professional Results**: Celebration UI with accurate file size reporting

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Run `just lint` before commits
4. Update documentation

## License

Private project - all rights reserved.

---

For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md)