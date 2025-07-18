#!/bin/bash

# Deploy script for XBrush MovieMaker MVP

echo "🚀 XBrush Deployment Script"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to deploy to GitHub Pages
deploy_github() {
    echo -e "${BLUE}📦 Deploying to GitHub Pages...${NC}"
    git add .
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
    git push origin main
    echo -e "${GREEN}✅ GitHub Pages deployment complete!${NC}"
    echo "🌐 Live at: https://jpjpkimjp.github.io/xbrush_movie_MVP1/"
}

# Function to deploy to Firebase
deploy_firebase() {
    echo -e "${BLUE}🔥 Deploying to Firebase...${NC}"
    firebase deploy
    echo -e "${GREEN}✅ Firebase deployment complete!${NC}"
    echo "🌐 Live at: https://xbrush-moviemaker-mvp.web.app"
}

# Main menu
echo "Choose deployment option:"
echo "1) GitHub Pages only (test environment)"
echo "2) Firebase only (production)"
echo "3) Both GitHub Pages and Firebase"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_github
        ;;
    2)
        deploy_firebase
        ;;
    3)
        deploy_github
        echo ""
        deploy_firebase
        ;;
    4)
        echo "Deployment cancelled."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"