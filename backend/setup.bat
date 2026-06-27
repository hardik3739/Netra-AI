@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "VENV_DIR=%PROJECT_DIR%venv"
set "PIP_CACHE_DIR=%PROJECT_DIR%.pip-cache"
set "NPM_CONFIG_CACHE=%PROJECT_DIR%.npm-cache"
set "HF_HOME=%PROJECT_DIR%.hf-cache"
set "TRANSFORMERS_CACHE=%HF_HOME%\transformers"
set "TORCH_HOME=%PROJECT_DIR%.torch-cache"
set "XDG_CACHE_HOME=%PROJECT_DIR%.cache"

echo ============================================================
echo   NetraAI Setup - D: drive friendly install
echo ============================================================
echo.
echo Project: %PROJECT_DIR%
echo Python cache: %PIP_CACHE_DIR%
echo npm cache:    %NPM_CONFIG_CACHE%
echo Model cache:  %HF_HOME%
echo.

if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"
if not exist "%NPM_CONFIG_CACHE%" mkdir "%NPM_CONFIG_CACHE%"
if not exist "%HF_HOME%" mkdir "%HF_HOME%"
if not exist "%TRANSFORMERS_CACHE%" mkdir "%TRANSFORMERS_CACHE%"
if not exist "%TORCH_HOME%" mkdir "%TORCH_HOME%"
if not exist "%XDG_CACHE_HOME%" mkdir "%XDG_CACHE_HOME%"

REM Prefer a Python installed on D:, then fall back to PATH.
set "PYTHON_EXE="
if exist "%PROJECT_DIR%python311\python.exe" set "PYTHON_EXE=%PROJECT_DIR%python311\python.exe"
if not defined PYTHON_EXE if exist "D:\Python311\python.exe" set "PYTHON_EXE=D:\Python311\python.exe"
if not defined PYTHON_EXE set "PYTHON_EXE=python"

echo [1/6] Checking Python...
"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo.
    echo To keep C: free, install Python 3.11 using "Customize installation"
    echo and choose a D: path, for example:
    echo.
    echo   D:\Python311
    echo.
    echo Then run this setup again.
    pause
    exit /b 1
)
"%PYTHON_EXE%" --version
"%PYTHON_EXE%" -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 11) and 'msys' not in sys.executable.lower() else 1)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This project needs normal Windows Python 3.11.
    echo.
    echo Install Python 3.11 to D:\Python311, then run setup.bat again.
    echo Avoid using MSYS/Blender Python for this backend.
    pause
    exit /b 1
)

echo.
echo [2/6] Creating Python virtual environment on D:...
if exist "%VENV_DIR%\Scripts\python.exe" (
    "%VENV_DIR%\Scripts\python.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Existing virtual environment is broken. Recreating it on D:...
        rmdir /s /q "%VENV_DIR%"
    )
)
if not exist "%VENV_DIR%\Scripts\python.exe" (
    "%PYTHON_EXE%" -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [OK] Existing virtual environment found.
)

echo.
echo [3/6] Installing Python packages with D: pip cache...
call "%VENV_DIR%\Scripts\activate"
python -m pip install --cache-dir "%PIP_CACHE_DIR%" -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Python package installation failed.
    pause
    exit /b 1
)

echo.
echo [4/6] Installing root frontend packages with D: npm cache...
if exist package.json (
    call npm.cmd install --cache "%NPM_CONFIG_CACHE%"
    if errorlevel 1 (
        echo [ERROR] Root frontend npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo [5/6] Installing audit-trail frontend packages with D: npm cache...
if exist "%PROJECT_DIR%netraai-audit-trail\package.json" (
    pushd "%PROJECT_DIR%netraai-audit-trail"
    call npm.cmd install --cache "%NPM_CONFIG_CACHE%"
    if errorlevel 1 (
        popd
        echo [ERROR] Audit-trail frontend npm install failed.
        pause
        exit /b 1
    )
    popd
)

echo.
echo [6/6] Setting up environment file...
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env file created from template.
    echo [ACTION] Edit .env and set your PostgreSQL password.
) else (
    echo [OK] .env already exists, skipping.
)

echo.
echo ============================================================
echo   Setup complete
echo ============================================================
echo.
echo Large install caches are now inside this D: project folder:
echo   .pip-cache
echo   .npm-cache
echo   .hf-cache
echo   .torch-cache
echo.
echo Start backend:
echo   start.bat
echo.
echo Start frontend:
echo   npm.cmd run dev
echo.
pause
