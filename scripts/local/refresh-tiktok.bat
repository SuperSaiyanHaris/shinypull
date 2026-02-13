@echo off
REM TikTok Profile Refresh - Local Automation
REM Run this 3x daily to keep TikTok data fresh

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo TikTok Profile Refresh
echo Time: %date% %time%
echo ========================================

node scripts/refreshTikTokProfiles.js 15

echo.
echo Refresh complete!
pause
