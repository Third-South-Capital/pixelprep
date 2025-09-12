# PixelPrep Phase 2 Setup Instructions

## Phase 2: Supabase Integration & Authentication

This document provides step-by-step instructions for setting up Phase 2 features including Supabase authentication, persistent storage, and GitHub OAuth.

## Prerequisites

- Phase 1 completed (all 57 tests passing)
- Supabase account (free tier is sufficient)
- GitHub account for OAuth setup

## 1. Supabase Project Setup

### Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New project"
3. Choose organization and fill project details:
   - **Name**: `pixelprep-prod` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

### Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project-id.supabase.co`)
   - **anon public key**
   - **service_role secret key** (keep this secret!)

## 2. Database Schema Setup

### Create Required Tables

Go to **SQL Editor** in Supabase Dashboard and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    github_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    github_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_premium BOOLEAN DEFAULT FALSE
);

-- Images table (original uploads)
CREATE TABLE images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    file_size_bytes BIGINT NOT NULL,
    dimensions TEXT NOT NULL,
    format TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Optimizations table (processed versions)
CREATE TABLE optimizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preset TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    file_size_bytes BIGINT NOT NULL,
    optimized_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Usage analytics (for business insights)
CREATE TABLE usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'upload', 'optimize', 'download'
    preset TEXT,
    file_size_bytes BIGINT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX idx_optimizations_image_id ON optimizations(image_id);
CREATE INDEX idx_optimizations_user_id ON optimizations(user_id);
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid()::uuid);

CREATE POLICY "Users can view own images" ON images FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view own optimizations" ON optimizations FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can insert own optimizations" ON optimizations FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can delete own optimizations" ON optimizations FOR DELETE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view own analytics" ON usage_analytics FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can insert own analytics" ON usage_analytics FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
```

### Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create two buckets:

   **Bucket 1: `originals`**
   - **Name**: `originals`
   - **Public**: No (private)
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/tiff`

   **Bucket 2: `optimized`**
   - **Name**: `optimized` 
   - **Public**: Yes (for easy access)
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## 3. GitHub OAuth Setup

### Create GitHub OAuth App

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: `PixelPrep`
   - **Homepage URL**: `https://your-domain.com` (or `http://localhost:3000` for development)
   - **Application description**: `AI-powered image optimization for artists`
   - **Authorization callback URL**: `http://localhost:8000/auth/github/callback` (for development)
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### Production Callback URLs

For production, update the callback URL to match your domain:
- `https://api.your-domain.com/auth/github/callback`

## 4. Environment Configuration

### Install New Dependencies

```bash
just deps
```

This will install the new dependencies added to `pyproject.toml`:
- `supabase>=2.3.4`
- `python-jose[cryptography]>=3.3.0`
- `python-dotenv>=1.0.0`

### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:

```bash
# Application Environment
ENVIRONMENT=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# JWT Settings (generate a strong secret)
JWT_SECRET_KEY=your_very_secure_secret_key_here_at_least_32_chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Image Processing Settings
MAX_FILE_SIZE_MB=10
PROCESSING_TIMEOUT_SECONDS=30

# Storage Configuration
SUPABASE_STORAGE_BUCKET_ORIGINALS=originals
SUPABASE_STORAGE_BUCKET_OPTIMIZED=optimized

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Optional: Analytics & Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Use strong, unique values for JWT_SECRET_KEY
- Keep your Supabase service key secret
- Rotate secrets periodically in production

## 5. Test the Setup

### Run Tests

```bash
just test
```

All 57+ tests should still pass, including new authentication tests.

### Start Development Server

```bash
just dev
```

This will:
1. Check that environment variables are configured
2. Start the FastAPI server on `http://localhost:8000`

### Test Endpoints

1. **Health Check**: `GET http://localhost:8000/health`
2. **Auth Health**: `GET http://localhost:8000/auth/health`
3. **GitHub Login**: `GET http://localhost:8000/auth/github/login`
4. **Processors**: `GET http://localhost:8000/optimize/processors`

### Test Image Upload

**Anonymous Upload** (temporary storage):
```bash
curl -X POST "http://localhost:8000/optimize/" \
  -F "file=@test_image.jpg" \
  -F "preset=instagram_square"
```

**Authenticated Upload** (persistent storage):
```bash
# First login via GitHub OAuth, then use the token:
curl -X POST "http://localhost:8000/optimize/" \
  -H "Authorization: Bearer your_jwt_token" \
  -F "file=@test_image.jpg" \
  -F "preset=instagram_square"
```

## 6. New API Endpoints

### Authentication Endpoints

- `GET /auth/github/login` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback handler  
- `GET /auth/me` - Get current user info (protected)
- `POST /auth/logout` - Logout
- `GET /auth/health` - Auth service health

### Image Management (Protected)

- `GET /optimize/images` - Get user's uploaded images
- `GET /optimize/images/{id}/optimizations` - Get image optimization history
- `DELETE /optimize/images/{id}` - Delete image and optimizations
- `GET /optimize/usage` - Get storage usage statistics

### Enhanced Image Processing

The `/optimize/` endpoint now supports both anonymous and authenticated users:
- **Anonymous**: Images processed in memory, temporary ZIP response
- **Authenticated**: Original and optimized images saved to Supabase Storage

## 7. Troubleshooting

### Common Issues

**Environment Variables Not Loaded**:
```bash
# Check if .env exists and has correct values
cat .env | grep SUPABASE_URL
```

**Supabase Connection Failed**:
```bash
# Test connection in Python
python -c "from backend.src.storage.supabase_client import get_supabase_client; print(get_supabase_client().table('users').select('*').limit(1).execute())"
```

**GitHub OAuth Not Working**:
- Check callback URL matches exactly
- Verify Client ID and Secret are correct
- Ensure OAuth app is not suspended

**Database Permission Errors**:
- Verify RLS policies are created
- Check that service key is being used for admin operations
- Confirm user authentication flow

### Debug Commands

```bash
# Check environment configuration
just check-env

# Run with verbose logging
PYTHONPATH=. DEBUG=1 uvicorn backend.src.api.main:app --reload

# Test Supabase connection
python scripts/test_supabase.py
```

## 8. Next Steps (Phase 3)

Once Phase 2 is working:
- React frontend development
- User dashboard with image gallery
- Batch processing capabilities
- Premium subscription features
- Advanced analytics dashboard

## Security Considerations

- All user data isolated by RLS policies
- JWT tokens expire after 30 minutes
- Storage buckets have appropriate access controls
- Environment variables never exposed to client
- Rate limiting recommended for production
- Regular security audits of dependencies

---

**Need Help?**
- Check the troubleshooting section above
- Review Supabase documentation
- Test each component individually
- Verify all environment variables are set correctly