@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Nao foi possivel encontrar o npm/Node.js.
  echo Instale o Node.js e tente de novo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias do projeto...
  call npm install
)

start "" "http://localhost:5173"

call npm run dev -- --host 0.0.0.0 --port 5173
