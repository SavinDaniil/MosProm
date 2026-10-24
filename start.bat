@echo off
setlocal
set "PYTHON_ARGS="
cd /d "%~dp0"

if not exist "ochakovo-game\dist\index.html" (
    echo ERROR: ochakovo-game\dist\index.html not found.
    pause
    exit /b 1
)

python -c "import sys; assert sys.version_info >= (3, 7)" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON=python"
    goto launch
)
py -3 -c "import sys; assert sys.version_info >= (3, 7)" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON=py"
    set "PYTHON_ARGS=-3"
    goto launch
)
set "PYTHON=%LOCALAPPDATA%\OchakovoGame\Python\python.exe"
"%PYTHON%" -c "import http.server" >nul 2>&1
if not errorlevel 1 goto launch
echo Python is missing. Downloading and installing it automatically...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-python.ps1"
if not errorlevel 1 goto launch
echo Automatic installation failed. Check your Internet connection and try again.
pause
exit /b 1

:launch
echo Starting Ochakovo: http://localhost:4174
echo Keep this window open. Press Ctrl+C to stop the server.
"%PYTHON%" %PYTHON_ARGS% -c "import functools,http.server,threading,webbrowser; server=http.server.ThreadingHTTPServer(('127.0.0.1',4174),functools.partial(http.server.SimpleHTTPRequestHandler,directory='ochakovo-game/dist')); threading.Timer(1,lambda:webbrowser.open('http://localhost:4174')).start(); server.serve_forever()"
if errorlevel 1 (
    echo Server stopped or could not start. Check that port 4174 is available.
    pause
)
