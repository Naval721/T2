# 🚀 Quick Deployment Guide

## Prerequisites Completed ✅
- [x] Project builds successfully
- [x] All dependencies installed
- [x] Vercel configuration ready
- [x] Environment variables template created

## Deploy in 3 Steps

### Step 1: Run Deployment Check
```bash
npm run check-deployment
```
This will validate your project is ready for deployment.

### Step 2: Push to GitHub

If you haven't already initialized git:
```bash
git init
git add .
git commit -m "Ready for deployment"
```

Create a new repository on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/GxDrip.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variables:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
npm run deploy
```

## Post-Deployment

### Configure Supabase
1. Go to your Supabase Dashboard
2. Settings → API → Configuration
3. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### Test Your Deployment
Visit your Vercel URL and test:
- ✅ User registration
- ✅ OTP verification
- ✅ Jersey upload
- ✅ Excel import
- ✅ Canvas customization
- ✅ Export functionality

## Environment Variables Needed

Make sure to set these in Vercel:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API |

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors locally

### Authentication Issues
- Verify environment variables are set in Vercel
- Check Supabase redirect URLs include your Vercel domain
- Ensure Supabase project is active

### Images Not Loading
- Verify images are in `public/` folder
- Check they're committed to git
- Clear Vercel cache and redeploy

## Need More Help?

See the full deployment guide: `DEPLOYMENT.md`

---

**Your app will be live at**: `https://your-app.vercel.app` 🎉
