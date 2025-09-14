# PixelPrep Production Deployment Guide

This guide covers deploying PixelPrep v2.0.0 with the EntryThingy design system to production using Render (backend) and GitHub Pages (frontend).

## 📋 Prerequisites

- GitHub repository: `third-south-capital/pixelprep` ✅
- Supabase project with database and storage configured
- GitHub OAuth app configured
- Render.com account

## 🚀 Backend Deployment (Render)

### 1. Create New Web Service on Render

1. **Connect Repository**:
   - Go to https://render.com/dashboard
   - Click "New" → "Web Service"
   - Connect GitHub and select `Third-South-Capital/pixelprep`

2. **Configure Service**:
   ```yaml
   Name: pixelprep-api
   Region: Oregon (US West)
   Branch: main
   Root Directory: .
   Runtime: Python 3
   Build Command: uv sync && uv run pip install --upgrade pip
   Start Command: uv run uvicorn backend.src.api.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables** (in Render dashboard):
   ```env
   # Required for production
   ENVIRONMENT=production
   PYTHON_VERSION=3.11
   
   # Supabase (get from your Supabase project dashboard)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   
   # JWT Settings
   JWT_SECRET_KEY=generate_a_secure_random_key_here
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # Image Processing
   MAX_FILE_SIZE_MB=10
   PROCESSING_TIMEOUT_SECONDS=30
   
   # Supabase Storage
   SUPABASE_STORAGE_BUCKET_ORIGINALS=originals
   SUPABASE_STORAGE_BUCKET_OPTIMIZED=optimized
   
   # CORS (update with your frontend URL)
   FRONTEND_URL=https://third-south-capital.github.io
   PRODUCTION_FRONTEND_URL=https://third-south-capital.github.io/pixelprep
   ```

### 2. Configure CORS for Production

The API will automatically configure CORS based on the environment variables above.

### 3. Deploy

- Click "Create Web Service"
- Render will automatically build and deploy
- Get your production API URL: `https://pixelprep-api.onrender.com`

## 🌐 Frontend Deployment (GitHub Pages)

The frontend includes the **EntryThingy design system** with:
- Professional Outfit font typography
- Light/dark mode support with CSS variables
- Responsive design optimized for all devices
- Accessibility compliance (WCAG AA)

### 1. Update API Configuration

Update the frontend API service to use the production backend URL:

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pixelprep-api.onrender.com'
  : 'http://localhost:8000';
```

### 2. Configure GitHub Pages

1. Go to repository settings: https://github.com/Third-South-Capital/pixelprep/settings/pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` (will be created by GitHub Actions)
4. Folder: `/` (root)

### 3. Add GitHub Actions for Automatic Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]
  
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: cd frontend && bun install
        
      - name: Build frontend
        run: cd frontend && bun run build
        env:
          NODE_ENV: production
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './frontend/dist'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4. Update Frontend Base Path

Update `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/pixelprep/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
```

## 🔐 Security Configuration

### 1. Supabase RLS Policies

Ensure Row Level Security policies are enabled in your Supabase project for the `profiles`, `images`, and `processed_images` tables.

### 2. GitHub OAuth Configuration

Update your GitHub OAuth app settings:
- Homepage URL: `https://third-south-capital.github.io/pixelprep`
- Authorization callback URL: `https://pixelprep-api.onrender.com/auth/github/callback`

### 3. Environment Variables Security

- Never commit `.env` files
- Use strong, unique JWT secret keys
- Rotate secrets periodically
- Use Supabase service key (not anon key) for server-side operations

## 📊 Monitoring & Maintenance

### Health Checks

- Backend: `https://pixelprep-api.onrender.com/health`
- API Status: `https://pixelprep-api.onrender.com/optimize/processors`

### Performance Monitoring

- Render provides automatic metrics
- Monitor API response times
- Set up alerts for failures

### Scaling Considerations

- Render free tier has limitations
- Upgrade to paid plan for production traffic
- Consider CDN for static assets

## 🚀 Quick Deploy Checklist

- [ ] Repository pushed to GitHub ✅
- [ ] Supabase project configured
- [ ] GitHub OAuth app created
- [ ] Render web service created
- [ ] Environment variables configured
- [ ] GitHub Pages configured
- [ ] Frontend API URL updated
- [ ] GitHub Actions workflow added
- [ ] CORS configured for production domain
- [ ] SSL certificates (automatic on Render/GitHub Pages)

## 📞 Support & Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` environment variable matches your frontend domain
2. **Build Failures**: Check Python version and dependencies in `pyproject.toml`
3. **Database Connection**: Verify Supabase URL and service key
4. **File Upload Issues**: Check file size limits and storage bucket configuration

### Logs

- **Render**: View logs in Render dashboard
- **GitHub Actions**: Check workflow runs in GitHub Actions tab

## 🔄 Development Workflow

For ongoing development:

1. Make changes locally
2. Test with `just test` and `just dev`
3. Commit and push to `main` branch
4. Render automatically deploys backend
5. GitHub Actions deploys frontend
6. Verify deployment at production URLs

---

**Production URLs** (after deployment):
- Frontend: https://third-south-capital.github.io/pixelprep
- Backend: https://pixelprep-api.onrender.com
- Health Check: https://pixelprep-api.onrender.com/health