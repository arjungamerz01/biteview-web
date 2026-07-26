@echo off
title BiteView One-Click Deploy

echo.
echo ===== BiteView Deploy =====
echo.

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes detected.
    pause
    exit
)

git commit -m "Website Update"
git push

echo.
echo Deploy completed successfully!
start https://biteview-web.vercel.app
pause