#!/bin/bash

# Docker-based database export script
# This will create a PostgreSQL container and export data directly

echo "🐳 Starting Docker-based database export..."

# Database connection details for old database
OLD_DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
OLD_DB_PORT="5432"
OLD_DB_NAME="postgres"
OLD_DB_USER="postgres.gzhccauxdtboxrurwogk"
OLD_DB_PASSWORD="Bangalore*123"

# New database connection details
NEW_DB_HOST="db.pepgldetpvaiwawmmxox.supabase.co"
NEW_DB_PORT="5432"
NEW_DB_NAME="postgres"
NEW_DB_USER="postgres.pepgldetpvaiwawmmxox"
NEW_DB_PASSWORD=""  # We'll get this from environment

echo "📋 Exporting data from old database..."

# Create a temporary PostgreSQL container for export
docker run --rm -it \
  -e PGPASSWORD="$OLD_DB_PASSWORD" \
  postgres:15 \
  pg_dump \
  -h "$OLD_DB_HOST" \
  -p "$OLD_DB_PORT" \
  -U "$OLD_DB_USER" \
  -d "$OLD_DB_NAME" \
  --data-only \
  --column-inserts \
  --exclude-schema="information_schema,pg_*,graphql,graphql_public,pgsodium,pgsodium_masks,pgtle,repack,tiger,tiger_data,timescaledb_*,_timescaledb_*,topology,vault,extensions,pgbouncer,realtime,supabase_migrations,_analytics,_realtime,_supavisor" \
  > old-database-export.sql

if [ $? -eq 0 ]; then
    echo "✅ Data export completed successfully!"
    echo "📄 Export saved to: old-database-export.sql"
    
    # Show export summary
    echo "📊 Export Summary:"
    grep -c "INSERT INTO" old-database-export.sql | while read count; do
        echo "  - $count INSERT statements found"
    done
    
    echo ""
    echo "🔄 Next steps:"
    echo "1. Review the exported data: cat old-database-export.sql"
    echo "2. Import to new database using: docker-import-script.sh"
else
    echo "❌ Export failed. The old database might still be restricted."
    echo "💡 Try contacting Supabase support for data recovery."
fi
