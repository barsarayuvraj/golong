#!/bin/bash

# Docker-based database import script
# This will import the exported data into the new database

echo "🐳 Starting Docker-based database import..."

# New database connection details
NEW_DB_HOST="db.pepgldetpvaiwawmmxox.supabase.co"
NEW_DB_PORT="5432"
NEW_DB_NAME="postgres"
NEW_DB_USER="postgres.pepgldetpvaiwawmmxox"

# Get password from environment or prompt
if [ -z "$NEW_DB_PASSWORD" ]; then
    echo "Enter password for new database:"
    read -s NEW_DB_PASSWORD
fi

# Check if export file exists
if [ ! -f "old-database-export.sql" ]; then
    echo "❌ Export file 'old-database-export.sql' not found!"
    echo "💡 Run docker-export-script.sh first to export the data."
    exit 1
fi

echo "📋 Importing data to new database..."

# Create a temporary PostgreSQL container for import
docker run --rm -it \
  -e PGPASSWORD="$NEW_DB_PASSWORD" \
  -v "$(pwd)/old-database-export.sql:/tmp/import.sql" \
  postgres:15 \
  psql \
  -h "$NEW_DB_HOST" \
  -p "$NEW_DB_PORT" \
  -U "$NEW_DB_USER" \
  -d "$NEW_DB_NAME" \
  -f /tmp/import.sql

if [ $? -eq 0 ]; then
    echo "✅ Data import completed successfully!"
    echo "🎉 Your data has been migrated to the new database!"
else
    echo "❌ Import failed. Check the error messages above."
    echo "💡 You may need to adjust the SQL file or check database permissions."
fi
