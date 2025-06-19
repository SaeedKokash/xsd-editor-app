# 🚀 Quick Deployment Guide

## ✅ Your XSD Editor App is Ready to Deploy!

This guide will get your app live in about 10 minutes.

## Step 1: Push to GitHub (2 minutes)

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `xsd-editor-app` (or any name you prefer)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Railway (3 minutes)

1. **Go to [railway.app](https://railway.app)** and sign up/login
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Select your repository** (you may need to grant Railway access to your GitHub)
4. **Railway will automatically**:
   - Detect the `railway.toml` configuration
   - Set root directory to `server`
   - Install dependencies and start the server
5. **Set Environment Variables** in Railway dashboard:
   - Click on your project → **Variables** tab
   - Add these variables:
     ```
     NODE_ENV=production
     CORS_ORIGIN=https://your-app-name.netlify.app
     MAX_FILE_SIZE=50MB
     ```
   - **Note**: Update `CORS_ORIGIN` after Netlify deployment
6. **Copy your Railway URL** (e.g., `https://your-app-name.up.railway.app`)

## Step 3: Deploy Frontend to Netlify (3 minutes)

1. **Go to [netlify.com](https://netlify.com)** and sign up/login
2. **Click "New site from Git"**
3. **Connect to GitHub** and select your repository
4. **Netlify will automatically detect**:
   - Base directory: `client`
   - Build command: `npm run build`  
   - Publish directory: `client/build`
5. **Set Environment Variable**:
   - Go to **Site settings** → **Environment variables**
   - Add: `REACT_APP_API_URL` = `https://your-railway-url.up.railway.app/api`
6. **Deploy** - Netlify will build and deploy your app

## Step 4: Update CORS (1 minute)

1. **Copy your Netlify URL** (e.g., `https://amazing-app-123456.netlify.app`)
2. **Go back to Railway** → Your project → **Variables**
3. **Update `CORS_ORIGIN`** to your actual Netlify URL:
   ```
   CORS_ORIGIN=https://your-actual-netlify-url.netlify.app
   ```
4. **Redeploy** (Railway will automatically redeploy)

## Step 5: Test Your App! (1 minute)

1. **Visit your Netlify URL**
2. **Test the XSD Editor functionality**:
   - Upload an XSD file
   - Edit elements and attributes
   - Generate/download XSD
3. **Check browser console** for any errors

## 🎉 You're Live!

Your XSD Editor is now deployed and accessible worldwide:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.railway.app`

## 🔧 Optional: Custom Domain

### For Netlify (Frontend):
1. **Site settings** → **Domain management** → **Add custom domain**
2. **Update DNS** records as instructed

### For Railway (Backend):  
1. **Project Settings** → **Domains** → **Custom Domain**
2. **Update DNS** records as instructed

## 🚨 Troubleshooting

### Frontend shows API errors:
- Check `REACT_APP_API_URL` in Netlify environment variables
- Ensure Railway URL is correct and accessible

### CORS errors in browser:
- Verify `CORS_ORIGIN` in Railway matches your Netlify URL exactly
- Check Railway logs for CORS-related errors

### Build failures:
- Check build logs in Netlify/Railway dashboards
- Ensure Node.js version is 18+ in settings

## 📱 Automatic Updates

Both deployments are now connected to your GitHub repository:
- **Push to main branch** → Automatic deployment
- **No manual rebuilds needed**

## 🆘 Need Help?

Check the detailed guides:
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `README.md` - Project overview and setup

---
**Happy coding! 🎯**
