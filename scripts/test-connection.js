const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Test basic connection
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log('Connection test error:', error.message);
            if (error.message.includes('schema must be one of the following: api')) {
                console.log('\n❌ Database schema not deployed!');
                console.log('📋 Please deploy the database schema first:');
                console.log('1. Go to your Supabase dashboard');
                console.log('2. Navigate to SQL Editor');
                console.log('3. Copy and paste the content from database.sql');
                console.log('4. Execute the SQL to create tables and functions');
                console.log('5. Then run this script again');
                return false;
            }
            return false;
        }
        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.log('❌ Connection failed:', err.message);
        return false;
    }
}

async function insertSeedData() {
    console.log('\n🌱 Inserting seed data...');
    
    // Insert users
    const users = [
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Emma Rodriguez', email: 'emma.rodriguez@email.com', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Marcus Chen', email: 'marcus.chen@email.com', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Sofia Andersson', email: 'sofia.andersson@email.com', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'David Thompson', email: 'david.thompson@email.com', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Aisha Patel', email: 'aisha.patel@email.com', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' }
    ];

    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert(users);
        
        if (userError) {
            console.log('❌ Error inserting users:', userError.message);
            return false;
        }
        console.log('✅ Users inserted successfully');
    } catch (err) {
        console.log('❌ Error inserting users:', err.message);
        return false;
    }

    // Insert events using RPC function
    const events = [
        {
            p_organizer_id: '550e8400-e29b-41d4-a716-446655440001',
            p_title: 'Central Park Lake Cleanup',
            p_description: 'Join us for a morning cleanup around the beautiful Central Park Lake. We\'ll focus on removing litter from the shoreline and surrounding paths.',
            p_location: { lat: 40.7829, lng: -73.9654, address: 'Central Park Lake, New York, NY' },
            p_map_image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
            p_radius: 1.5,
            p_date: '2024-02-15T09:00:00Z',
            p_equipment_names: ['Trash bags', 'Gloves', 'Litter grabbers', 'First aid kit']
        },
        {
            p_organizer_id: '550e8400-e29b-41d4-a716-446655440002',
            p_title: 'Beach Cleanup at Santa Monica',
            p_description: 'Help us keep Santa Monica Beach pristine! We\'ll be collecting plastic waste, cigarette butts, and other debris along the coastline.',
            p_location: { lat: 34.0195, lng: -118.4912, address: 'Santa Monica Beach, Santa Monica, CA' },
            p_map_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
            p_radius: 2.0,
            p_date: '2024-02-18T08:30:00Z',
            p_equipment_names: ['Beach cleanup bags', 'Reusable gloves', 'Sand sifters', 'Sunscreen']
        }
    ];

    for (const event of events) {
        try {
            const { data: eventData, error: eventError } = await supabase
                .rpc('create_new_event', event);
            
            if (eventError) {
                console.log('❌ Error creating event:', eventError.message);
                return false;
            }
            console.log('✅ Event created:', event.p_title);
        } catch (err) {
            console.log('❌ Error creating event:', err.message);
            return false;
        }
    }

    return true;
}

async function main() {
    const connected = await testConnection();
    if (connected) {
        await insertSeedData();
    }
}

main().catch(console.error);