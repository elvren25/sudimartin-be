#!/bin/bash
# Initialize Railway Database
# Run this in Railway deployment

echo "🔄 Starting Railway Database Initialization..."
echo "Database URL: $DATABASE_URL"

# Make sure we're in backend directory
cd /app || cd $(dirname "$0")

# Run the initialize script with proper environment
node src/database/initialize.js

if [ $? -eq 0 ]; then
  echo "✅ Database initialization completed!"
else
  echo "❌ Database initialization failed!"
  exit 1
fi
