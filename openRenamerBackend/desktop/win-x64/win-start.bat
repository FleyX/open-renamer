@echo off
setlocal

REM get bat path
set "script_dir=%~dp0"
echo current path:"%script_dir%"

REM delete port file
if exist "%script_dir%data\port" del "%script_dir%data\port"

REM start app
start "" /B "%script_dir%renamer-win.exe" env:desktop

REM wait app start
:wait_for_port
if not exist "%script_dir%data\port" (
    echo wait app start
    timeout /t 1 >nul
    goto wait_for_port
)

REM open browser
set /p port=<"%script_dir%data\port"
echo %port%
start "" "http://localhost:%port%"

exit
endlocal