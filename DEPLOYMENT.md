# 🚀 Deployment Checklist for GxDrip

Use this checklist to ensure your application is ready for production deployment.

## ✅ Pre-Deployment Checklist

### 1. Code Quality & Testing
- [x] Build completes without errors (`npm run build`)
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed (`npm run lint`)
- [ ] Test all user flows manually
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test responsive design on mobile devices

### 2. Environment Configuration
- [x] `.env.example` file exists with all required variables
- [ ] `.env` file is in `.gitignore`
- [ ] Production environment variables prepared
- [ ] Supabase project created and configured
- [ ] Database schema scripts executed:
  - [ ] `supabase-schema-points.sql`
  - [ ] `supabase-schema-otp.sql`
  - [ ] `supabase-schema-points-update.sql`

### 3. Security
- [ ] All API keys and secrets are in environment variables
- [ ] No sensitive data hardcoded in source code
- [ ] Supabase Row Level Security (RLS) policies enabled
- [ ] CORS configured properly in Supabase
- [ ] Authentication flows tested
- [ ] OTP verification working

### 4. Performance Optimization
- [x] Code splitting configured (vendor chunks)
- [x] Images optimized (run `npm run optimize-images` for guidance)
- [ ] Unused dependencies removed
- [ ] Bundle size checked (should be under warning limits)
- [ ] Lazy loading implemented where appropriate

### 5. SEO & Meta Tags
- [x] Page title set in `index.html`
- [x] Meta description added
- [x] Open Graph tags configured
- [x] Twitter card tags added
- [ ] Favicon added (update `/favicon.ico`)
- [ ] Apple touch icon configured

### 6. Git Repository
- [ ] Repository created on GitHub/GitLab
- [ ] `.gitignore` properly configured
- [ ] All changes committed
- [ ] Pushed to remote repository
- [ ] README.md updated with project details

## 🌐 Vercel Deployment Steps

### Step 1: Prepare Repository
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for production deployment"

# Add remote repository
git remote add origin https://github.com/yourusername/GxDrip.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
In Vercel project settings, add:
```
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### Step 4: Deploy
- Click **"Deploy"**
- Wait for build to complete
- Note your deployment URL: `https://your-app.vercel.app`

### Step 5: Configure Supabase
1. Go to Supabase Dashboard
2. Navigate to: **Settings** → **API** → **Configuration**
3. Update **Site URL**: `https://your-app.vercel.app`
4. Add to **Redirect URLs**: `https://your-app.vercel.app/**`
5. Save changes

### Step 6: Test Production Deployment
- [ ] Visit your Vercel URL
- [ ] Test user registration
- [ ] Test OTP verification
- [ ] Test jersey upload
- [ ] Test Excel import
- [ ] Test canvas customization
- [ ] Test export functionality
- [ ] Test free trial (5 exports)
- [ ] Test authentication persistence
- [ ] Test on mobile devices

## 🔧 Post-Deployment

### Monitoring
- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor Supabase usage
- [ ] Check error logs regularly
- [ ] Set up uptime monitoring

### Domain Configuration (Optional)
- [ ] Purchase custom domain
- [ ] Add domain in Vercel settings
- [ ] Configure DNS records
- [ ] Update Supabase redirect URLs with custom domain
- [ ] Test SSL certificate

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Optimize based on audit results

## 🐛 Troubleshooting

### Build Fails on Vercel
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check for TypeScript errors

### Authentication Not Working
- Verify environment variables are set correctly
- Check Supabase URL configuration
- Ensure redirect URLs include your Vercel domain
- Check browser console for errors

### Images Not Loading
- Verify images are in `public/` folder
- Check image paths are correct
- Ensure images are committed to git
- Check Vercel deployment logs

### Canvas Issues
- Verify fabric.js is properly bundled
- Check browser console for errors
- Test in different browsers
- Ensure canvas dimensions are set correctly

## 📊 Success Metrics

After deployment, monitor:
- [ ] Page load time < 3 seconds
- [ ] Lighthouse Performance score > 90
- [ ] Zero console errors on production
- [ ] All features working as expected
- [ ] Mobile responsiveness verified

## 🎉 Deployment Complete!

Once all items are checked:
- ✅ Your app is live at: `https://your-app.vercel.app`
- ✅ Users can access and use the application
- ✅ All features are working correctly
- ✅ Monitoring is in place

## 📝 Next Steps

1. Share the URL with beta testers
2. Gather user feedback
3. Monitor analytics and errors
4. Plan future updates and features
5. Set up continuous deployment for future updates

---

**Need Help?** Refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
