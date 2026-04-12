#!/bin/bash
echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

echo "📦 Installing fresh dependencies..."
npm install

echo "✅ Dependencies fixed! Ready to deploy."