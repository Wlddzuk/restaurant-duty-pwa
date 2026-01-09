#!/bin/bash
# Run this script after downloading to push to GitHub

# Create new repo on GitHub first:
# Go to https://github.com/new and create "restaurant-duty-pwa"

# Then run:
git init
git add .
git commit -m "feat: Restaurant Duty PWA - initial foundation"
git branch -M main
git remote add origin https://github.com/Wlddzuk/restaurant-duty-pwa.git
git push -u origin main

echo "✅ Pushed to GitHub!"
