const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMoreEvents() {
    console.log('🌱 Adding 3 more events...');
    
    const events = [
        {
            p_organizer_id: '550e8400-e29b-41d4-a716-446655440003',
            p_title: 'Golden Gate Park Forest Restoration',
            p_description: 'Help restore native plant species in Golden Gate Park. We\'ll be removing invasive plants and planting native California flora.',
            p_location: { lat: 37.7694, lng: -122.4862, address: 'Golden Gate Park, San Francisco, CA' },
            p_map_image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
            p_radius: 1.0,
            p_date: '2024-02-20T10:00:00Z',
            p_equipment_names: ['Gardening gloves', 'Hand tools', 'Native plant seedlings', 'Watering cans']
        },
        {
            p_organizer_id: '550e8400-e29b-41d4-a716-446655440004',
            p_title: 'River Thames Cleanup Walk',
            p_description: 'Join our riverside cleanup along the Thames. We\'ll walk the embankment collecting litter and raising awareness about river pollution.',
            p_location: { lat: 51.5074, lng: -0.1278, address: 'Thames Embankment, London, UK' },
            p_map_image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
            p_radius: 3.0,
            p_date: '2024-02-22T14:00:00Z',
            p_equipment_names: ['Litter pickers', 'Biodegradable bags', 'High-vis vests', 'Hand sanitizer']
        },
        {
            p_organizer_id: '550e8400-e29b-41d4-a716-446655440005',
            p_title: 'Community Garden Composting Workshop',
            p_description: 'Learn about sustainable composting while helping maintain our community garden. Perfect for families and eco-enthusiasts!',
            p_location: { lat: 43.6532, lng: -79.3832, address: 'Community Garden, Toronto, ON' },
            p_map_image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
            p_radius: 0.5,
            p_date: '2024-02-25T11:00:00Z',
            p_equipment_names: ['Compost bins', 'Garden forks', 'Organic waste', 'Educational materials']
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

    console.log('🎉 All 3 additional events created successfully!');
    return true;
}

addMoreEvents().catch(console.error);