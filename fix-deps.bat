@echo off
echo 🧹 Cleaning up old dependencies...
rd /s /q node_modules 2>nul
del package-lock.json 2>nul

echo 📦 Installing fresh dependencies...
npm install

echo ✅ Dependencies fixed! Ready to deploy.