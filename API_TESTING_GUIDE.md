# 🧪 GoLong API Testing Guide

## 📋 **Testing Setup**

### **Prerequisites:**
1. ✅ Database migration completed successfully
2. ✅ Supabase project configured
3. ✅ Environment variables set up
4. ✅ Development server running (`npm run dev`)

### **Testing Methods:**
- **Browser Testing** - Using browser dev tools
- **Postman/Insomnia** - API testing tools
- **curl Commands** - Terminal testing
- **Frontend Integration** - Real component testing

---

## 🔐 **Authentication Setup**

First, you'll need to authenticate to get a valid session. Here are the steps:

### **1. Create a Test User**
```bash
# Register a new user via your auth form
# Or use Supabase Auth directly
```

### **2. Get Session Token**
```javascript
// In browser console after login:
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session.access_token)
```

---

## 📊 **API Endpoint Testing**

### **1. `/api/checkins` - Daily Check-ins**

#### **GET - Retrieve Checkins**
```bash
curl -X GET "http://localhost:3000/api/checkins" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

```bash
# With filters
curl -X GET "http://localhost:3000/api/checkins?user_streak_id=USER_STREAK_ID&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Checkin**
```bash
curl -X POST "http://localhost:3000/api/checkins" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_streak_id": "USER_STREAK_ID",
    "checkin_date": "2024-12-19"
  }'
```

#### **PUT - Update Checkin**
```bash
curl -X PUT "http://localhost:3000/api/checkins?id=CHECKIN_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin_date": "2024-12-20"
  }'
```

#### **DELETE - Remove Checkin**
```bash
curl -X DELETE "http://localhost:3000/api/checkins?id=CHECKIN_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. `/api/comments` - Social Comments**

#### **GET - Get Comments**
```bash
curl -X GET "http://localhost:3000/api/comments?streak_id=STREAK_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Comment**
```bash
curl -X POST "http://localhost:3000/api/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streak_id": "STREAK_ID",
    "content": "Great streak! Keep it up! 🔥"
  }'
```

#### **PUT - Update Comment**
```bash
curl -X PUT "http://localhost:3000/api/comments?id=COMMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment content"
  }'
```

#### **DELETE - Delete Comment**
```bash
curl -X DELETE "http://localhost:3000/api/comments?id=COMMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **3. `/api/likes` - Like/Unlike Streaks**

#### **GET - Check Like Status**
```bash
curl -X GET "http://localhost:3000/api/likes?streak_id=STREAK_ID&check_user_like=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get All Likes**
```bash
curl -X GET "http://localhost:3000/api/likes?streak_id=STREAK_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Like Streak**
```bash
curl -X POST "http://localhost:3000/api/likes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streak_id": "STREAK_ID"
  }'
```

#### **DELETE - Unlike Streak**
```bash
curl -X DELETE "http://localhost:3000/api/likes?streak_id=STREAK_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **4. `/api/notifications` - Notification Management**

#### **GET - Get Notifications**
```bash
curl -X GET "http://localhost:3000/api/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get Unread Only**
```bash
curl -X GET "http://localhost:3000/api/notifications?unread_only=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **PUT - Mark as Read**
```bash
curl -X PUT "http://localhost:3000/api/notifications?id=NOTIFICATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **PUT - Mark All as Read**
```bash
curl -X PUT "http://localhost:3000/api/notifications?mark_all_read=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **DELETE - Delete Notification**
```bash
curl -X DELETE "http://localhost:3000/api/notifications?id=NOTIFICATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get Notification Preferences**
```bash
curl -X GET "http://localhost:3000/api/notifications/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **PUT - Update Preferences**
```bash
curl -X PUT "http://localhost:3000/api/notifications/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_notifications": true,
    "push_notifications": false,
    "streak_reminders": true
  }'
```

---

### **5. `/api/achievements` - Achievement System**

#### **GET - Get All Achievements**
```bash
curl -X GET "http://localhost:3000/api/achievements" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get User Achievements**
```bash
curl -X GET "http://localhost:3000/api/achievements?user_achievements=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Check and Award Achievements**
```bash
curl -X POST "http://localhost:3000/api/achievements/check" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### **6. `/api/challenges` - Challenge Management**

#### **GET - Get All Challenges**
```bash
curl -X GET "http://localhost:3000/api/challenges" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get User Challenges**
```bash
curl -X GET "http://localhost:3000/api/challenges?user_challenges=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Challenge**
```bash
curl -X POST "http://localhost:3000/api/challenges" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "30-Day Fitness Challenge",
    "description": "Complete 30 days of daily exercise",
    "category": "Health",
    "duration_days": 30,
    "start_date": "2024-12-20",
    "end_date": "2025-01-19",
    "max_participants": 100,
    "prize_description": "Fitness achievement badge"
  }'
```

#### **POST - Join Challenge**
```bash
curl -X POST "http://localhost:3000/api/challenges/join" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "CHALLENGE_ID"
  }'
```

#### **DELETE - Leave Challenge**
```bash
curl -X DELETE "http://localhost:3000/api/challenges/leave?challenge_id=CHALLENGE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **7. `/api/groups` - Group Management**

#### **GET - Get All Groups**
```bash
curl -X GET "http://localhost:3000/api/groups" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get User Groups**
```bash
curl -X GET "http://localhost:3000/api/groups?user_groups=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Group**
```bash
curl -X POST "http://localhost:3000/api/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Runners",
    "description": "Group for early morning runners",
    "category": "Health",
    "max_members": 50,
    "is_private": false
  }'
```

#### **POST - Join Group**
```bash
curl -X POST "http://localhost:3000/api/groups/join" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "GROUP_ID"
  }'
```

#### **POST - Invite Member**
```bash
curl -X POST "http://localhost:3000/api/groups/invite" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "GROUP_ID",
    "user_id": "USER_ID",
    "role": "member"
  }'
```

---

### **8. `/api/reminders` - Reminder System**

#### **GET - Get User Reminders**
```bash
curl -X GET "http://localhost:3000/api/reminders" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Reminder**
```bash
curl -X POST "http://localhost:3000/api/reminders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streak_id": "STREAK_ID",
    "time": "09:00",
    "days_of_week": [1, 2, 3, 4, 5],
    "message": "Time for your daily streak!",
    "reminder_type": "push"
  }'
```

#### **GET - Get Upcoming Reminders**
```bash
curl -X GET "http://localhost:3000/api/reminders/upcoming" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Toggle Reminder**
```bash
curl -X POST "http://localhost:3000/api/reminders/toggle" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reminder_id": "REMINDER_ID",
    "is_active": false
  }'
```

---

### **9. `/api/analytics` - Analytics Dashboard**

#### **GET - Get Analytics Overview**
```bash
curl -X GET "http://localhost:3000/api/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **GET - Get Specific Metrics**
```bash
curl -X GET "http://localhost:3000/api/analytics?metric=streaks&period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Compute Analytics**
```bash
curl -X POST "http://localhost:3000/api/analytics/compute" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-19",
    "metrics": ["streaks", "checkins"]
  }'
```

---

### **10. `/api/export` - Data Export**

#### **GET - Get Export Jobs**
```bash
curl -X GET "http://localhost:3000/api/export" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST - Create Export Job**
```bash
curl -X POST "http://localhost:3000/api/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "export_type": "all",
    "format": "json",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

#### **GET - Download Export**
```bash
curl -X GET "http://localhost:3000/api/export/download?job_id=JOB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 **Testing Checklist**

### **Basic Functionality:**
- [ ] Authentication works
- [ ] GET requests return data
- [ ] POST requests create records
- [ ] PUT requests update records
- [ ] DELETE requests remove records

### **Error Handling:**
- [ ] Invalid authentication returns 401
- [ ] Missing required fields return 400
- [ ] Non-existent records return 404
- [ ] Unauthorized access returns 403

### **Data Validation:**
- [ ] Required fields are validated
- [ ] Data types are enforced
- [ ] Foreign key constraints work
- [ ] Unique constraints prevent duplicates

### **Security:**
- [ ] Users can only access their own data
- [ ] RLS policies are enforced
- [ ] Input sanitization works
- [ ] SQL injection prevention

---

## 🛠️ **Testing Tools**

### **Browser Dev Tools:**
```javascript
// Test in browser console
fetch('/api/checkins', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + session.access_token,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### **Postman Collection:**
Create a Postman collection with all endpoints for easy testing.

### **Automated Testing:**
Consider creating Jest tests for comprehensive API testing.

---

## 🚨 **Common Issues & Solutions**

### **401 Unauthorized:**
- Check if user is logged in
- Verify token is valid
- Ensure Authorization header is correct

### **400 Bad Request:**
- Check request body format
- Verify required fields are present
- Validate data types

### **404 Not Found:**
- Verify endpoint URL is correct
- Check if record exists
- Ensure proper ID format

### **500 Internal Server Error:**
- Check server logs
- Verify database connection
- Check for missing environment variables

---

**Happy Testing!** 🎉
