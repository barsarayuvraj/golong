# Manual User Creation Instructions

## Option 1: Use the API Script (Recommended)

1. Run the generated API script:
   ```bash
   node create-users-api.js
   ```

2. This will create all users with temporary passwords

3. Send password reset emails to users

## Option 2: Manual Creation via Supabase Dashboard

1. Go to your target database: https://pepgldetpvaiwawmmxox.supabase.co
2. Navigate to Authentication > Users
3. Click "Add User" for each user
4. Use the email addresses from user-creation-data.json
5. Set temporary passwords (users will reset them)
6. IMPORTANT: The user IDs must match the profile IDs for data consistency

## Option 3: Bulk Import via CSV

1. Create a CSV file with columns: email, password, email_confirm
2. Use Supabase's bulk user import feature
3. Ensure user IDs match profile IDs

## Important Notes:

- User IDs must match the profile IDs in your migrated data
- Users will need to reset their passwords after creation
- All user relationships (streaks, checkins, etc.) are already migrated
- The profiles table contains all user data except authentication

## Files Generated:

- user-creation-data.json: Complete user data with emails
- create-users-api.js: Automated user creation script
- user-export.json: Original profile data export
