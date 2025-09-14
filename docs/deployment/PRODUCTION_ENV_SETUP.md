# PixelPrep Production Environment Variables Setup

## 🔐 Required Environment Variables for Render.com

### **Core Application Settings**
```bash
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
```

### **CORS & Frontend Integration**
```bash
FRONTEND_URL=https://third-south-capital.github.io/pixelprep
BACKEND_URL=https://pixelprep.onrender.com
CORS_ORIGINS=https://third-south-capital.github.io
```

### **🚨 CRITICAL: Supabase Configuration**
**⚠️  You MUST get these from your Supabase project dashboard:**

1. **Go to**: https://app.supabase.com/project/[your-project]/settings/api
2. **Copy these values**:

```bash
SUPABASE_URL=https://zhxhuzcbsvumopxnhfxm.supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key-from-supabase]
SUPABASE_JWT_SECRET=[your-jwt-secret-from-supabase]
```

### **🚨 CRITICAL: GitHub OAuth Configuration**
**⚠️  You MUST create a NEW GitHub OAuth App for production:**

1. **Go to**: https://github.com/settings/applications/new
2. **Application settings**:
   - **Application name**: PixelPrep Production
   - **Homepage URL**: https://third-south-capital.github.io/pixelprep/
   - **Authorization callback URL**: https://pixelprep.onrender.com/auth/github/callback
3. **Copy the generated values**:

```bash
GITHUB_CLIENT_ID=[new-production-client-id]
GITHUB_CLIENT_SECRET=[new-production-client-secret]
```

### **Image Processing Settings**
```bash
MAX_FILE_SIZE_MB=10
PROCESSING_TIMEOUT_SECONDS=30
SUPABASE_STORAGE_BUCKET_ORIGINALS=originals
SUPABASE_STORAGE_BUCKET_OPTIMIZED=optimized
```

### **JWT Configuration**
```bash
JWT_SECRET_KEY=[generate-new-256-bit-key]
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📋 Step-by-Step Render.com Setup

### **Step 1: Generate New JWT Secret**
Run this command locally to generate a secure JWT secret:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### **Step 2: Access Render.com Dashboard**
1. Go to: https://dashboard.render.com/
2. Find your "pixelprep" service
3. Click "Environment" in the left sidebar

### **Step 3: Add Environment Variables**
Add ALL the variables listed above to your Render.com service:

**Click "Add Environment Variable" for each:**
- Key: `ENVIRONMENT`, Value: `production`
- Key: `SUPABASE_URL`, Value: `https://zhxhuzcbsvumopxnhfxm.supabase.co`
- Key: `SUPABASE_SERVICE_KEY`, Value: `[from-supabase-dashboard]`
- Key: `SUPABASE_JWT_SECRET`, Value: `[from-supabase-dashboard]`
- Key: `GITHUB_CLIENT_ID`, Value: `[from-new-github-app]`
- Key: `GITHUB_CLIENT_SECRET`, Value: `[from-new-github-app]`
- Key: `FRONTEND_URL`, Value: `https://third-south-capital.github.io/pixelprep`
- Key: `BACKEND_URL`, Value: `https://pixelprep.onrender.com`
- Key: `CORS_ORIGINS`, Value: `https://third-south-capital.github.io`
- Key: `JWT_SECRET_KEY`, Value: `[generated-above]`
- Key: `MAX_FILE_SIZE_MB`, Value: `10`

### **Step 4: Deploy**
After adding all environment variables, click "Deploy Latest Commit" or push to trigger deployment.

## 🧪 Production Testing Checklist

After deployment, verify these endpoints:
- ✅ `GET https://pixelprep.onrender.com/health`
- ✅ `GET https://pixelprep.onrender.com/auth/health`
- ✅ `GET https://pixelprep.onrender.com/optimize/processors`
- ✅ `GET https://pixelprep.onrender.com/auth/github/login`

## 🚨 Security Reminders

1. **NEVER commit these values to git**
2. **Rotate secrets every 90 days**
3. **Use separate OAuth apps for dev/staging/prod**
4. **Monitor Supabase usage/billing**
5. **Enable Render.com environment variable encryption**

Last Updated: 2025-09-13