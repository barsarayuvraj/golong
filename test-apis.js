#!/usr/bin/env node

/**
 * GoLong API Testing Script
 * 
 * This script tests all the API endpoints to ensure they're working correctly.
 * Run with: node test-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// You'll need to replace these with actual values from your database
const TEST_DATA = {
  // Get these from your Supabase dashboard or by creating test data
  userId: 'YOUR_USER_ID',
  streakId: 'YOUR_STREAK_ID',
  userStreakId: 'YOUR_USER_STREAK_ID',
  authToken: 'YOUR_AUTH_TOKEN' // Get this from browser after login
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`\n🔍 ${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { status: 'ERROR', error: error.message };
  }
}

// Test functions for each endpoint
async function testCheckins(token) {
  console.log('\n📊 Testing Checkins API...');
  
  // GET checkins
  await apiRequest('/api/checkins', 'GET', null, token);
  
  // POST checkin (if you have a user_streak_id)
  if (TEST_DATA.userStreakId) {
    await apiRequest('/api/checkins', 'POST', {
      user_streak_id: TEST_DATA.userStreakId,
      checkin_date: new Date().toISOString().split('T')[0]
    }, token);
  }
}

async function testComments(token) {
  console.log('\n💬 Testing Comments API...');
  
  // GET comments
  if (TEST_DATA.streakId) {
    await apiRequest(`/api/comments?streak_id=${TEST_DATA.streakId}`, 'GET', null, token);
    
    // POST comment
    await apiRequest('/api/comments', 'POST', {
      streak_id: TEST_DATA.streakId,
      content: 'Test comment from API testing script! 🚀'
    }, token);
  }
}

async function testLikes(token) {
  console.log('\n❤️ Testing Likes API...');
  
  if (TEST_DATA.streakId) {
    // GET likes
    await apiRequest(`/api/likes?streak_id=${TEST_DATA.streakId}`, 'GET', null, token);
    
    // Check user like status
    await apiRequest(`/api/likes?streak_id=${TEST_DATA.streakId}&check_user_like=true`, 'GET', null, token);
    
    // POST like
    await apiRequest('/api/likes', 'POST', {
      streak_id: TEST_DATA.streakId
    }, token);
  }
}

async function testNotifications(token) {
  console.log('\n🔔 Testing Notifications API...');
  
  // GET notifications
  await apiRequest('/api/notifications', 'GET', null, token);
  
  // GET unread notifications
  await apiRequest('/api/notifications?unread_only=true', 'GET', null, token);
  
  // GET notification preferences
  await apiRequest('/api/notifications/preferences', 'GET', null, token);
  
  // PUT update preferences
  await apiRequest('/api/notifications/preferences', 'PUT', {
    email_notifications: true,
    push_notifications: true,
    streak_reminders: true
  }, token);
}

async function testAchievements(token) {
  console.log('\n🏆 Testing Achievements API...');
  
  // GET all achievements
  await apiRequest('/api/achievements', 'GET', null, token);
  
  // GET user achievements
  await apiRequest('/api/achievements?user_achievements=true', 'GET', null, token);
  
  // POST check achievements
  await apiRequest('/api/achievements/check', 'POST', {}, token);
}

async function testChallenges(token) {
  console.log('\n🎯 Testing Challenges API...');
  
  // GET all challenges
  await apiRequest('/api/challenges', 'GET', null, token);
  
  // GET user challenges
  await apiRequest('/api/challenges?user_challenges=true', 'GET', null, token);
  
  // POST create challenge
  const challengeData = {
    name: 'API Test Challenge',
    description: 'Test challenge created by API testing script',
    category: 'Testing',
    duration_days: 7,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    max_participants: 10,
    prize_description: 'Testing achievement badge'
  };
  
  const challengeResponse = await apiRequest('/api/challenges', 'POST', challengeData, token);
  
  // If challenge was created successfully, try to join it
  if (challengeResponse.status === 201 && challengeResponse.data.challenge) {
    const challengeId = challengeResponse.data.challenge.id;
    await apiRequest('/api/challenges/join', 'POST', {
      challenge_id: challengeId
    }, token);
  }
}

async function testGroups(token) {
  console.log('\n👥 Testing Groups API...');
  
  // GET all groups
  await apiRequest('/api/groups', 'GET', null, token);
  
  // GET user groups
  await apiRequest('/api/groups?user_groups=true', 'GET', null, token);
  
  // POST create group
  const groupData = {
    name: 'API Test Group',
    description: 'Test group created by API testing script',
    category: 'Testing',
    max_members: 20,
    is_private: false
  };
  
  const groupResponse = await apiRequest('/api/groups', 'POST', groupData, token);
  
  // If group was created successfully, try to join it
  if (groupResponse.status === 201 && groupResponse.data.group) {
    const groupId = groupResponse.data.group.id;
    await apiRequest('/api/groups/join', 'POST', {
      group_id: groupId
    }, token);
  }
}

async function testReminders(token) {
  console.log('\n⏰ Testing Reminders API...');
  
  // GET user reminders
  await apiRequest('/api/reminders', 'GET', null, token);
  
  // GET upcoming reminders
  await apiRequest('/api/reminders/upcoming', 'GET', null, token);
  
  // POST create reminder (if you have a streak_id)
  if (TEST_DATA.streakId) {
    const reminderData = {
      streak_id: TEST_DATA.streakId,
      time: '09:00',
      days_of_week: [1, 2, 3, 4, 5],
      message: 'Time for your daily streak!',
      reminder_type: 'push'
    };
    
    await apiRequest('/api/reminders', 'POST', reminderData, token);
  }
}

async function testAnalytics(token) {
  console.log('\n📈 Testing Analytics API...');
  
  // GET analytics overview
  await apiRequest('/api/analytics', 'GET', null, token);
  
  // GET specific metrics
  await apiRequest('/api/analytics?metric=streaks&period=month', 'GET', null, token);
  
  // POST compute analytics
  await apiRequest('/api/analytics/compute', 'POST', {
    date: new Date().toISOString().split('T')[0],
    metrics: ['streaks', 'checkins']
  }, token);
}

async function testExport(token) {
  console.log('\n📤 Testing Export API...');
  
  // GET export jobs
  await apiRequest('/api/export', 'GET', null, token);
  
  // POST create export job
  await apiRequest('/api/export', 'POST', {
    export_type: 'all',
    format: 'json',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  }, token);
}

// Main testing function
async function runTests() {
  console.log('🚀 Starting GoLong API Tests...');
  console.log('=====================================');
  
  // Check if we have the required test data
  if (!TEST_DATA.authToken || TEST_DATA.authToken === 'YOUR_AUTH_TOKEN') {
    console.log('\n❌ Please update TEST_DATA in this script with:');
    console.log('   - Your authentication token');
    console.log('   - Valid user_id, streak_id, user_streak_id');
    console.log('\nTo get your auth token:');
    console.log('1. Login to your app in the browser');
    console.log('2. Open browser dev tools');
    console.log('3. Run: supabase.auth.getSession()');
    console.log('4. Copy the access_token value');
    console.log('\nTo get IDs, check your Supabase dashboard or create test data first.');
    return;
  }
  
  const token = TEST_DATA.authToken;
  
  try {
    // Test all endpoints
    await testCheckins(token);
    await testComments(token);
    await testLikes(token);
    await testNotifications(token);
    await testAchievements(token);
    await testChallenges(token);
    await testGroups(token);
    await testReminders(token);
    await testAnalytics(token);
    await testExport(token);
    
    console.log('\n✅ All API tests completed!');
    console.log('=====================================');
    console.log('Check the output above for any errors or unexpected responses.');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testCheckins,
  testComments,
  testLikes,
  testNotifications,
  testAchievements,
  testChallenges,
  testGroups,
  testReminders,
  testAnalytics,
  testExport
};
