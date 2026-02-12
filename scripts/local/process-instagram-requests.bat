@echo off
REM Instagram Creator Requests - Local Automation
REM Run this 4x daily (every 6 hours) to process pending requests

cd /d "d:\Claude\ShinyPull"

echo ========================================
echo Instagram Creator Request Processor
echo Time: %date% %time%
echo ========================================

node scripts/processCreatorRequests.js

echo.
echo Processing complete!
pause
