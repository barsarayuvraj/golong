# GoLong Project MCP Configuration

This directory contains the Model Context Protocol (MCP) configuration for the GoLong project.

## Files

- `mcp.json` - MCP server configuration for project-specific database access

## MCP Server: golong-supabase

The `golong-supabase` MCP server provides AI assistants with access to your GoLong Supabase database through natural language queries.

### Available Tools

- `query_database` - Execute SQL queries safely
- `get_table_info` - Get table schemas and sample data
- `create_streak` - Create new streaks
- `join_streak` - Join users to streaks
- `add_checkin` - Add daily check-ins
- `get_user_streaks` - Get user's streaks
- `get_public_streaks` - Get public streaks with filtering
- `get_leaderboard` - Get streak leaderboards

### Available Resources

- `golong://database/schema` - Complete database schema
- `golong://database/tables` - List of all database tables
- `golong://database/profiles` - User profiles table info
- `golong://database/streaks` - Streaks table info
- `golong://database/user_streaks` - User streaks table info
- `golong://database/checkins` - Checkins table info

## Usage

When working in this project, you can ask AI assistants questions like:

- "Show me the database schema"
- "What tables are available in the database?"
- "Get information about the streaks table"
- "Show me all public streaks"
- "Create a new streak called 'Daily Exercise'"

## Security

- The MCP server uses your Supabase service role key
- Only SELECT queries are allowed for safety
- Row Level Security (RLS) policies are respected
- This configuration is excluded from version control

## Server Location

The MCP server is located at: `/Users/yuvrajbarsara/golong/mcp-server/`
