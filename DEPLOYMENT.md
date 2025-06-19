# XSD Editor App - Deployment Guide

This application consists of a React frontend and Node.js backend that need to be deployed separately.

## Architecture
- **Frontend (React)**: Deployed to Netlify
- **Backend (Node.js/Express)**: Deployed to Railway or Render

## Prerequisites
- Node.js 18+ installed
- Git repository
- Netlify account
- Railway or Render account

## Local Development

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Start Development Servers
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

The app will be available at `http://localhost:3000` with API at `http://localhost:5000`

## Deployment Instructions

### Step 1: Deploy Backend to Railway

1. **Sign up for Railway**: Go to [railway.app](https://railway.app) and create an account
2. **Create new project**: Click "New Project" → "Deploy from GitHub repo"
3. **Connect your repository**
4. **Configure deployment**:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
5. **Set environment variables** in Railway dashboard:
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-app-name.netlify.app
   MAX_FILE_SIZE=50MB
   ```
6. **Deploy**: Railway will automatically deploy your backend
7. **Note the URL**: Copy your Railway app URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Netlify

1. **Sign up for Netlify**: Go to [netlify.com](https://netlify.com) and create an account
2. **Create new site**: Click "New site from Git"
3. **Connect your repository**
4. **Configure build settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
5. **Set environment variables** in Netlify dashboard:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```
6. **Deploy**: Netlify will automatically build and deploy your frontend

### Step 3: Update CORS Configuration

1. Update the backend CORS configuration in Railway:
   ```
   CORS_ORIGIN=https://your-actual-netlify-url.netlify.app
   ```
2. Redeploy the backend if needed

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-url.netlify.app
MAX_FILE_SIZE=50MB
```

### Frontend 
Set in Netlify dashboard:
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

## Alternative Backend Deployment (Render)

If you prefer Render over Railway:

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
5. Set the same environment variables as Railway

## Troubleshooting

### CORS Issues
- Make sure CORS_ORIGIN in backend matches your Netlify URL exactly
- Check browser developer tools for CORS errors

### Build Failures
- Ensure Node.js version is 18+ in deployment settings
- Check build logs for specific error messages

### API Connection Issues
- Verify REACT_APP_API_URL is set correctly in Netlify
- Test backend API directly using the Railway/Render URL

## Automatic Deployments

Both Netlify and Railway support automatic deployments:
- **Frontend**: Automatically redeploys when you push to main branch
- **Backend**: Automatically redeploys when you push to main branch

## Monitoring

- **Netlify**: Check deployment logs in Netlify dashboard
- **Railway**: Monitor logs and metrics in Railway dashboard
- **Health Check**: Backend includes `/health` endpoint for monitoring

## Custom Domain (Optional)

### Frontend (Netlify)
1. Go to Domain settings in Netlify dashboard
2. Add your custom domain
3. Configure DNS records as instructed

### Backend (Railway)
1. Go to Settings → Domains in Railway dashboard
2. Add your custom domain
3. Configure DNS records as instructed
