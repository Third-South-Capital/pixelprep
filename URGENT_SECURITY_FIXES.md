# 🚨 URGENT SECURITY FIXES REQUIRED

## ❌ CRITICAL ISSUES DETECTED

### Issue 1: Production OAuth Broken
**Problem**: `BACKEND_URL=http://localhost:8000` in production
**Impact**: GitHub authentication completely broken
**Fix Timeline**: IMMEDIATE (< 1 hour)

### Issue 2: Secrets Previously Exposed in Git
**Problem**: Production secrets were committed to git history
**Impact**: Potential unauthorized access to Supabase/GitHub
**Fix Timeline**: 24 hours

## 🔧 IMMEDIATE FIXES (Do These Now)

### 1. Fix OAuth Callback URL (CRITICAL)
Go to Render.com dashboard → pixelprep service → Environment → Add/Update:
```
BACKEND_URL=https://pixelprep.onrender.com
```
Then click "Deploy Latest Commit"

### 2. Verify Current GitHub OAuth App Settings
Go to: https://github.com/settings/applications/new
Check that `Ov23lihITbQ3YIuYA2Ko` has these settings:
- **Homepage URL**: https://third-south-capital.github.io/pixelprep/
- **Callback URL**: https://pixelprep.onrender.com/auth/github/callback

If not, update the app OR create a new one.

## 🔐 SECRET ROTATION PLAN

### Phase 1: IMMEDIATE (< 24 hours)
1. **Fix BACKEND_URL** (breaks auth until fixed)
2. **Rotate Supabase JWT Secret** (was hardcoded in auth.py)
3. **Update GitHub OAuth callback** (if needed)

### Phase 2: HIGH PRIORITY (< 1 week)
1. **Rotate GitHub Client Secret** (was in git)
2. **Rotate Supabase Service Key** (was in git)
3. **Generate new JWT Secret** for production

### Phase 3: ONGOING SECURITY
1. **Set up secret rotation schedule** (90 days)
2. **Monitor access logs** for suspicious activity
3. **Enable GitHub organization security alerts**

## 🎯 NEW ENVIRONMENT VARIABLES FOR RENDER.COM

Replace ALL environment variables in Render.com with these:

```bash
# CRITICAL: Fix OAuth callback
BACKEND_URL=https://pixelprep.onrender.com
FRONTEND_URL=https://third-south-capital.github.io/pixelprep
CORS_ORIGINS=https://third-south-capital.github.io

# Rotate these immediately (get from Supabase dashboard)
SUPABASE_URL=https://zhxhuzcbsvumopxnhfxm.supabase.co
SUPABASE_SERVICE_KEY=[NEW-service-key-from-supabase]
SUPABASE_JWT_SECRET=[NEW-jwt-secret-from-supabase]

# Create new GitHub OAuth app OR update existing one
GITHUB_CLIENT_ID=[new-or-updated-client-id]
GITHUB_CLIENT_SECRET=[new-or-updated-client-secret]

# New production JWT secret
JWT_SECRET_KEY=[generate-new-256-bit-secret]
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application settings
ENVIRONMENT=production
MAX_FILE_SIZE_MB=10
PROCESSING_TIMEOUT_SECONDS=30
SUPABASE_STORAGE_BUCKET_ORIGINALS=originals
SUPABASE_STORAGE_BUCKET_OPTIMIZED=optimized
```

## 🔍 VERIFICATION COMMANDS

After fixes, verify these endpoints return correct data:
```bash
# Should show production callback URL
curl https://pixelprep.onrender.com/auth/github/login | jq '.auth_url'

# Should show all systems healthy
curl https://pixelprep.onrender.com/auth/health

# Should work with actual image upload
curl -X POST https://pixelprep.onrender.com/optimize/ \
  -F "file=@test_image.jpg" \
  -F "preset=instagram_square"
```

## ⏰ TIMELINE SUMMARY

- **Next 1 hour**: Fix BACKEND_URL to restore authentication
- **Next 24 hours**: Rotate exposed Supabase secrets
- **Next 1 week**: Rotate GitHub OAuth secrets
- **Ongoing**: Implement 90-day rotation schedule

**Priority Order**: OAuth callback fix → Supabase secrets → GitHub secrets → Monitoring

Last Updated: 2025-09-13
Risk Level: HIGH - Authentication currently broken in production