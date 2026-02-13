@echo off
REM TikTok Profile Refresh - Local Automation
REM Run 2x daily to keep ALL TikTok creators updated with daily stats

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo TikTok Profile Refresh (ALL creators)
echo Time: %date% %time%
echo ========================================

REM No count argument = process ALL creators (~4 min for 114 creators)
node scripts/refreshTikTokProfiles.js

echo.
echo Refresh complete!
pause
