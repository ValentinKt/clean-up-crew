# Database Schema Deployment Guide

## Current Status
❌ **Database schema is NOT deployed** - The `create_new_event` function and other required database functions are missing from your Supabase project.

## Quick Deployment Steps

### Option 1: Manual Deployment (Recommended)
1. **Open Supabase Dashboard**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select Your Project**: Choose project `bshbpfgjgwqocczlzztb`
3. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
4. **Create New Query**: Click "New query" button
5. **Copy Schema**: Copy the entire content from `services/database.sql` (453 lines)
6. **Paste and Execute**: Paste the SQL and click "Run" to execute
7. **Verify Success**: Ensure no errors occurred during execution

### Option 2: Using Supabase CLI (Requires Docker)
```bash
# Install Docker Desktop and start it
# Then run:
supabase login
supabase link --project-ref bshbpfgjgwqocczlzztb
supabase db push
```

## What Gets Deployed
The schema includes:
- **Tables**: `users`, `events`, `event_participants`, `event_equipment`, `event_chat`, `event_photos`
- **RPC Functions**: 
  - `create_new_event` ⭐ (Required for event creation)
  - `get_event_by_id`
  - `get_all_events` 
  - `join_event`
  - `leave_event`
  - `add_checklist_item`
  - `update_checklist_item`
  - `post_message_to_chat`
  - `add_photo_to_event`
  - `update_event_status`
- **Security**: Row Level Security (RLS) policies
- **Performance**: Database indexes

## Verification
After deployment, run this command to verify:
```bash
node scripts/test-connection.js
```

You should see: ✅ **All database functions are available!**

## Current Project Configuration
- **Supabase URL**: `https://bshbpfgjgwqocczlzztb.supabase.co`
- **Project ID**: `bshbpfgjgwqocczlzztb`
- **Environment**: Configured in `.env.local`

## Important Notes
- ⚠️ The app **cannot create events** until this schema is deployed
- ✅ All 32 tests pass locally with mocked functions
- 🔒 Schema includes security policies for data protection
- 📊 Existing data will not be affected (uses `IF NOT EXISTS` clauses)

## Next Steps After Deployment
1. Verify deployment with test script
2. Test event creation in the live app
3. Run integration tests
4. Deploy to production