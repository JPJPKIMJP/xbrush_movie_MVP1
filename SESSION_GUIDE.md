# Session Restart Guide for XBrush MovieMaker MVP

## Quick Start for New Session

When starting a new session, tell Claude:

```
I'm working on the moviemaker_mvp01 project at /Users/jpkim/moviemaker_mvp01/
Please:
1. Pull the latest changes from GitHub
2. Check the project status
```

## Detailed Session Setup

### 1. Project Context
Tell Claude about your project:
- **Project Path**: `/Users/jpkim/moviemaker_mvp01/`
- **GitHub Repo**: `https://github.com/JPJPKIMJP/xbrush_movie_MVP1`
- **Live URLs**: 
  - Test: `https://jpjpkimjp.github.io/xbrush_movie_MVP1/`
  - Production: `https://xbrush-moviemaker-mvp.web.app`

### Firebase Setup Information
- **Firebase CLI**: Installed globally via npm (2025-07-18)
- **Firebase Project**: `xbrush-moviemaker-mvp`
- **Firebase URLs**: 
  - Primary (use this): `https://xbrush-moviemaker-mvp.web.app`
  - Legacy (also works): `https://xbrush-moviemaker-mvp.firebaseapp.com`
- **Note**: Both Firebase URLs point to the same deployment. Use the `.web.app` domain as it's shorter and more modern.

### 2. Common Commands

#### Update Local Repository
```bash
cd /Users/jpkim/moviemaker_mvp01
git pull origin main
```

#### Check Status
```bash
git status
git log --oneline -5
```

#### Deploy
```bash
# Use the deployment script
./deploy.sh

# Or manually:
# GitHub Pages (automatic on push)
git push origin main

# Firebase (manual) - requires Firebase CLI login first
firebase deploy

# First time Firebase deployment:
# 1. npm install -g firebase-tools (if not installed)
# 2. firebase login (opens browser for Google auth)
# 3. firebase deploy
```

### 3. Important Files to Reference
- `CLAUDE.md` - Project instructions
- `firebase.json` - Firebase configuration
- `index.html` - Main application file
- `deploy.sh` - Deployment script

### 4. Sample Session Start Message

You can copy and paste this:

```
I'm working on the XBrush MovieMaker MVP project located at /Users/jpkim/moviemaker_mvp01/

Please help me:
1. Navigate to the project directory
2. Pull latest changes from remote (git pull origin main)
3. Show me the recent commits
4. Check if there are any local changes

Project info:
- GitHub: JPJPKIMJP/xbrush_movie_MVP1
- This is an AI video ad creation app
- We use GitHub Pages for testing and Firebase for production
```

### 5. Troubleshooting

If you encounter git-lfs errors:
- Git-lfs is already installed at `~/.local/bin/git-lfs`
- The issue should be resolved, but if it returns, mention it

### 6. Key Project Details
- **Tech Stack**: HTML/CSS/JavaScript, Firebase
- **Main Features**: AI-powered video ad creation
- **Deployment**: GitHub Pages (test) + Firebase (production)

## Quick Reference Card

```
📁 Project: /Users/jpkim/moviemaker_mvp01/
🔄 Update: git pull origin main  
🚀 Deploy: ./deploy.sh
🌐 Test: https://jpjpkimjp.github.io/xbrush_movie_MVP1/
🔥 Prod: https://xbrush-moviemaker-mvp.web.app
```

## Session History

### 2025-07-18
- Installed git-lfs to fix repository pull issues
- Successfully pulled latest changes from remote
- Installed Firebase CLI globally via npm
- Configured Firebase deployment (project: xbrush-moviemaker-mvp)
- Created deployment script (deploy.sh)
- Firebase hosting URLs confirmed:
  - Primary: https://xbrush-moviemaker-mvp.web.app
  - Legacy: https://xbrush-moviemaker-mvp.firebaseapp.com
- Note: Firebase deployment pending (needs firebase login first)

---
*Last updated: 2025-07-18*