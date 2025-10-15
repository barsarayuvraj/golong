#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database schema types based on your Supabase schema
interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
}

interface Streak {
  id: string;
  title: string;
  description?: string;
  category?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_active: boolean;
}

interface UserStreak {
  id: string;
  user_id: string;
  streak_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_checkin_date?: string;
  joined_at: string;
  is_active: boolean;
}

interface Checkin {
  id: string;
  user_streak_id: string;
  checkin_date: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MCP Server instance
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'golong-supabase-mcp-server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define MCP Tools
const tools: Tool[] = [
  {
    name: 'query_database',
    description: 'Execute SQL queries on the Supabase database',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute',
        },
        table: {
          type: 'string',
          description: 'Table name (optional, for validation)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_table_info',
    description: 'Get information about a specific table including schema and sample data',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to get information about',
        },
        include_sample: {
          type: 'boolean',
          description: 'Whether to include sample data (default: true)',
          default: true,
        },
        limit: {
          type: 'number',
          description: 'Number of sample records to return (default: 5)',
          default: 5,
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'create_streak',
    description: 'Create a new streak in the database',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the streak',
        },
        description: {
          type: 'string',
          description: 'Description of the streak',
        },
        category: {
          type: 'string',
          description: 'Category of the streak',
        },
        is_public: {
          type: 'boolean',
          description: 'Whether the streak is public',
          default: true,
        },
        created_by: {
          type: 'string',
          description: 'User ID of the creator',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the streak',
          default: [],
        },
      },
      required: ['title', 'created_by'],
    },
  },
  {
    name: 'join_streak',
    description: 'Join a user to a streak',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User ID joining the streak',
        },
        streak_id: {
          type: 'string',
          description: 'Streak ID to join',
        },
      },
      required: ['user_id', 'streak_id'],
    },
  },
  {
    name: 'add_checkin',
    description: 'Add a check-in for a user streak',
    inputSchema: {
      type: 'object',
      properties: {
        user_streak_id: {
          type: 'string',
          description: 'User streak ID',
        },
        checkin_date: {
          type: 'string',
          description: 'Date of check-in (YYYY-MM-DD format)',
        },
      },
      required: ['user_streak_id', 'checkin_date'],
    },
  },
  {
    name: 'get_user_streaks',
    description: 'Get all streaks for a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User ID to get streaks for',
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive streaks',
          default: false,
        },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_public_streaks',
    description: 'Get all public streaks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of streaks to return',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of streaks to skip',
          default: 0,
        },
      },
    },
  },
  {
    name: 'get_leaderboard',
    description: 'Get leaderboard for a specific streak',
    inputSchema: {
      type: 'object',
      properties: {
        streak_id: {
          type: 'string',
          description: 'Streak ID to get leaderboard for',
        },
        type: {
          type: 'string',
          enum: ['current', 'longest'],
          description: 'Type of leaderboard (current or longest streak)',
          default: 'current',
        },
        limit: {
          type: 'number',
          description: 'Number of top users to return',
          default: 10,
        },
      },
      required: ['streak_id'],
    },
  },
];

// Define MCP Resources
const resources: Resource[] = [
  {
    uri: 'golong://database/schema',
    name: 'Database Schema',
    description: 'Complete database schema for GoLong app',
    mimeType: 'application/sql',
  },
  {
    uri: 'golong://database/tables',
    name: 'Database Tables',
    description: 'List of all database tables',
    mimeType: 'application/json',
  },
  {
    uri: 'golong://database/profiles',
    name: 'Profiles Table',
    description: 'User profiles table information',
    mimeType: 'application/json',
  },
  {
    uri: 'golong://database/streaks',
    name: 'Streaks Table',
    description: 'Streaks table information',
    mimeType: 'application/json',
  },
  {
    uri: 'golong://database/user_streaks',
    name: 'User Streaks Table',
    description: 'User streaks table information',
    mimeType: 'application/json',
  },
  {
    uri: 'golong://database/checkins',
    name: 'Checkins Table',
    description: 'Checkins table information',
    mimeType: 'application/json',
  },
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'golong://database/schema':
      return {
        contents: [
          {
            type: 'text',
            text: await getDatabaseSchema(),
          } as TextContent,
        ],
      };

    case 'golong://database/tables':
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(await getTableList(), null, 2),
          } as TextContent,
        ],
      };

    case 'golong://database/profiles':
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(await getTableInfo('profiles'), null, 2),
          } as TextContent,
        ],
      };

    case 'golong://database/streaks':
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(await getTableInfo('streaks'), null, 2),
          } as TextContent,
        ],
      };

    case 'golong://database/user_streaks':
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(await getTableInfo('user_streaks'), null, 2),
          } as TextContent,
        ],
      };

    case 'golong://database/checkins':
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(await getTableInfo('checkins'), null, 2),
          } as TextContent,
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_database':
        return await handleQueryDatabase(args);
      case 'get_table_info':
        return await handleGetTableInfo(args);
      case 'create_streak':
        return await handleCreateStreak(args);
      case 'join_streak':
        return await handleJoinStreak(args);
      case 'add_checkin':
        return await handleAddCheckin(args);
      case 'get_user_streaks':
        return await handleGetUserStreaks(args);
      case 'get_public_streaks':
        return await handleGetPublicStreaks(args);
      case 'get_leaderboard':
        return await handleGetLeaderboard(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        } as TextContent,
      ],
      isError: true,
    };
  }
});

// Helper functions
async function getDatabaseSchema(): Promise<string> {
  // Return the database schema from your schema file
  return `
-- GoLong Database Schema
-- Main tables: profiles, streaks, user_streaks, checkins, reports, comments, likes, notifications, etc.

-- Core Tables:
-- profiles: User profiles extending auth.users
-- streaks: Streak definitions with categories and tags
-- user_streaks: User participation in streaks with streak counts
-- checkins: Daily check-in records
-- reports: Moderation reports
-- comments: Social comments on streaks
-- likes: Social likes on streaks
-- notifications: User notifications
-- achievements: Achievement definitions
-- user_achievements: User earned achievements
-- streak_templates: Predefined streak templates
-- reminders: Streak reminders
-- challenges: Streak challenges
-- groups: Group streaks
-- widgets: Dashboard widgets
-- analytics_data: User analytics
-- export_jobs: Data export jobs

-- All tables have Row Level Security (RLS) enabled
-- UUID primary keys with uuid-ossp extension
-- Automatic timestamps with triggers
-- Performance indexes on key columns
`;
}

async function getTableList(): Promise<string[]> {
  return [
    'profiles',
    'streaks',
    'user_streaks',
    'checkins',
    'reports',
    'comments',
    'likes',
    'notifications',
    'notification_preferences',
    'achievements',
    'user_achievements',
    'streak_templates',
    'reminders',
    'challenges',
    'challenge_participants',
    'groups',
    'group_members',
    'widgets',
    'analytics_data',
    'export_jobs',
  ];
}

async function getTableInfo(tableName: string): Promise<any> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(5);

  if (error) {
    throw new Error(`Failed to get table info: ${error.message}`);
  }

  return {
    table: tableName,
    sample_data: data,
    description: getTableDescription(tableName),
  };
}

function getTableDescription(tableName: string): string {
  const descriptions: Record<string, string> = {
    profiles: 'User profiles extending Supabase auth.users with additional fields like username, display_name, bio, and role',
    streaks: 'Streak definitions with title, description, category, tags, and privacy settings',
    user_streaks: 'User participation in streaks with current and longest streak counts',
    checkins: 'Daily check-in records for user streaks',
    reports: 'Moderation reports for inappropriate content',
    comments: 'Social comments on streaks',
    likes: 'Social likes on streaks',
    notifications: 'User notifications for various events',
    achievements: 'Achievement definitions with criteria',
    user_achievements: 'User earned achievements',
    streak_templates: 'Predefined streak templates for common goals',
    reminders: 'Streak reminders with scheduling',
    challenges: 'Streak challenges with duration and prizes',
    groups: 'Group streaks for team-based goals',
    widgets: 'Dashboard widgets for customizable user interface',
    analytics_data: 'Computed analytics data for users',
    export_jobs: 'Data export job tracking',
  };
  return descriptions[tableName] || 'No description available';
}

// Tool handlers
async function handleQueryDatabase(args: any) {
  const { query, table } = args;
  
  // Basic SQL injection protection
  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
  const upperQuery = query.toUpperCase();
  
  for (const keyword of dangerousKeywords) {
    if (upperQuery.includes(keyword)) {
      throw new Error(`Dangerous SQL keyword detected: ${keyword}. Only SELECT queries are allowed.`);
    }
  }

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
  
  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      } as TextContent,
    ],
  };
}

async function handleGetTableInfo(args: any) {
  const { table_name, include_sample = true, limit = 5 } = args;
  
  const result = await getTableInfo(table_name);
  
  if (!include_sample) {
    delete result.sample_data;
  } else if (result.sample_data) {
    result.sample_data = result.sample_data.slice(0, limit);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      } as TextContent,
    ],
  };
}

async function handleCreateStreak(args: any) {
  const { title, description, category, is_public = true, created_by, tags = [] } = args;
  
  const { data, error } = await supabase
    .from('streaks')
    .insert({
      title,
      description,
      category,
      is_public,
      created_by,
      tags,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create streak: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Streak created successfully: ${JSON.stringify(data, null, 2)}`,
      } as TextContent,
    ],
  };
}

async function handleJoinStreak(args: any) {
  const { user_id, streak_id } = args;
  
  const { data, error } = await supabase
    .from('user_streaks')
    .insert({
      user_id,
      streak_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to join streak: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `User joined streak successfully: ${JSON.stringify(data, null, 2)}`,
      } as TextContent,
    ],
  };
}

async function handleAddCheckin(args: any) {
  const { user_streak_id, checkin_date } = args;
  
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      user_streak_id,
      checkin_date,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add checkin: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Checkin added successfully: ${JSON.stringify(data, null, 2)}`,
      } as TextContent,
    ],
  };
}

async function handleGetUserStreaks(args: any) {
  const { user_id, include_inactive = false } = args;
  
  let query = supabase
    .from('user_streaks')
    .select(`
      *,
      streaks (*),
      profiles!user_streaks_user_id_fkey (*)
    `)
    .eq('user_id', user_id);

  if (!include_inactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user streaks: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      } as TextContent,
    ],
  };
}

async function handleGetPublicStreaks(args: any) {
  const { category, tags, limit = 50, offset = 0 } = args;
  
  let query = supabase
    .from('streaks')
    .select(`
      *,
      profiles!streaks_created_by_fkey (*),
      user_streaks (count)
    `)
    .eq('is_public', true)
    .eq('is_active', true)
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get public streaks: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      } as TextContent,
    ],
  };
}

async function handleGetLeaderboard(args: any) {
  const { streak_id, type = 'current', limit = 10 } = args;
  
  const orderBy = type === 'current' ? 'current_streak_days' : 'longest_streak_days';
  
  const { data, error } = await supabase
    .from('user_streaks')
    .select(`
      *,
      profiles!user_streaks_user_id_fkey (*)
    `)
    .eq('streak_id', streak_id)
    .eq('is_active', true)
    .order(orderBy, { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      } as TextContent,
    ],
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GoLong Supabase MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

