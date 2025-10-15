# GoLong Supabase MCP Server - Usage Guide

## Quick Start

1. **Setup**: Run `./setup.sh` to install dependencies and build the server
2. **Configure**: Edit `.env` with your Supabase credentials
3. **Test**: Run `npm run test` to verify the server works
4. **Connect**: Add server configuration to your MCP client

## MCP Client Configuration Examples

### Claude Desktop
Add to `~/.config/claude-desktop/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "golong-supabase": {
      "command": "node",
      "args": ["/Users/yuvrajbarsara/golong/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Cursor IDE
Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "golong-supabase": {
      "command": "node",
      "args": ["/Users/yuvrajbarsara/golong/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Windsurf
Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "golong-supabase": {
      "command": "node",
      "args": ["/Users/yuvrajbarsara/golong/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Available Tools Reference

### Database Operations

#### `query_database`
Execute SQL queries on the database (SELECT only for safety).

**Parameters:**
- `query` (string, required): SQL query to execute
- `table` (string, optional): Table name for validation

**Example:**
```json
{
  "name": "query_database",
  "arguments": {
    "query": "SELECT * FROM streaks WHERE is_public = true LIMIT 10",
    "table": "streaks"
  }
}
```

#### `get_table_info`
Get detailed information about a specific table.

**Parameters:**
- `table_name` (string, required): Name of the table
- `include_sample` (boolean, optional): Include sample data (default: true)
- `limit` (number, optional): Number of sample records (default: 5)

**Example:**
```json
{
  "name": "get_table_info",
  "arguments": {
    "table_name": "streaks",
    "include_sample": true,
    "limit": 10
  }
}
```

### Streak Management

#### `create_streak`
Create a new streak in the database.

**Parameters:**
- `title` (string, required): Title of the streak
- `description` (string, optional): Description of the streak
- `category` (string, optional): Category of the streak
- `is_public` (boolean, optional): Whether the streak is public (default: true)
- `created_by` (string, required): User ID of the creator
- `tags` (array, optional): Tags for the streak (default: [])

**Example:**
```json
{
  "name": "create_streak",
  "arguments": {
    "title": "Daily Exercise",
    "description": "Exercise for 30 minutes every day",
    "category": "Health",
    "is_public": true,
    "created_by": "user-uuid-here",
    "tags": ["fitness", "health", "exercise"]
  }
}
```

#### `join_streak`
Join a user to an existing streak.

**Parameters:**
- `user_id` (string, required): User ID joining the streak
- `streak_id` (string, required): Streak ID to join

**Example:**
```json
{
  "name": "join_streak",
  "arguments": {
    "user_id": "user-uuid-here",
    "streak_id": "streak-uuid-here"
  }
}
```

#### `add_checkin`
Add a daily check-in for a user streak.

**Parameters:**
- `user_streak_id` (string, required): User streak ID
- `checkin_date` (string, required): Date of check-in (YYYY-MM-DD format)

**Example:**
```json
{
  "name": "add_checkin",
  "arguments": {
    "user_streak_id": "user-streak-uuid-here",
    "checkin_date": "2024-01-15"
  }
}
```

#### `get_user_streaks`
Get all streaks for a specific user.

**Parameters:**
- `user_id` (string, required): User ID to get streaks for
- `include_inactive` (boolean, optional): Include inactive streaks (default: false)

**Example:**
```json
{
  "name": "get_user_streaks",
  "arguments": {
    "user_id": "user-uuid-here",
    "include_inactive": false
  }
}
```

#### `get_public_streaks`
Get public streaks with optional filtering.

**Parameters:**
- `category` (string, optional): Filter by category
- `tags` (array, optional): Filter by tags
- `limit` (number, optional): Maximum number of streaks (default: 50)
- `offset` (number, optional): Number of streaks to skip (default: 0)

**Example:**
```json
{
  "name": "get_public_streaks",
  "arguments": {
    "category": "Health",
    "tags": ["fitness", "exercise"],
    "limit": 20,
    "offset": 0
  }
}
```

#### `get_leaderboard`
Get leaderboard for a specific streak.

**Parameters:**
- `streak_id` (string, required): Streak ID to get leaderboard for
- `type` (string, optional): Type of leaderboard - "current" or "longest" (default: "current")
- `limit` (number, optional): Number of top users (default: 10)

**Example:**
```json
{
  "name": "get_leaderboard",
  "arguments": {
    "streak_id": "streak-uuid-here",
    "type": "current",
    "limit": 10
  }
}
```

## Available Resources

### `golong://database/schema`
Complete database schema documentation.

### `golong://database/tables`
List of all available database tables.

### `golong://database/profiles`
User profiles table information and sample data.

### `golong://database/streaks`
Streaks table information and sample data.

### `golong://database/user_streaks`
User streaks table information and sample data.

### `golong://database/checkins`
Checkins table information and sample data.

## Common Use Cases

### 1. Database Exploration
- "Show me the database schema"
- "What tables are available?"
- "Describe the structure of the profiles table"

### 2. Streak Management
- "Create a new streak called 'Daily Reading'"
- "Join user abc123 to streak xyz789"
- "Add a check-in for today"

### 3. Analytics and Reporting
- "Show me all public streaks in the Health category"
- "Get the leaderboard for streak abc123"
- "Find users with the longest streaks"

### 4. Data Validation
- "Check if there are any orphaned records"
- "Find streaks with no participants"
- "Show me users with no streaks"

## Security Considerations

### Row Level Security (RLS)
The MCP server respects Supabase RLS policies. Users can only access data they have permission to see based on:
- Their authentication status
- RLS policies defined in your database
- Service role permissions

### SQL Injection Protection
- Only SELECT queries are allowed through the `query_database` tool
- Dangerous SQL keywords (DROP, DELETE, TRUNCATE, etc.) are blocked
- Input validation using Zod schemas

### Service Role Key
- Uses Supabase service role key for administrative operations
- Should be kept secure and not exposed in client-side code
- Has elevated permissions to bypass RLS when needed

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify SUPABASE_URL is correct
   - Check SUPABASE_SERVICE_ROLE_KEY is valid
   - Ensure Supabase project is active

2. **Permission Errors**
   - Verify service role key has proper permissions
   - Check RLS policies are correctly configured
   - Ensure user authentication is working

3. **Build Errors**
   - Run `npm install` to ensure dependencies are installed
   - Check TypeScript configuration
   - Verify Node.js version compatibility

### Debug Mode
Set `NODE_ENV=development` for additional logging and error details.

### Testing
Run `npm run test` to verify the server is working correctly.

## Advanced Usage

### Custom SQL Queries
Use the `query_database` tool for complex queries:

```sql
-- Get streak statistics
SELECT 
  category,
  COUNT(*) as streak_count,
  AVG(current_streak_days) as avg_current_streak
FROM streaks s
JOIN user_streaks us ON s.id = us.streak_id
WHERE s.is_public = true
GROUP BY category
ORDER BY streak_count DESC;
```

### Batch Operations
Combine multiple tool calls for complex operations:

1. Create a streak
2. Join multiple users to the streak
3. Add initial check-ins
4. Get the leaderboard

### Integration with Other Tools
The MCP server can be used alongside other MCP servers for comprehensive workflows:
- File system operations
- API calls
- Code generation
- Data analysis

## Performance Tips

1. **Use Limits**: Always specify limits for large datasets
2. **Filter Early**: Use WHERE clauses to reduce data transfer
3. **Index Usage**: Leverage database indexes for common queries
4. **Batch Operations**: Combine related operations when possible

## Support and Contributing

### Getting Help
- Check the troubleshooting section
- Review Supabase documentation
- Open an issue in the repository

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Feature Requests
Suggest new tools or resources that would be useful for your use case.

