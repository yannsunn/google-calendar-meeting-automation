@echo off
echo ================================================
echo N8N Workflow Auto Import
echo ================================================
echo.

echo [1/3] Opening N8N...
start https://n8n.srv946785.hstgr.cloud

echo [2/3] Opening workflow file...
start "" "%~dp0n8n-workflows\complete-notification-system.json"

echo [3/3] Opening workflow folder...
explorer "%~dp0n8n-workflows"

echo.
echo ================================================
echo NEXT STEPS:
echo ================================================
echo 1. Wait for N8N to load in browser
echo 2. Drag 'complete-notification-system.json' to N8N
echo 3. Select Google Calendar credentials
echo 4. Click 'Save' and set to 'Active'
echo ================================================
echo.
pause
