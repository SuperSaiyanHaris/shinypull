@echo off
REM Instagram Creator Discovery - Local Automation
REM Run this weekly to discover new popular Instagram creators

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo Instagram Creator Discovery
echo Time: %date% %time%
echo ========================================

node scripts/discoverInstagramCreators.js 10

echo.
echo Discovery complete!
pause
