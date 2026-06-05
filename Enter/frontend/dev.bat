@echo off
cd /d "%~dp0"
echo Starting dev server with hot reload...
npx next dev -p 3000
pause