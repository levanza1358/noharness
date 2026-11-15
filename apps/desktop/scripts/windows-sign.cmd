@echo off
setlocal DisableDelayedExpansion
set "signTool=%NHS_DESKTOP_WINDOWS_SIGNTOOL%"
set "certificateFile=%NHS_DESKTOP_WINDOWS_CER_FILE%"
set "tokenPin=%NHS_DESKTOP_WINDOWS_TOKEN_PIN%"
set "keyContainer=%NHS_DESKTOP_WINDOWS_KEY_CONTAINER%"
set "targetFile=%NHS_DESKTOP_WINDOWS_SIGN_TARGET%"
set "appendSignature="
if "%NHS_DESKTOP_WINDOWS_SIGN_APPEND%"=="1" set "appendSignature=/as"
set "NHS_DESKTOP_WINDOWS_SIGNTOOL="
set "NHS_DESKTOP_WINDOWS_CER_FILE="
set "NHS_DESKTOP_WINDOWS_TOKEN_PIN="
set "NHS_DESKTOP_WINDOWS_KEY_CONTAINER="
set "NHS_DESKTOP_WINDOWS_SIGN_TARGET="
set "NHS_DESKTOP_WINDOWS_SIGN_APPEND="
set "signTool=" & set "certificateFile=" & set "tokenPin=" & set "keyContainer=" & set "targetFile=" & set "appendSignature=" & "%signTool%" sign /v /fd sha256 /f "%certificateFile%" /kc "[{{%tokenPin%}}]=%keyContainer%" /csp "eToken Base Cryptographic Provider" %appendSignature% "%targetFile%"
exit /b %errorlevel%
