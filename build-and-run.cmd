@echo off
rem ---------------------------------------------------------------------------------------------
rem Builds the MockHub UI, embeds it into the MockHub server and starts the server.
rem
rem   1. Builds this UI for embedding (npm run build:embedded)
rem   2. Moves dist to ..\mockhub\src\main\resources\ui
rem   3. Builds the mockhub jar (tests skipped for a quick start; "mvnw verify" runs them)
rem   4. Starts it: UI at http://localhost:8083/ui/  (Ctrl+C to stop)
rem
rem Expects the MockHub server project next to this one (..\mockhub).
rem Requirements: Node.js 20.19+ and Java 17+ on the PATH. Can be started from any folder.
rem ---------------------------------------------------------------------------------------------
setlocal

rem Absolute paths without a trailing backslash.
for %%I in ("%~dp0.") do set "UI_DIR=%%~fI"
for %%I in ("%~dp0..\mockhub") do set "BACKEND_DIR=%%~fI"
set "UI_TARGET=%BACKEND_DIR%\src\main\resources\ui"

where node >nul 2>nul || (echo Node.js was not found on the PATH. & exit /b 1)
where java >nul 2>nul || (echo Java was not found on the PATH. & exit /b 1)
if exist "%BACKEND_DIR%\mvnw.cmd" goto :backend_found
echo The MockHub server project was not found in "%BACKEND_DIR%".
exit /b 1
:backend_found

echo.
echo === [1/4] Building the frontend ===
cd /d "%UI_DIR%" || goto :fail
rem Fast when nothing changed; installs new dependencies after a pull.
call npm install --no-audit --no-fund || goto :fail
call npm run build:embedded || goto :fail

echo.
echo === [2/4] Moving dist to mockhub\src\main\resources\ui ===
if exist "%UI_TARGET%" rmdir /s /q "%UI_TARGET%" || goto :fail
move "%UI_DIR%\dist" "%UI_TARGET%" >nul || goto :fail

echo.
echo === [3/4] Building the backend (this takes a moment) ===
cd /d "%BACKEND_DIR%" || goto :fail
rem Full path: cmd does not search the current folder when NoDefaultCurrentDirectoryInExePath is set.
call "%BACKEND_DIR%\mvnw.cmd" -B -q clean package -DskipTests || goto :fail

rem "clean" leaves exactly one jar; its name contains the version from pom.xml.
set "JAR="
for %%J in ("%BACKEND_DIR%\target\mockhub-*.jar") do set "JAR=%%~fJ"
if not defined JAR (echo No jar found in mockhub\target. & goto :fail)

echo.
echo === [4/4] Starting MockHub (Ctrl+C to stop) ===
echo     UI:        http://localhost:8083/ui/
echo     API docs:  http://localhost:8083/help
echo.
java -jar "%JAR%"
exit /b %errorlevel%

:fail
echo.
echo *** Build failed, see the output above. ***
exit /b 1
