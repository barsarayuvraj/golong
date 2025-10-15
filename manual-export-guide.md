# Manual Data Export Guide

## 🚨 **Current Situation**
Your old Supabase database (project: `gzhccauxdtboxrurwogk`) is experiencing connection timeouts due to email bounce restrictions. All automated export methods have failed.

## 📋 **Manual Export Steps**

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/gzhccauxdtboxrurwogk
2. Try to access the SQL Editor
3. If accessible, run the export queries below

### **Step 2: Export Data Queries**

#### **Export All Profiles:**
```sql
SELECT * FROM public.profiles;
```

#### **Export All Streaks:**
```sql
SELECT * FROM public.streaks;
```

#### **Export All User Streaks:**
```sql
SELECT * FROM public.user_streaks;
```

#### **Export All Checkins:**
```sql
SELECT * FROM public.checkins;
```

#### **Export All Comments:**
```sql
SELECT * FROM public.comments;
```

#### **Export All Likes:**
```sql
SELECT * FROM public.likes;
```

#### **Export RLS Policies:**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

#### **Export Table Schemas:**
```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### **Step 3: Save Results**
1. Copy each query result
2. Save as JSON or CSV files
3. Use the migration script to import to new database

## 🔄 **Alternative: Contact Supabase Support**

If the dashboard is also inaccessible:

1. **Go to**: https://supabase.com/support
2. **Create a ticket** explaining:
   - Project ID: `gzhccauxdtboxrurwogk`
   - Issue: Email bounce restrictions preventing data access
   - Request: Temporary access for data export/migration
   - Urgency: Data recovery needed

## 📊 **Migration Script**
Once you have the exported data, use the `migrate-data.js` script to import it into your new database.

## ⚠️ **Time Sensitivity**
The longer you wait, the higher the chance that:
- Data might be permanently lost
- Support might not be able to help
- The project might be fully restricted

**Recommendation**: Try the dashboard access first, then contact support immediately if that fails.

