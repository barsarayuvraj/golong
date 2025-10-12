# Streak Deletion and Auto-Cleanup Guide

## Overview
This document explains the new streak deletion and auto-cleanup functionality implemented in GoLong.

## Features

### 1. Private Streak Deletion
- **Who can delete**: Only the creator of a private streak
- **What happens**: Complete hard deletion of the streak and all associated data
- **Data deleted**: Streak, user_streaks, check-ins, and notes
- **UI**: Shows "Delete Streak" option in settings dropdown for private streaks owned by the user

### 2. Public Streak Leaving
- **Who can leave**: All users including the creator
- **What happens**: Soft delete (user_streaks marked as inactive)
- **Data preserved**: Check-ins and comments remain for historical purposes
- **UI**: Shows "Leave Streak" option for all public streaks

### 3. Auto-Cleanup System
- **Trigger**: Public streaks with no active members for 15+ days
- **Schedule**: Runs on 1st and 16th of every month
- **Action**: Hard delete abandoned public streaks and all related data

## Database Changes

### New Field Added
```sql
-- Add to streaks table
ALTER TABLE streaks 
ADD COLUMN last_member_left_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying
CREATE INDEX idx_streaks_last_member_left_at ON streaks(last_member_left_at) 
WHERE last_member_left_at IS NOT NULL;
```

## API Endpoints

### 1. Delete Private Streak
```
DELETE /api/streaks/[id]/delete
```
- **Authentication**: Required
- **Permissions**: Only streak creator for private streaks
- **Action**: Hard delete all related data

### 2. Leave Public Streak
```
POST /api/streaks/[id]/leave
```
- **Authentication**: Required
- **Permissions**: Any participant
- **Action**: Soft delete (mark user_streaks as inactive)
- **Side effect**: Updates `last_member_left_at` if last active member

### 3. Auto-Cleanup
```
POST /api/cleanup/abandoned-streaks
```
- **Authentication**: Optional (can be added for admin access)
- **Action**: Hard delete abandoned public streaks

## Scheduling Auto-Cleanup

### Option 1: Cron Job
```bash
# Add to crontab (runs on 1st and 16th at 2 AM)
0 2 1,16 * * /usr/bin/node /path/to/golong/run-cleanup.js
```

### Option 2: Manual Execution
```bash
# Run manually
node run-cleanup.js
```

### Option 3: API Call
```bash
# Direct API call
curl -X POST https://your-domain.com/api/cleanup/abandoned-streaks
```

## User Experience

### Private Streak Owner
1. Navigate to their private streak
2. Click settings icon (⚙️) in "Your Progress" card
3. Select "Delete Streak"
4. See prominent warning dialog about permanent deletion
5. Confirm deletion
6. Redirected to My Streaks page

### Public Streak Participant
1. Navigate to any public streak they've joined
2. Click settings icon (⚙️) in "Your Progress" card
3. Select "Leave Streak"
4. See confirmation dialog about losing progress
5. Confirm leaving
6. Redirected to My Streaks page

## Error Handling

### Common Errors
- **"You cannot leave your own private streak"**: User must delete instead of leave
- **"Cannot delete public streaks"**: Only private streaks can be deleted
- **"Only the creator can delete their private streak"**: Permission denied
- **"You are not participating in this streak"**: User not found in user_streaks

### Auto-Cleanup Errors
- Logged to console but don't fail the entire cleanup process
- Individual streak deletion failures are tracked and reported
- Partial success is returned with error details

## Testing

### Test Private Streak Deletion
1. Create a private streak
2. Navigate to streak detail page
3. Verify "Delete Streak" option appears in dropdown
4. Test deletion flow
5. Verify streak disappears from My Streaks

### Test Public Streak Leaving
1. Join a public streak
2. Navigate to streak detail page
3. Verify "Leave Streak" option appears in dropdown
4. Test leaving flow
5. Verify streak disappears from My Streaks

### Test Auto-Cleanup
1. Create a public streak with multiple members
2. Have all members leave the streak
3. Wait for 15+ days (or manually update `last_member_left_at`)
4. Run cleanup script
5. Verify streak is deleted from database

## Security Considerations

1. **Authentication**: All endpoints require valid user authentication
2. **Authorization**: Users can only delete their own private streaks
3. **Data Integrity**: Soft delete preserves historical data for public streaks
4. **Audit Trail**: Auto-cleanup logs all operations for monitoring

## Monitoring

### Logs to Monitor
- Auto-cleanup execution logs
- Streak deletion success/failure rates
- Error patterns in deletion operations

### Metrics to Track
- Number of private streaks deleted
- Number of public streaks abandoned
- Auto-cleanup execution frequency and success rate
