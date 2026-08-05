@echo off
echo Pulling latest changes from remote...
git pull origin main --rebase

echo Staging changes...
git add .

echo Committing changes...
git commit -m "Update repository"

echo Pushing to GitHub...
git push origin main

echo Done!
pause
