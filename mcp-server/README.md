# GoLong Supabase MCP Server

A Model Context Protocol (MCP) server that provides AI tools with access to your GoLong Supabase database. This server enables natural language interactions with your streak tracking database through AI assistants like Claude, Cursor, and Windsurf.

## Features

- **Database Querying**: Execute SQL queries safely through natural language
- **Table Management**: Get table schemas, sample data, and metadata
- **Streak Operations**: Create streaks, join streaks, add check-ins
- **User Management**: Get user streaks, leaderboards, and analytics
- **Social Features**: Access comments, likes, and notifications
- **Security**: Row Level Security (RLS) compliance and SQL injection protection

## Installation

1. **Clone and Setup**:
   ```bash
   cd /Users/yuvrajbarsara/golong/mcp-server
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Build the Server**:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MCP_SERVER_NAME=golong-supabase-mcp-server
MCP_SERVER_VERSION=1.0.0
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., `~/.config/claude-desktop/claude_desktop_config.json`):

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

## Available Tools

### Database Operations

- **`query_database`**: Execute SQL queries (SELECT only for safety)
- **`get_table_info`**: Get table schema and sample data

### Streak Management

- **`create_streak`**: Create a new streak
- **`join_streak`**: Join a user to a streak
- **`add_checkin`**: Add a daily check-in
- **`get_user_streaks`**: Get all streaks for a user
- **`get_public_streaks`**: Get public streaks with filtering
- **`get_leaderboard`**: Get leaderboard for a streak

## Available Resources

- **`golong://database/schema`**: Complete database schema
- **`golong://database/tables`**: List of all tables
- **`golong://database/profiles`**: User profiles table info
- **`golong://database/streaks`**: Streaks table info
- **`golong://database/user_streaks`**: User streaks table info
- **`golong://database/checkins`**: Checkins table info

## Usage Examples

### Natural Language Queries

You can now ask AI assistants questions like:

- "Show me all public streaks in the Health category"
- "Create a new streak called 'Daily Meditation' for user abc123"
- "Get the leaderboard for streak xyz789"
- "Find all users who joined streaks this week"
- "Show me the database schema for the profiles table"

### Example Tool Calls

```typescript
// Get table information
await callTool('get_table_info', {
  table_name: 'streaks',
  include_sample: true,
  limit: 10
});

// Create a new streak
await callTool('create_streak', {
  title: 'Daily Exercise',
  description: 'Exercise for 30 minutes every day',
  category: 'Health',
  is_public: true,
  created_by: 'user-uuid',
  tags: ['fitness', 'health']
});

// Get user streaks
await callTool('get_user_streaks', {
  user_id: 'user-uuid',
  include_inactive: false
});
```

## Database Schema

The MCP server works with your GoLong database schema including:

- **Core Tables**: profiles, streaks, user_streaks, checkins
- **Social Features**: comments, likes, notifications
- **Advanced Features**: achievements, challenges, groups, analytics
- **Security**: Row Level Security (RLS) policies
- **Performance**: Optimized indexes and triggers

## Security Features

- **SQL Injection Protection**: Only SELECT queries allowed for safety
- **RLS Compliance**: Respects Supabase Row Level Security policies
- **Service Role**: Uses service role key for administrative operations
- **Input Validation**: Zod schemas for all tool inputs

## Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Testing

The server can be tested by connecting an MCP client or using the stdio transport directly.

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify Supabase URL and service role key
2. **Permission Errors**: Ensure service role key has proper permissions
3. **Build Errors**: Check TypeScript configuration and dependencies

### Debug Mode

Set `NODE_ENV=development` for additional logging and error details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Supabase documentation
- Open an issue in the repository

