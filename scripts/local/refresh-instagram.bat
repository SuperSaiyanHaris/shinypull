@echo off
REM Instagram Profile Refresh - Local Automation
REM Run 2x daily to keep ALL Instagram creators updated with daily stats

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo Instagram Profile Refresh (ALL creators)
echo Time: %date% %time%
echo ========================================

REM No count argument = process ALL creators (~12 min for 140 creators)
node scripts/refreshInstagramProfiles.js

echo.
echo Refresh complete!
pause
