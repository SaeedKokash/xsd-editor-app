# 🚀 Deployment Checklist

## Pre-Deployment Setup

### ✅ Backend Preparation
- [x] Environment variables configured in `.env`
- [x] CORS origins updated for production
- [x] Health endpoint available at `/health`
- [x] Package.json has correct Node.js version in engines
- [x] All dependencies listed in package.json

### ✅ Frontend Preparation  
- [x] API URL configured with environment variable
- [x] Build process working (`npm run build`)
- [x] Environment files created (.env.local, .env.production)
- [x] Netlify configuration file created

### ✅ Repository Setup
- [x] .gitignore file configured
- [x] README.md updated with deployment instructions
- [x] All files committed to Git
- [x] Repository pushed to GitHub

## Deployment Steps

### 1. Deploy Backend (Railway)

1. **Create Railway Account**: https://railway.app
2. **New Project**: "Deploy from GitHub repo"
3. **Select Repository**: Choose your GitHub repo
4. **Configure Settings**:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Environment Variables**:
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-app-name.netlify.app
   MAX_FILE_SIZE=50MB
   ```
6. **Deploy**: Railway will auto-deploy
7. **Get URL**: Copy the Railway app URL

### 2. Deploy Frontend (Netlify)

1. **Create Netlify Account**: https://netlify.com
2. **New Site**: "New site from Git"
3. **Select Repository**: Choose your GitHub repo
4. **Build Settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
5. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-railway-url.railway.app/api
   ```
6. **Deploy**: Netlify will auto-build and deploy
7. **Get URL**: Copy the Netlify app URL

### 3. Update CORS Configuration

1. **Update Backend CORS**: In Railway environment variables:
   ```
   CORS_ORIGIN=https://your-actual-netlify-url.netlify.app
   ```
2. **Redeploy Backend**: Railway will auto-redeploy with new settings

## Post-Deployment Verification

### ✅ Backend Health Check
- [ ] Visit: `https://your-railway-url.railway.app/health`
- [ ] Should return: `{"status": "OK", "message": "XSD Editor Server is running"}`

### ✅ Frontend Access
- [ ] Visit: `https://your-netlify-url.netlify.app`
- [ ] Application loads without errors
- [ ] All components render correctly

### ✅ API Integration
- [ ] Upload XSD file works
- [ ] XML validation works
- [ ] No CORS errors in browser console
- [ ] API calls succeed

### ✅ File Upload Testing
- [ ] Upload TEST.xsd file
- [ ] Upload sample XML file
- [ ] Validation produces correct results
- [ ] No server errors

## Troubleshooting

### Common Issues

**CORS Errors**
- Check CORS_ORIGIN matches Netlify URL exactly
- Ensure no trailing slashes in URLs
- Verify environment variables are set

**Build Failures**
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

**API Connection Issues**
- Verify REACT_APP_API_URL is set correctly
- Test backend URL directly in browser
- Check network tab in browser dev tools

**File Upload Issues**
- Check MAX_FILE_SIZE setting
- Verify multer configuration
- Test with smaller files first

## URLs to Update

After deployment, update these files with your actual URLs:

1. **netlify.toml**: Update production API URL
2. **render.yaml**: Update CORS_ORIGIN
3. **DEPLOYMENT.md**: Replace placeholder URLs
4. **README.md**: Add actual deployment URLs

## Success Criteria

Your deployment is successful when:
- ✅ Frontend loads at Netlify URL
- ✅ Backend responds at Railway URL  
- ✅ XSD file upload works
- ✅ XML validation works
- ✅ No console errors
- ✅ All features function correctly

## Automatic Deployments

Once set up, both services will auto-deploy on git push:
- **Netlify**: Deploys on push to main branch
- **Railway**: Deploys on push to main branch

## Monitoring

- **Netlify**: Check deployment logs in dashboard
- **Railway**: Monitor logs and metrics in dashboard
- **Health Check**: Use `/health` endpoint for uptime monitoring

---
**🎉 Congratulations! Your XSD Editor app is now live!**
