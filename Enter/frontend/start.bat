@echo off
cd /d "%~dp0"
echo Building...
call npx next build
echo Starting production server...
npx next start -p 3000
pause