# GoLong Supabase MCP Server - Example Prompts

This file contains example prompts you can use with AI assistants that have access to the GoLong Supabase MCP server.

## Database Exploration

### Schema and Structure
- "Show me the complete database schema for the GoLong app"
- "What tables are available in the database?"
- "Describe the structure of the profiles table"
- "What are the relationships between streaks and user_streaks tables?"

### Table Information
- "Get information about the streaks table including sample data"
- "Show me the schema for the checkins table"
- "What fields are available in the user_streaks table?"

## Streak Management

### Creating Streaks
- "Create a new streak called 'Daily Reading' in the Learning category for user abc123"
- "Make a public streak for 'Morning Meditation' with tags wellness and mindfulness"
- "Create a private streak for 'No Social Media' in the Productivity category"

### Joining Streaks
- "Join user xyz789 to streak abc123"
- "Add user def456 to the 'Daily Exercise' streak"

### Check-ins
- "Add a check-in for user_streak_id abc123 on today's date"
- "Record a check-in for yesterday for user_streak_id xyz789"

## Data Queries

### User Streaks
- "Show me all active streaks for user abc123"
- "Get all streaks (including inactive) for user xyz789"
- "Find streaks where user abc123 has the longest streak"

### Public Streaks
- "Show me all public streaks in the Health category"
- "Find public streaks with the tag 'fitness'"
- "Get the top 10 most popular public streaks"
- "Show me streaks created in the last week"

### Leaderboards
- "Get the current streak leaderboard for streak abc123"
- "Show me the longest streak leaderboard for streak xyz789"
- "Who has the longest streak in the 'Daily Exercise' streak?"

## Analytics and Insights

### User Analytics
- "How many streaks has user abc123 joined?"
- "What's the average streak length for user xyz789?"
- "Show me the streak categories that user abc123 participates in most"

### Streak Analytics
- "How many users are participating in streak abc123?"
- "What's the completion rate for the 'Daily Meditation' streak?"
- "Show me streaks with the highest participation rates"

### Time-based Queries
- "Find all check-ins from the last 7 days"
- "Show me streaks created this month"
- "Get users who joined streaks in the last week"

## Social Features

### Comments and Likes
- "Show me all comments on streak abc123"
- "How many likes does streak xyz789 have?"
- "Find streaks with the most social engagement"

### Notifications
- "Show me unread notifications for user abc123"
- "What types of notifications are most common?"

## Advanced Queries

### Complex Analytics
- "Find users who have maintained streaks for more than 30 days"
- "Show me streaks that have been active for over 6 months"
- "Get users who joined multiple streaks this week"

### Data Relationships
- "Show me the complete streak information including creator and participants"
- "Get user profiles along with their streak participation"
- "Find streaks where the creator is also the top performer"

## Troubleshooting and Debugging

### Data Validation
- "Check if there are any orphaned check-ins"
- "Find streaks with no participants"
- "Show me users with no streaks"

### Performance Queries
- "Find streaks with the most check-ins"
- "Show me the most active users by check-in count"
- "Get streaks with the highest daily participation"

## Example Complex Scenarios

### User Onboarding Analysis
- "Show me new users who joined their first streak in the last week"
- "Find users who created streaks but haven't joined any others"
- "Get users who are most active in joining public streaks"

### Streak Health Analysis
- "Find streaks that are losing participants"
- "Show me streaks with declining check-in rates"
- "Identify streaks that might need moderation"

### Community Insights
- "What are the most popular streak categories?"
- "Show me the most successful streak creators"
- "Find users who are most helpful in the community"

## Natural Language Variations

You can phrase these queries in many different ways:

- Instead of "Show me..." try "Display...", "List...", "Get...", "Find..."
- Instead of "Create a streak" try "Make a new streak", "Add a streak", "Set up a streak"
- Instead of "Get leaderboard" try "Show rankings", "Display top performers", "Find winners"

## Tips for Better Results

1. **Be Specific**: Include user IDs, streak IDs, or specific criteria when possible
2. **Use Categories**: Reference categories like "Health", "Learning", "Productivity"
3. **Include Timeframes**: Specify dates, weeks, months when relevant
4. **Ask Follow-ups**: Build on previous queries for deeper insights
5. **Combine Concepts**: Mix different aspects like "Show me Health streaks with the most participants"

Remember: The MCP server respects Row Level Security policies, so you'll only see data you have permission to access based on your Supabase configuration.

