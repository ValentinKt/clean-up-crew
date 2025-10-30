# 🚀 Database Schema Deployment Guide

## Current Issue
Your event creation is failing because the database schema hasn't been deployed to Supabase yet. The error `"Could not find the function api.create_new_event"` indicates that the RPC functions are missing from your Supabase database.

## Quick Fix - Manual Deployment (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **bshbpfgjgwqocczlzztb**

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New query"** to create a new SQL query

### Step 3: Deploy Schema
1. Open the file `services/database.sql` in your code editor
2. **Copy the entire content** (all 453 lines)
3. **Paste it into the SQL Editor** in Supabase
4. Click **"Run"** to execute the SQL

### Step 4: Verify Deployment
After successful execution, run this command to verify:
```bash
node scripts/test-connection.js
```

You should see: ✅ **"Database connection successful!"**

## Alternative Method - Supabase CLI

If you prefer using the CLI and have Docker running:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref bshbpfgjgwqocczlzztb

# Deploy schema
supabase db push
```

## What Gets Deployed

The schema includes:

### 📊 Tables
- `users` - User profiles and authentication
- `events` - Cleanup events
- `event_participants` - Event participation tracking
- `event_equipment` - Equipment lists for events
- `event_chat` - Event chat messages
- `event_photos` - Event photo uploads

### 🔧 RPC Functions
- `create_new_event` - Creates new cleanup events (this fixes your error!)
- `get_event_by_id` - Retrieves event details
- `get_all_events` - Lists all events
- `join_event` / `leave_event` - Event participation
- `add_equipment_item` / `toggle_equipment_item` - Equipment management
- `send_chat_message` - Chat functionality
- `update_event_status` - Event status updates

### 🔒 Security
- Row Level Security (RLS) policies
- Proper authentication checks
- Secure function definitions

## After Deployment

Once deployed successfully:

1. ✅ Event creation will work
2. ✅ All RPC functions will be available
3. ✅ The "null is not an object" error will disappear
4. ✅ Your application will be fully functional

## Troubleshooting

### If deployment fails:
- Check that you have admin permissions on the Supabase project
- Ensure you copied the entire schema content
- Look for any error messages in the SQL Editor

### If the test still fails:
- Wait a few seconds for the schema to propagate
- Refresh your browser and try again
- Check the Supabase project logs

## Need Help?

Run the deployment helper script for detailed instructions:
```bash
node scripts/deploy-schema.js
```

---

**🎯 Goal**: Fix the event creation error by deploying the missing database schema to Supabase.