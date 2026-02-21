# Git Deployment Guide for Hostinger

## 🚀 Setup Git-Based Deployment

### Option 1: Hostinger Git Integration (Recommended)

1. **Create GitHub Repository**
   ```bash
   # Add remote repository (replace with your repo URL)
   git remote add origin https://github.com/yourusername/funish-games.git
   git branch -M main
   git push -u origin main
   ```

2. **Hostinger Setup**
   - Log into Hostinger
   - Go to **Hosting** → **Web Apps**
   - Select your Node.js app
   - Click **Git Integration**
   - Connect your GitHub repository
   - Select branch: `main`
   - Set deployment trigger: **On push**

3. **Environment Variables**
   In Hostinger control panel, add:
   ```
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   APP_URL=https://funish.games
   ```

### Option 2: Manual Git Pull on Server

1. **SSH into Hostinger Server**
   ```bash
   ssh username@your-server-ip
   ```

2. **Clone Repository**
   ```bash
   cd /home/username/
   git clone https://github.com/yourusername/funish-games.git
   cd funish-games
   ```

3. **Setup PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   npm install
   npm run build
   pm2 start dist/server.js --name funish-games
   pm2 startup
   pm2 save
   ```

4. **Deploy Updates**
   ```bash
   cd /home/username/funish-games
   git pull origin main
   npm install
   npm run build
   pm2 restart funish-games
   ```

## 🔄 Workflow for Making Changes

### Development Workflow
1. Make changes locally
2. Test locally: `npm run dev`
3. Commit changes: 
   ```bash
   git add .
   git commit -m "Your change description"
   git push origin main
   ```
4. Hostinger automatically deploys (if using Git Integration)

### Branch Strategy
- `main` - Production branch
- `develop` - Development branch (optional)
- Create feature branches for new features

## 🛠️ GitHub Actions (Advanced)

If you want automated deployment with GitHub Actions:

1. **Add Secrets to GitHub**
   - `HOSTINGER_HOST`: Your server IP
   - `HOSTINGER_USERNAME`: SSH username
   - `HOSTINGER_SSH_KEY`: SSH private key
   - `HOSTINGER_PORT`: SSH port (usually 22)

2. **Setup PM2 on Server**
   ```bash
   npm install -g pm2
   ```

3. **Deploy Automatically**
   - Push to `main` branch
   - GitHub Actions will build and deploy

## 📁 Files to Commit

Your Git repository should contain:
```
/
├── src/                    # Source code
├── public/                  # Static assets
├── package.json            # Dependencies
├── package-lock.json       # Lock file
├── server.ts              # Main server file
├── vite.config.ts         # Vite config
├── vite.server.config.ts   # Server build config
├── tsconfig.json          # TypeScript config
├── .gitignore            # Git ignore rules
├── DEPLOYMENT.md         # Deployment guide
└── GIT_DEPLOYMENT.md     # This file
```

## ⚡ Benefits of Git Deployment

✅ **Automatic Updates**: Push code → Live instantly  
✅ **Version Control**: Track all changes and rollback  
✅ **Collaboration**: Multiple developers can work together  
✅ **CI/CD**: Automated testing and deployment  
✅ **Backup**: Your code is safely backed up on GitHub  

## 🎯 Quick Start Commands

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/funish-games.git
git branch -M main
git push -u origin main

# Daily workflow
git add .
git commit -m "Update game feature"
git push origin main
```

That's it! Your changes will be live on `https://funish.games` within minutes. 🚀
