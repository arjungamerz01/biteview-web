@echo off
title BiteView Deploy

cd /d "%~dp0"

echo.
echo ==========================
echo Git Add
echo ==========================
git add .

echo.
echo ==========================
echo Git Commit
echo ==========================
git commit -m "Website Update"

echo.
echo ==========================
echo Git Push
echo ==========================
git push

echo.
echo ==========================
echo Done!
echo ==========================
pause