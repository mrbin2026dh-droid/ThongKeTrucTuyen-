@echo off
chcp 65001 > nul
title HỆ THỐNG THỐNG KÊ CUỘC THI TRỰC TUYẾN - CVA LMS PWA

echo =================================================================
echo   ĐANG KHỞI ĐỘNG HỆ THỐNG THỐNG KÊ CUỘC THI TRỰC TUYẾN PWA
echo =================================================================
echo.

start "" "http://localhost:3008"
node server.js

pause
