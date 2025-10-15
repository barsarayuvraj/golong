# GoLong API Reference

## Base URL
```
https://your-domain.com/api
```

## Authentication
All API endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "data": {}, // Response data (varies by endpoint)
  "error": null, // Error message if any
  "message": "Success message" // Optional success message
}
```

## Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Core Streak Endpoints

### GET /api/streaks
Get list of streaks with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Number of streaks to return |
| `offset` | number | 0 | Pagination offset |
| `category` | string | - | Filter by category |
| `is_public` | boolean | - | Filter by public/private status |
| `search` | string | - | Search in title and description |
| `sort_by` | string | created_at | Sort field (created_at, popularity, title) |
| `sort_order` | string | desc | Sort order (asc, desc) |

**Response:**
```json
{
  "streaks": [
    {
      "streak": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true,
        "profiles": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "user123",
          "display_name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      },
      "user_streak": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "current_streak_days": 15,
        "longest_streak_days": 30,
        "last_checkin_date": "2024-01-15",
        "joined_at": "2024-01-01T00:00:00Z",
        "is_active": true
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/streaks
Create a new streak.

**Request Body:**
```json
{
  "title": "Daily Exercise",
  "description": "Exercise for 30 minutes daily",
  "category": "Health",
  "is_public": true,
  "tags": ["fitness", "health"]
}
```

**Validation Rules:**
- `title`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `category`: Optional, max 50 characters
- `is_public`: Boolean, defaults to true
- `tags`: Array of strings, max 10 tags

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
  "message": "Streak created successfully"
}
```

### GET /api/streaks/[id]
Get specific streak details.

**Path Parameters:**
- `id` (uuid): Streak ID

**Response:**
```json
{
  "streak": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Daily Exercise",
    "description": "Exercise for 30 minutes daily",
    "category": "Health",
    "is_public": true,
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "tags": ["fitness", "health"],
    "is_active": true,
    "profiles": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "user123",
      "display_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "user_streaks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "current_streak_days": 15,
        "longest_streak_days": 30,
        "last_checkin_date": "2024-01-15",
        "joined_at": "2024-01-01T00:00:00Z",
        "is_active": true,
        "profiles": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "user123",
          "display_name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      }
    ],
    "_count": {
      "user_streaks": 1
    }
  }
}
```

### PUT /api/streaks/[id]
Update streak (only by creator).

**Path Parameters:**
- `id` (uuid): Streak ID

**Request Body:**
```json
{
  "title": "Updated Daily Exercise",
  "description": "Updated description",
  "category": "Fitness",
  "is_public": false,
  "tags": ["fitness", "health", "wellness"]
}
```

**Response:**
```json
{
  "streak": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Daily Exercise",
    "description": "Updated description",
    "category": "Fitness",
    "is_public": false,
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "tags": ["fitness", "health", "wellness"],
    "is_active": true
  },
  "message": "Streak updated successfully"
}
```

### DELETE /api/streaks/[id]
Delete streak (only by creator).

**Path Parameters:**
- `id` (uuid): Streak ID

**Response:**
```json
{
  "message": "Streak deleted successfully"
}
```

### POST /api/streaks/join
Join an existing streak.

**Request Body:**
```json
{
  "streak_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
  "message": "Successfully joined streak"
}
```

### GET /api/streaks/popular
Get popular streaks.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of streaks to return |
| `period` | string | week | Time period (day, week, month) |

**Response:**
```json
{
  "streaks": [
    {
      "streak": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true,
        "profiles": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "user123",
          "display_name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      },
      "user_streak": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "current_streak_days": 15,
        "longest_streak_days": 30,
        "last_checkin_date": "2024-01-15",
        "joined_at": "2024-01-01T00:00:00Z",
        "is_active": true
      },
      "popularity_score": 95
    }
  ]
}
```

---

## Check-in Endpoints

### GET /api/checkins
Get check-ins with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `user_streak_id` | uuid | Filter by user streak |
| `streak_id` | uuid | Filter by streak |
| `user_id` | uuid | Filter by user |
| `limit` | number | Number of check-ins to return |
| `offset` | number | Pagination offset |
| `start_date` | date | Start date filter (YYYY-MM-DD) |
| `end_date` | date | End date filter (YYYY-MM-DD) |

**Response:**
```json
{
  "checkins": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
      "checkin_date": "2024-01-15",
      "created_at": "2024-01-15T08:00:00Z",
      "user_streaks": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "streak_id": "550e8400-e29b-41d4-a716-446655440000",
        "current_streak_days": 15,
        "longest_streak_days": 30,
        "last_checkin_date": "2024-01-15",
        "joined_at": "2024-01-01T00:00:00Z",
        "is_active": true,
        "streaks": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "title": "Daily Exercise",
          "description": "Exercise for 30 minutes daily",
          "category": "Health",
          "is_public": true,
          "created_by": "550e8400-e29b-41d4-a716-446655440001",
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z",
          "tags": ["fitness", "health"],
          "is_active": true
        },
        "profiles": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "user123",
          "display_name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/checkins
Create a new check-in.

**Request Body:**
```json
{
  "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
  "checkin_date": "2024-01-15"
}
```

**Validation Rules:**
- `user_streak_id`: Required, valid UUID
- `checkin_date`: Required, YYYY-MM-DD format

**Response:**
```json
{
  "checkin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
    "checkin_date": "2024-01-15",
    "created_at": "2024-01-15T08:00:00Z",
    "user_streaks": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "streak_id": "550e8400-e29b-41d4-a716-446655440000",
      "current_streak_days": 16,
      "longest_streak_days": 30,
      "last_checkin_date": "2024-01-15",
      "joined_at": "2024-01-01T00:00:00Z",
      "is_active": true,
      "streaks": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true
      },
      "profiles": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "user123",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

### PUT /api/checkins?id=[checkin_id]
Update a check-in.

**Query Parameters:**
- `id` (uuid): Check-in ID

**Request Body:**
```json
{
  "checkin_date": "2024-01-16"
}
```

**Response:**
```json
{
  "checkin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
    "checkin_date": "2024-01-16",
    "created_at": "2024-01-15T08:00:00Z",
    "user_streaks": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "streak_id": "550e8400-e29b-41d4-a716-446655440000",
      "current_streak_days": 16,
      "longest_streak_days": 30,
      "last_checkin_date": "2024-01-16",
      "joined_at": "2024-01-01T00:00:00Z",
      "is_active": true,
      "streaks": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true
      },
      "profiles": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "user123",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    }
  },
  "message": "Check-in updated successfully"
}
```

### DELETE /api/checkins?id=[checkin_id]
Delete a check-in.

**Query Parameters:**
- `id` (uuid): Check-in ID

**Response:**
```json
{
  "message": "Check-in deleted successfully"
}
```

---

## Social Features Endpoints

### GET /api/comments
Get comments for a streak.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `streak_id` | uuid | Required - streak to get comments for |
| `limit` | number | Number of comments to return |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "comments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "streak_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440002",
      "content": "Great job on your streak!",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "commenter123",
        "display_name": "Jane Doe",
        "avatar_url": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/comments
Create a new comment.

**Request Body:**
```json
{
  "streak_id": "550e8400-e29b-41d4-a716-446655440001",
  "content": "Great job on your streak!"
}
```

**Validation Rules:**
- `streak_id`: Required, valid UUID
- `content`: Required, 1-500 characters

**Response:**
```json
{
  "comment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "streak_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Great job on your streak!",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "commenter123",
      "display_name": "Jane Doe",
      "avatar_url": "https://example.com/avatar2.jpg"
    }
  }
}
```

### PUT /api/comments/[id]
Update a comment (only by author).

**Path Parameters:**
- `id` (uuid): Comment ID

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:**
```json
{
  "comment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "streak_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Updated comment content",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "commenter123",
      "display_name": "Jane Doe",
      "avatar_url": "https://example.com/avatar2.jpg"
    }
  },
  "message": "Comment updated successfully"
}
```

### DELETE /api/comments/[id]
Delete a comment (only by author).

**Path Parameters:**
- `id` (uuid): Comment ID

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

### GET /api/likes
Get likes for a streak.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `streak_id` | uuid | Required - streak to get likes for |
| `limit` | number | Number of likes to return |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "likes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "streak_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2024-01-15T10:00:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "liker123",
        "display_name": "Jane Doe",
        "avatar_url": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/likes
Like/unlike a streak.

**Request Body:**
```json
{
  "streak_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "liked": true,
  "message": "Streak liked successfully"
}
```

---

## User Management Endpoints

### GET /api/users/search
Search for users by username or display name.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (minimum 2 characters) |
| `limit` | number | Number of results to return |

**Response:**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "user123",
      "display_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

### GET /api/users/[username]
Get user profile by username.

**Path Parameters:**
- `username` (string): Username

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "user123",
    "display_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Fitness enthusiast and streak tracker",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "stats": {
      "total_streaks": 5,
      "active_streaks": 3,
      "total_checkins": 150,
      "longest_streak": 30,
      "achievements_earned": 8
    }
  }
}
```

---

## Advanced Features Endpoints

### GET /api/analytics
Get user analytics data.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | date | 30 days ago | Start date for analytics |
| `end_date` | date | today | End date for analytics |
| `period` | string | month | Period grouping (day, week, month, year) |
| `metric` | string | overview | Metric type (streaks, checkins, achievements, social, overview) |

**Response:**
```json
{
  "analytics": {
    "overview": {
      "total_streaks": 5,
      "active_streaks": 3,
      "total_checkins": 150,
      "longest_streak": 30,
      "achievements_earned": 8,
      "total_likes_received": 25,
      "total_comments_received": 12
    },
    "streak_breakdown": [
      {
        "streak_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Daily Exercise",
        "current_days": 15,
        "longest_days": 30,
        "checkins_this_period": 15,
        "consistency_rate": 100
      }
    ],
    "checkin_trends": [
      {
        "date": "2024-01-01",
        "checkins": 3
      },
      {
        "date": "2024-01-02",
        "checkins": 3
      }
    ],
    "achievements": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "First Streak",
        "description": "Complete your first streak",
        "icon": "🔥",
        "earned_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /api/achievements
Get available achievements and user's earned achievements.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `user_achievements` | boolean | Include user's earned achievements |
| `category` | string | Filter by achievement category |

**Response:**
```json
{
  "achievements": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "First Streak",
      "description": "Complete your first streak",
      "icon": "🔥",
      "criteria": {
        "min_days": 1
      },
      "created_at": "2024-01-01T00:00:00Z",
      "user_achievement": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440002",
        "achievement_id": "550e8400-e29b-41d4-a716-446655440000",
        "earned_at": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### GET /api/groups
Get groups with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Get specific group |
| `user_groups` | boolean | Get user's groups |
| `public_only` | boolean | Get only public groups |
| `category` | string | Filter by category |
| `limit` | number | Number of groups to return |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "groups": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Fitness Enthusiasts",
      "description": "A group for fitness lovers",
      "category": "Health",
      "max_members": 50,
      "is_private": false,
      "created_by": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "profiles": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "group_creator",
        "display_name": "Group Creator",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "group_members": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "group_id": "550e8400-e29b-41d4-a716-446655440000",
          "user_id": "550e8400-e29b-41d4-a716-446655440003",
          "role": "member",
          "joined_at": "2024-01-01T00:00:00Z",
          "profiles": {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "username": "member123",
            "display_name": "Member Name",
            "avatar_url": "https://example.com/avatar2.jpg"
          }
        }
      ],
      "_count": {
        "group_members": 1
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/groups
Create a new group.

**Request Body:**
```json
{
  "name": "Fitness Enthusiasts",
  "description": "A group for fitness lovers",
  "category": "Health",
  "max_members": 50,
  "is_private": false
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `category`: Optional, max 50 characters
- `max_members`: Number, 2-1000, defaults to 50
- `is_private`: Boolean, defaults to false

**Response:**
```json
{
  "group": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fitness Enthusiasts",
    "description": "A group for fitness lovers",
    "category": "Health",
    "max_members": 50,
    "is_private": false,
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Group created successfully"
}
```

### GET /api/challenges
Get challenges with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Get specific challenge |
| `user_challenges` | boolean | Get user's challenges |
| `active_only` | boolean | Get only active challenges |
| `category` | string | Filter by category |
| `limit` | number | Number of challenges to return |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "challenges": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "30-Day Fitness Challenge",
      "description": "Complete 30 days of fitness activities",
      "category": "Health",
      "duration_days": 30,
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "max_participants": 100,
      "prize_description": "Fitness gear package",
      "rules": "Complete daily fitness activities",
      "created_by": "550e8400-e29b-41d4-a716-446655440001",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "profiles": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "challenge_creator",
        "display_name": "Challenge Creator",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "challenge_participants": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
          "user_id": "550e8400-e29b-41d4-a716-446655440003",
          "joined_at": "2024-01-01T00:00:00Z",
          "completed": false,
          "completed_at": null,
          "profiles": {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "username": "participant123",
            "display_name": "Participant Name",
            "avatar_url": "https://example.com/avatar2.jpg"
          }
        }
      ],
      "_count": {
        "challenge_participants": 1
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/challenges
Create a new challenge.

**Request Body:**
```json
{
  "name": "30-Day Fitness Challenge",
  "description": "Complete 30 days of fitness activities",
  "category": "Health",
  "duration_days": 30,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "max_participants": 100,
  "prize_description": "Fitness gear package",
  "rules": "Complete daily fitness activities"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Required, 1-1000 characters
- `category`: Required, 1-50 characters
- `duration_days`: Number, 1-365
- `start_date`: Required, YYYY-MM-DD format
- `end_date`: Required, YYYY-MM-DD format
- `max_participants`: Number, 2-1000, optional
- `prize_description`: Optional, max 500 characters
- `rules`: Optional, max 1000 characters

**Response:**
```json
{
  "challenge": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "30-Day Fitness Challenge",
    "description": "Complete 30 days of fitness activities",
    "category": "Health",
    "duration_days": 30,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "max_participants": 100,
    "prize_description": "Fitness gear package",
    "rules": "Complete daily fitness activities",
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Challenge created successfully"
}
```

### GET /api/reminders
Get user's reminders.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Get specific reminder |
| `streak_id` | uuid | Filter by streak |
| `active_only` | boolean | Get only active reminders |

**Response:**
```json
{
  "reminders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "streak_id": "550e8400-e29b-41d4-a716-446655440002",
      "time": "08:00",
      "days_of_week": [1, 2, 3, 4, 5],
      "message": "Time for your daily exercise!",
      "reminder_type": "push",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "streaks": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true
      }
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/reminders
Create a new reminder.

**Request Body:**
```json
{
  "streak_id": "550e8400-e29b-41d4-a716-446655440002",
  "time": "08:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "message": "Time for your daily exercise!",
  "reminder_type": "push"
}
```

**Validation Rules:**
- `streak_id`: Required, valid UUID
- `time`: Required, HH:MM format
- `days_of_week`: Required, array of numbers 1-7 (1=Monday, 7=Sunday)
- `message`: Optional, max 200 characters
- `reminder_type`: Enum (push, email, both), defaults to push

**Response:**
```json
{
  "reminder": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "streak_id": "550e8400-e29b-41d4-a716-446655440002",
    "time": "08:00",
    "days_of_week": [1, 2, 3, 4, 5],
    "message": "Time for your daily exercise!",
    "reminder_type": "push",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "streaks": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "title": "Daily Exercise",
      "description": "Exercise for 30 minutes daily",
      "category": "Health",
      "is_public": true,
      "created_by": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "tags": ["fitness", "health"],
      "is_active": true
    }
  }
}
```

### GET /api/notifications
Get user's notifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of notifications to return |
| `offset` | number | Pagination offset |
| `unread_only` | boolean | Get only unread notifications |

**Response:**
```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "like",
      "title": "Someone liked your streak!",
      "message": "Your streak received a new like.",
      "data": {
        "streak_id": "550e8400-e29b-41d4-a716-446655440002",
        "liker_id": "550e8400-e29b-41d4-a716-446655440003"
      },
      "read": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false,
  "unread_count": 1
}
```

### PUT /api/notifications/[id]/read
Mark notification as read.

**Path Parameters:**
- `id` (uuid): Notification ID

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

---

## Export Endpoints

### GET /api/export
Get export jobs status.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | uuid | Get specific export job |

**Response:**
```json
{
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "export_type": "streaks",
      "format": "json",
      "status": "completed",
      "file_url": "https://example.com/exports/streaks_2024-01-15.json",
      "error_message": null,
      "created_at": "2024-01-15T10:00:00Z",
      "completed_at": "2024-01-15T10:05:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

### POST /api/export
Create a new export job.

**Request Body:**
```json
{
  "export_type": "streaks",
  "format": "json",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**Validation Rules:**
- `export_type`: Required, enum (streaks, checkins, analytics, all)
- `format`: Required, enum (csv, json, pdf), defaults to json
- `start_date`: Optional, YYYY-MM-DD format
- `end_date`: Optional, YYYY-MM-DD format

**Response:**
```json
{
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "export_type": "streaks",
    "format": "json",
    "status": "pending",
    "file_url": null,
    "error_message": null,
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": null
  },
  "message": "Export job created successfully"
}
```

---

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "Invalid data",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

#### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### Forbidden (403)
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

#### Not Found (404)
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found"
}
```

#### Conflict (409)
```json
{
  "error": "Conflict",
  "message": "Checkin already exists for this date"
}
```

#### Internal Server Error (500)
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP
- **Export endpoints**: 5 requests per hour per user
- **Search endpoints**: 50 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## WebSocket Events

Real-time updates are available via WebSocket connections:

### Connection
```javascript
const socket = io('wss://your-api-domain.com', {
  auth: { token: 'your-jwt-token' }
});
```

### Events

#### streak_updated
Triggered when a streak is updated.
```json
{
  "streak_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "action": "checkin",
  "data": {
    "current_streak_days": 16,
    "last_checkin_date": "2024-01-16"
  }
}
```

#### new_notification
Triggered when a new notification is created.
```json
{
  "notification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "like",
    "title": "Someone liked your streak!",
    "message": "Your streak received a new like.",
    "data": {
      "streak_id": "550e8400-e29b-41d4-a716-446655440002",
      "liker_id": "550e8400-e29b-41d4-a716-446655440003"
    }
  }
}
```

#### new_comment
Triggered when a new comment is added.
```json
{
  "comment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "streak_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Great job on your streak!",
    "created_at": "2024-01-15T10:00:00Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "username": "commenter123",
      "display_name": "Jane Doe",
      "avatar_url": "https://example.com/avatar2.jpg"
    }
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
class GoLongAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getStreaks(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/streaks?${queryString}`);
  }

  async createStreak(data: any) {
    return this.request('/api/streaks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCheckin(data: any) {
    return this.request('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Usage
const api = new GoLongAPI('https://your-api-domain.com', 'your-jwt-token');
const streaks = await api.getStreaks({ limit: 10 });
```

### Python
```python
import requests
from typing import Dict, Any

class GoLongAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def request(self, endpoint: str, method: str = 'GET', data: Dict[str, Any] = None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def get_streaks(self, params: Dict[str, Any] = None):
        query_string = '&'.join([f"{k}={v}" for k, v in (params or {}).items()])
        endpoint = f"/api/streaks?{query_string}"
        return self.request(endpoint)

    def create_streak(self, data: Dict[str, Any]):
        return self.request('/api/streaks', 'POST', data)

    def create_checkin(self, data: Dict[str, Any]):
        return self.request('/api/checkins', 'POST', data)

# Usage
api = GoLongAPI('https://your-api-domain.com', 'your-jwt-token')
streaks = api.get_streaks({'limit': 10})
```

---

## Testing

### API Testing with curl

#### Get Streaks
```bash
curl -X GET "https://your-api-domain.com/api/streaks?limit=10" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

#### Create Streak
```bash
curl -X POST "https://your-api-domain.com/api/streaks" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Exercise",
    "description": "Exercise for 30 minutes daily",
    "category": "Health",
    "is_public": true,
    "tags": ["fitness", "health"]
  }'
```

#### Create Check-in
```bash
curl -X POST "https://your-api-domain.com/api/checkins" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_streak_id": "550e8400-e29b-41d4-a716-446655440002",
    "checkin_date": "2024-01-15"
  }'
```

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Core streak management endpoints
- Check-in system
- Social features (comments, likes)
- User management
- Analytics endpoints
- Export functionality
- Real-time WebSocket support

---

## Support

For API support and questions:
- **Documentation**: [Link to full documentation]
- **Issues**: [GitHub Issues](https://github.com/your-username/golong/issues)
- **Email**: api-support@your-domain.com
- **Discord**: [Community Discord](https://discord.gg/your-discord)
