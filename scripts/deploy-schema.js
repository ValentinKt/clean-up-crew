#!/usr/bin/env node

/**
 * Deploy Database Schema to Supabase
 * 
 * This script helps deploy the database.sql schema to your Supabase project.
 * It provides instructions and can optionally attempt to deploy via API.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Supabase Schema Deployment Helper');
console.log('=====================================');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Supabase Key: ${supabaseKey ? 'Present' : 'Missing'}`);

// Read the database schema
const schemaPath = path.join(__dirname, '..', 'services', 'database.sql');
let schemaContent;

try {
  schemaContent = fs.readFileSync(schemaPath, 'utf8');
  console.log(`📄 Schema file loaded: ${schemaContent.length} characters`);
} catch (error) {
  console.error('❌ Failed to read database.sql:', error.message);
  process.exit(1);
}

console.log('\n📋 Manual Deployment Instructions:');
console.log('==================================');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project (bshbpfgjgwqocczlzztb)');
console.log('3. Navigate to "SQL Editor" in the left sidebar');
console.log('4. Create a new query');
console.log('5. Copy and paste the entire content from services/database.sql');
console.log('6. Click "Run" to execute the SQL');
console.log('7. Verify no errors occurred');
console.log('8. Run "node scripts/test-connection.js" to verify deployment');

console.log('\n🔧 Alternative: Use Supabase CLI');
console.log('===============================');
console.log('If you have Docker running, you can use:');
console.log('1. supabase login');
console.log('2. supabase link --project-ref bshbpfgjgwqocczlzztb');
console.log('3. supabase db push');

console.log('\n📊 Schema Summary:');
console.log('==================');
console.log('The schema includes:');
console.log('• Tables: users, events, event_participants, event_equipment, event_chat, event_photos');
console.log('• RPC Functions: create_new_event, get_event_by_id, get_all_events, join_event, etc.');
console.log('• Row Level Security (RLS) policies');
console.log('• Performance indexes');

console.log('\n⚠️  Important Notes:');
console.log('===================');
console.log('• Make sure you have the necessary permissions on your Supabase project');
console.log('• The schema includes RLS policies for security');
console.log('• All functions are created with SECURITY DEFINER');
console.log('• Existing data will not be affected (IF NOT EXISTS clauses)');

console.log('\n✅ After successful deployment, your event creation will work!');