cd %cd%
node uno.js
:loop
pause
@echo off
cls
call node uno.js
goto :loop
