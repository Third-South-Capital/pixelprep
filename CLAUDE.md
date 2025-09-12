# CLAUDE.md - PixelPrep

<!-- 
User Context: ../CONTEXT.md
Last Updated: 2025-09-12
Phase 1: COMPLETED ✅
Phase 2: COMPLETED ✅ (Database integration validated 100%)
-->

This file provides guidance to Claude Code when working with PixelPrep.

## Project Overview
PixelPrep is a freemium image optimization tool for artists who need to resize/optimize artwork for various platforms (Instagram, jury submissions, websites, etc.). 

**Core Flow**: Upload image → Select preset → Download optimized version(s)
**Business Model**: Free for 1-2 images, then SSO login required for unlimited use
**Hidden Goal**: Build artist email list + collect artwork samples for AI analysis

## Technical Architecture

### Tech Stack (Free Tier Focus)
- **Backend**: Python 3.11, FastAPI, Pillow (PIL)
- **Dependencies**: Managed with `uv` (not pip)
- **Testing**: `pytest` with colocated tests (`file--test.py`)
- **Linting**: `ruff` (handles both linting and formatting)
- **Build**: `justfile` with required commands
- **Hosting**: Render.com free tier (Phase 1)
- **Future**: Supabase (auth/db), Vercel (frontend)

### Directory Structure
```
pixelprep/
├── justfile                     # Build automation
├── pyproject.toml              # uv dependencies
├── .python-version             # Pin to 3.11
├── scripts/                    # Python utility scripts
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py              # FastAPI app
│   │   │   ├── main--test.py        # Colocated tests
│   │   │   ├── optimize.py          # Image endpoints
│   │   │   └── optimize--test.py
│   │   ├── processors/
│   │   │   ├── base.py              # Abstract processor
│   │   │   ├── base--test.py
│   │   │   ├── instagram.py         # IG presets
│   │   │   ├── instagram--test.py
│   │   │   ├── presets.py           # All preset definitions
│   │   │   └── presets--test.py
│   │   └── storage/
│   │       ├── temporary.py         # Memory-based storage
│   │       └── temporary--test.py
│   └── test_images/                 # Sample artwork files
└── .github/workflows/ci.yml         # Lint + test automation
```

## Core Image Presets (Phase 1)

### Must Implement
1. **Instagram Square**: 1080×1080px, <4MB, JPEG, sRGB
2. **Instagram Portrait**: 1080×1350px, <4MB, JPEG, sRGB
3. **Jury Submission**: 1920px longest side, 1-2MB, JPEG, 72-300 DPI
4. **Web Display**: 1920px wide, <500KB, WebP with JPEG fallback
5. **Email Newsletter**: 600px wide, <200KB, JPEG
6. **Quick Compress**: Keep dimensions, reduce filesize by 70%

### Implementation Requirements
- Use Pillow (PIL) for all image processing
- Maintain aspect ratio with smart cropping when needed
- Always preserve image quality while meeting size constraints
- Support JPEG, PNG, WebP, TIFF input formats
- Return optimized images as ZIP file via API

## API Design

### Endpoints
```python
POST /optimize
# Body: multipart/form-data with image file + preset selection
# Returns: ZIP file with optimized image(s)

GET /presets
# Returns: Available preset configurations

GET /health
# Returns: API status
```

### Error Handling
- Graceful failures (always return something useful)
- Clear error messages for unsupported formats
- File size limit warnings
- Processing timeout handling

## Development Workflow

### Required justfile Commands
```bash
just bootstrap  # Install deps + setup dev env
just install    # Install deps only
just test       # Run pytest on backend/
just lint       # Run ruff check + format
just build      # Placeholder for deployment
just dev        # Start uvicorn dev server on :8000
```

### Git Protocol
- Branch naming: `feat/preset-name`, `fix/issue`, `docs/update`
- Atomic commits (one logical change per commit)
- Squash merges on main branch
- Each processor should be its own PR

### Testing Strategy
- Unit tests for each processor (colocated as `file--test.py`)
- Test with various image formats and sizes
- Test edge cases: huge files, tiny files, corrupted images
- Performance benchmarks (aim for <2 second processing)

## Phase 1 Implementation Status ✅ COMPLETED

### ✅ Session 1: Foundation (COMPLETED)
1. ✅ Create directory structure
2. ✅ Set up `justfile`, `pyproject.toml`, `.python-version`
3. ✅ Create base processor abstract class
4. ✅ Implement Instagram square processor with tests
5. ✅ Verify with local test images

### ✅ Session 2: API Layer (COMPLETED)
1. ✅ Create FastAPI app with basic endpoints
2. ✅ Add multipart file upload handling
3. ✅ Integrate processors with API
4. ✅ Add error handling and validation
5. ✅ Create ZIP file response functionality

### ✅ Session 3: Complete Presets (COMPLETED)
1. ✅ Implement all 5 required presets:
   - Instagram Square (1080×1080px, <4MB, JPEG, sRGB)
   - Jury Submission (1920px longest side, 1-2MB, JPEG, 72-300 DPI)
   - Web Display (1920px wide, <500KB, WebP with JPEG fallback)
   - Email Newsletter (600px wide, <200KB, JPEG)
   - Quick Compress (keep dimensions, 70% reduction)
2. ✅ Add comprehensive test coverage (57 tests passing)
3. ✅ Performance optimization achieved
4. ✅ Test with Met Museum API images
5. ✅ Document API endpoints

### Phase 1 Achievements
- **5 image processors** fully implemented and tested
- **Complete FastAPI backend** with 4 endpoints
- **Real-world testing** with Met Museum artwork
- **Production-ready** image optimization pipeline
- **57 test cases** covering all functionality
- **Comprehensive documentation** and error handling

## Phase 2 Implementation Status ✅ COMPLETED

### ✅ Database Schema (ACTUAL WORKING SCHEMA)

**Supabase Tables:**
- `profiles` - User profiles linked to auth.users
  - `id` (UUID, FK to auth.users)
  - `email` (text)
  - `display_name` (text, nullable)
  - `avatar_url` (text, nullable) 
  - `subscription_tier` (text, nullable)
  - `created_at`, `updated_at` (timestamps)

- `images` - Original uploaded images
  - `id` (UUID, PK)
  - `user_id` (UUID, FK to profiles.id)
  - `original_filename` (text)
  - `storage_path` (text)
  - `original_size` (bigint, file size in bytes)
  - `original_dimensions` (text, e.g., "800x600")
  - `uploaded_at` (timestamp)
  - `metadata` (jsonb)

- `processed_images` - Optimized image versions
  - `id` (UUID, PK)
  - `image_id` (UUID, FK to images.id)
  - `user_id` (UUID, FK to profiles.id)
  - `preset_name` (text, e.g., "instagram_square")
  - `storage_path` (text)
  - `public_url` (text)
  - `file_size_bytes` (bigint)
  - `processed_at` (timestamp)
  - `metadata` (jsonb)

### ✅ Authentication System (WORKING)
- **GitHub OAuth Flow**: `/auth/github/login` → GitHub → `/auth/github/callback`
- **JWT Token Management**: HS256 algorithm, 30-minute expiry
- **User Profile Creation**: Auto-created after successful OAuth
- **Protected Endpoints**: Proper 401/403 responses
- **Optional Authentication**: Anonymous users supported

### ✅ Dual-Mode Operation (VALIDATED)
- **Anonymous Users**: Temporary memory-based storage
- **Authenticated Users**: Persistent Supabase storage + image gallery
- **Seamless Transition**: Same API, different storage backends

### ✅ Working API Endpoints
```
# Anonymous Access
POST /optimize                    # Upload & optimize images
GET  /presets                    # Available presets
GET  /optimize/processors        # Processor configurations
GET  /health                     # API health

# Authentication
GET  /auth/github/login          # Initiate OAuth
GET  /auth/github/callback       # OAuth callback
GET  /auth/me                    # Current user info
POST /auth/logout                # Logout
GET  /auth/health                # Auth system health

# Authenticated Users Only
GET  /optimize/images                           # User's image gallery
GET  /optimize/images/{id}/optimizations        # Image processing history
DELETE /optimize/images/{id}                    # Delete image
```

### Phase 2 Achievements
- **100% Validation Success**: 24/24 tests passing
- **Production-Ready Database**: Proper foreign keys, RLS policies
- **Bulletproof Authentication**: GitHub OAuth + JWT working flawlessly  
- **Dual Storage Architecture**: Anonymous + persistent modes
- **Complete CRUD Operations**: Create, read, update, delete for user images
- **Real-World Tested**: Validated with live Supabase instance
- **Developer Experience**: Comprehensive validation tools and documentation

## Phase 3 Preparation (Frontend Development)

### ✅ What's Working & Ready
- **Backend API**: Fully functional FastAPI server with 100% validation
- **Authentication**: GitHub OAuth + JWT token system
- **Image Processing**: 5 production-ready presets (Instagram, Jury, Web, Email, Compress)
- **Dual Storage**: Anonymous (temporary) + Authenticated (persistent) modes
- **Database**: Live Supabase integration with proper schema
- **Security**: RLS policies, protected endpoints, CORS configured

### 🎯 Ready for Frontend Team
**Tech Stack Recommendations:**
- **React** with TypeScript for type safety
- **Next.js** for SSR and deployment on Vercel
- **TailwindCSS** for styling consistency
- **React Query** for API state management
- **Zustand** for global state (auth, user data)

**Core Pages Needed:**
1. **Landing Page** - Hero, pricing, demo upload
2. **Upload Interface** - Drag/drop, preset selection, progress
3. **Results Page** - Download ZIP, preview optimized images
4. **Gallery** (Authenticated) - User's uploaded images history
5. **Auth Pages** - Login redirect, profile management

### 📡 API Contracts for Frontend

**Anonymous Upload Flow:**
```typescript
// POST /optimize
interface UploadRequest {
  file: File;
  preset: 'instagram_square' | 'jury_submission' | 'web_display' | 'email_newsletter' | 'quick_compress';
}

// Response: ZIP file download
```

**Authentication Flow:**
```typescript
// 1. GET /auth/github/login
interface AuthUrlResponse {
  auth_url: string;
  state: string;
}

// 2. After OAuth callback, frontend receives:
interface AuthSuccess {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
    github_username: string;
  };
}

// 3. Use token in Authorization header: "Bearer {token}"
```

**Authenticated User Gallery:**
```typescript
// GET /optimize/images?limit=20&offset=0
interface GalleryResponse {
  success: boolean;
  images: Array<{
    id: string;
    original_filename: string;
    original_size: number;
    original_dimensions: string;
    uploaded_at: string;
    processed_images: Array<{
      id: string;
      preset_name: string;
      public_url: string;
      file_size_bytes: number;
      processed_at: string;
    }>;
  }>;
  total_count: number;
  has_more: boolean;
}
```

### 🚀 Deployment Strategy
- **Backend**: Render.com (current) → Railway/Fly.io for production
- **Frontend**: Vercel with Next.js
- **Database**: Supabase (already configured)
- **Storage**: Supabase Storage (already configured)
- **Domain**: Custom domain for production

### 💡 Business Model Implementation
- **Free Tier**: 1-2 images per session (IP-based tracking)
- **Authenticated**: Unlimited uploads + gallery + history
- **Future Premium**: Custom presets, batch processing, API access

## Code Style & Principles

### Python Guidelines
- Use type hints throughout
- Follow ruff formatting (88 char line length)
- Prefer composition over inheritance
- Keep functions small and focused
- Use descriptive variable names

### Key Patterns
```python
# Base processor pattern
class BaseProcessor(ABC):
    @abstractmethod
    def process(self, image: PIL.Image.Image) -> PIL.Image.Image:
        pass
    
    @abstractmethod
    def get_preset_config(self) -> dict:
        pass

# Error handling pattern
try:
    result = process_image(image, preset)
    return {"success": True, "data": result}
except Exception as e:
    return {"success": False, "error": str(e)}
```

## Testing Requirements

### Image Test Files Needed
- High-res JPEG (>5MB, 4000×3000px)
- PNG with transparency
- WebP modern format
- Square aspect ratio image
- Portrait orientation image
- Landscape orientation image
- Very small image (<100×100px)

### Test Coverage Goals
- Each preset processes correctly
- File size constraints are met
- Aspect ratios are preserved/handled properly
- Error cases return meaningful messages
- API endpoints return proper HTTP status codes

## Deployment Notes (Phase 1)

### Render.com Free Tier
- Spins down after 15 minutes of inactivity
- 512MB RAM limit
- No persistent storage (use memory only)
- Environment variables for configuration

### Environment Variables
```bash
ENVIRONMENT=development|production
MAX_FILE_SIZE_MB=10
PROCESSING_TIMEOUT_SECONDS=30
```

## Future Phases (Context Only)

**Phase 2**: React frontend, Supabase auth, email capture
**Phase 3**: AI art analysis, user profiles, segmentation
**Phase 4**: Batch processing, custom presets, API access

## Success Metrics (Phase 1)
- Process images in <2 seconds
- Reduce file size by >50% while maintaining visual quality
- Support JPEG, PNG, WebP input formats
- Deploy successfully to free hosting
- Handle at least 10 concurrent requests

## Common Pitfalls to Avoid
- Don't use pip (use uv)
- Don't create separate test directories (use colocated tests)
- Don't ignore file size constraints (artists care about platform limits)
- Don't assume all images are RGB (handle CMYK, grayscale, etc.)
- Don't forget to preserve EXIF data when appropriate

## Common Commands

```bash
# Setup
just bootstrap

# Development
just dev
just test
just lint

# Deployment
just build
```