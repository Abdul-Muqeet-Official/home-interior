@echo off
setlocal
set "WD=c:\Users\DELL\Desktop\HomeInterior web\home-interior"
cd /d "%WD%"
set CI=1
echo === type-check ===
node "%WD%\node_modules\typescript\bin\tsc" --noEmit
echo [type-check exit=%ERRORLEVEL%]
echo === lint ===
node "%WD%\node_modules\eslint\bin\eslint.js" app components lib --max-warnings 0
echo [lint exit=%ERRORLEVEL%]
echo === build ===
npm run build
echo [build exit=%ERRORLEVEL%]
