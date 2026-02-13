@echo off
REM TikTok Creator Discovery - Local Automation
REM Run this to discover and add new TikTok creators from the curated list

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo TikTok Creator Discovery
echo Time: %date% %time%
echo ========================================

node scripts/discoverTikTokCreators.js 10

echo.
echo Discovery complete!
pause
