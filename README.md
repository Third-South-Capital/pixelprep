# PixelPrep 🎨

AI-powered image optimization tool for artists. Resize and optimize artwork for Instagram, jury submissions, websites, and more.

## Features

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
- **Backend**: Python 3.11, FastAPI, Pillow (PIL)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: GitHub OAuth + JWT
- **Testing**: pytest
- **Tooling**: uv, ruff, justfile

### Project Structure
```
pixelprep/
├── backend/src/
│   ├── api/          # FastAPI endpoints
│   ├── processors/   # Image optimization logic
│   └── storage/      # Database and file storage
├── scripts/          # Utility scripts
└── docs/             # Documentation
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

Comprehensive test suite with 57+ tests covering:
- All image processors
- API endpoints  
- Authentication flows
- Storage operations
- Error handling

```bash
# Run all tests
just test

# Test specific component
uv run pytest backend/src/processors/instagram--test.py -v
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

- ✅ **Phase 1**: Core image optimization (5 presets, 57 tests)
- ✅ **Phase 2**: Authentication, persistent storage, user management  
- 🚧 **Phase 3**: React frontend, user dashboard
- 📋 **Phase 4**: Premium features, batch processing

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Run `just lint` before commits
4. Update documentation

## License

Private project - all rights reserved.

---

For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md)