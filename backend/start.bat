@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "VENV_DIR=%PROJECT_DIR%venv"
set "PIP_CACHE_DIR=%PROJECT_DIR%.pip-cache"
set "HF_HOME=%PROJECT_DIR%.hf-cache"
set "TRANSFORMERS_CACHE=%HF_HOME%\transformers"
set "TORCH_HOME=%PROJECT_DIR%.torch-cache"
set "XDG_CACHE_HOME=%PROJECT_DIR%.cache"

echo ============================================================
echo   NetraAI Backend - Starting Server
echo ============================================================
echo.

if not exist "%HF_HOME%" mkdir "%HF_HOME%"
if not exist "%TRANSFORMERS_CACHE%" mkdir "%TRANSFORMERS_CACHE%"
if not exist "%TORCH_HOME%" mkdir "%TORCH_HOME%"
if not exist "%XDG_CACHE_HOME%" mkdir "%XDG_CACHE_HOME%"

call "%VENV_DIR%\Scripts\activate"
if errorlevel 1 (
    echo [ERROR] Virtual environment not found or broken.
    echo Run setup.bat after installing Python 3.11 on D:.
    pause
    exit /b 1
)

echo [OK] Virtual environment activated
echo [OK] Runtime caches set to D: project folders
echo [OK] Starting server at http://localhost:8000
echo [OK] API docs at  http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server.
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
