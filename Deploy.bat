@echo off
title BiteView One-Click Deploy

:: ================================
:: SETTINGS
:: ================================
set BACKUP_DIR=C:\Users\KD\Desktop\biteview-web_backup

:: Create backup folder if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Create timestamp
for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set TIMESTAMP=%%a

echo.
echo ======================================
echo Creating Backup...
echo ======================================

:: Copy project
powershell -NoProfile -Command ^
"Copy-Item '%CD%' '%BACKUP_DIR%\Backup_%TIMESTAMP%' -Recurse"

:: Keep only latest 5 backups
powershell -NoProfile -Command ^
"$b=Get-ChildItem '%BACKUP_DIR%'|Sort LastWriteTime -Descending; if($b.Count -gt 5){$b|Select -Skip 5|Remove-Item -Recurse -Force}"

echo Backup Created!

echo.
echo ======================================
echo Deploy Started...
echo ======================================

git add .

git commit -m "Website Update"

git push

echo.
echo ======================================
echo Deploy Complete!
echo ======================================
echo.
echo Your website:
echo https://biteview-web.vercel.app
echo.
pause