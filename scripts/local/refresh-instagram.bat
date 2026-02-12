@echo off
REM Instagram Profile Refresh - Local Automation
REM Run this 3x daily to keep Instagram data fresh

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo Instagram Profile Refresh
echo Time: %date% %time%
echo ========================================

node scripts/refreshInstagramProfiles.js 15

echo.
echo Refresh complete!
pause
