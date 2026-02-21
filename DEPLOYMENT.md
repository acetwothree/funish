# Hostinger Deployment Guide

## Prerequisites
- Node.js 18+ 
- Domain: funish.games
- Hostinger Node.js Web App plan

## Step-by-Step Deployment

### 1. Prepare Your Code
```bash
# Build the application
npm run build

# Test production build locally
npm start
```

### 2. Hostinger Setup
1. Log into Hostinger
2. Go to **Hosting** → **Web Apps**
3. Click **Add New Web App**
4. Select **Node.js** as the application type
5. Choose your plan

### 3. Application Configuration
- **Application Name**: funish-games
- **Domain**: funish.games
- **Node.js Version**: 18.x or higher
- **Application Root**: Leave as default
- **Application Startup File**: `dist/server.js`
- **Application Mode**: Production

### 4. Environment Variables
In Hostinger control panel, add these environment variables:
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://funish.games
```

### 5. Deployment Process
1. Upload your project files to Hostinger (via Git or File Manager)
2. Ensure `package.json` is in the root
3. Hostinger will automatically run `npm install`
4. Set the startup command to: `npm start`

### 6. Domain Configuration
1. In Hostinger DNS settings, point `funish.games` to your web app
2. Configure SSL certificate (usually automatic)

### 7. Verify Deployment
- Visit `https://funish.games`
- Test creating a lobby
- Test direct room access: `https://funish.games/ABCD`

## Important Notes

### File Structure After Build
```
/
├── dist/
│   ├── server.js
│   └── assets/ (built React app)
├── node_modules/ (installed by Hostinger)
├── package.json
└── package-lock.json
```

### Environment Variables in Hostinger
- Navigate to your Web App → **Settings** → **Environment Variables**
- Add all variables from the `.env.production.example` file

### Troubleshooting
- If the app doesn't start, check the startup file path
- Ensure Node.js version is 18+
- Check Hostinger error logs in the control panel
- Verify all environment variables are set correctly

## Production Optimizations
The application includes:
- WebSocket support via Socket.io
- Static file serving for production
- Proper CORS configuration
- Environment-based configuration
- Direct room access routing
