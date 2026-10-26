@echo off
set SOURCE=%USERPROFILE%\Desktop\seo-files
set DEST=%~dp0

if not exist "%SOURCE%" (
    echo [ERROR] Source directory not found: "%SOURCE%"
    pause
    exit /b 1
)

echo Copying SEO files from "%SOURCE%" to "%DEST%"...
copy /Y "%SOURCE%\*" "%DEST%" >nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] SEO files updated successfully!
) else (
    echo [ERROR] Failed to copy some files.
)

pause

