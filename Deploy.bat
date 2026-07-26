@echo off
title BiteView One-Click Deploy

echo.
echo ===============================
echo     BiteView Deploy Started
echo ===============================
echo.

git add .

git commit -m "Website Update"

git push

echo.
echo ===============================
echo      Deploy Completed!
echo Check GitHub & Vercel
echo ===============================
pause