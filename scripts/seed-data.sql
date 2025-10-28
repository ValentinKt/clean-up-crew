-- Seed data for Eco Cleanup Crew application
-- This script adds 5 users and 5 events with realistic data

-- Insert 5 users
INSERT INTO users (id, name, email, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Emma Rodriguez', 'emma.rodriguez@email.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Marcus Chen', 'marcus.chen@email.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Sofia Andersson', 'sofia.andersson@email.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440004', 'David Thompson', 'david.thompson@email.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Aisha Patel', 'aisha.patel@email.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face');

-- Insert 5 events with realistic data
INSERT INTO events (id, title, description, location, map_image_url, radius, date, organizer_id) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        'Central Park Lake Cleanup',
        'Join us for a morning cleanup around the beautiful Central Park Lake. We''ll focus on removing litter from the shoreline and surrounding paths. This is a great opportunity to make a positive impact while enjoying the outdoors. All equipment will be provided, just bring your enthusiasm!',
        '{"lat": 40.7829, "lng": -73.9654, "address": "Central Park Lake, New York, NY"}',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        1.5,
        '2024-02-15 09:00:00+00',
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        'Beach Cleanup at Santa Monica',
        'Help us keep Santa Monica Beach pristine! We''ll be collecting plastic waste, cigarette butts, and other debris along the coastline. This cleanup is part of our monthly beach conservation effort. Volunteers of all ages welcome - families encouraged to participate together.',
        '{"lat": 34.0195, "lng": -118.4912, "address": "Santa Monica Beach, Santa Monica, CA"}',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
        2.0,
        '2024-02-18 08:30:00+00',
        '550e8400-e29b-41d4-a716-446655440002'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440003',
        'Urban Forest Trail Restoration',
        'Join our trail restoration project in Golden Gate Park. We''ll be removing invasive plants, clearing debris from hiking paths, and planting native species. This hands-on conservation work helps preserve the natural habitat for local wildlife. Wear sturdy shoes and bring work gloves.',
        '{"lat": 37.7694, "lng": -122.4862, "address": "Golden Gate Park, San Francisco, CA"}',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        3.0,
        '2024-02-22 10:00:00+00',
        '550e8400-e29b-41d4-a716-446655440003'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440004',
        'River Cleanup & Water Quality Testing',
        'Participate in our comprehensive river cleanup along the Chicago River. We''ll collect trash, test water quality, and document pollution sources. This scientific approach helps us understand environmental impact while making immediate improvements. Perfect for students and environmental enthusiasts.',
        '{"lat": 41.8881, "lng": -87.6298, "address": "Chicago Riverwalk, Chicago, IL"}',
        'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
        2.5,
        '2024-02-25 11:00:00+00',
        '550e8400-e29b-41d4-a716-446655440004'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440005',
        'Community Garden Cleanup & Planting',
        'Help revitalize our local community garden! We''ll be clearing weeds, removing debris, and planting seasonal vegetables and flowers. This event combines environmental stewardship with community building. Stay after for a potluck lunch with fresh garden produce. Bring your own reusable containers!',
        '{"lat": 25.7617, "lng": -80.1918, "address": "Bayfront Park Community Garden, Miami, FL"}',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
        1.0,
        '2024-02-28 09:30:00+00',
        '550e8400-e29b-41d4-a716-446655440005'
    );

-- Add some equipment for each event
INSERT INTO event_equipment (event_id, name, is_checked) VALUES
    -- Central Park Lake Cleanup equipment
    ('660e8400-e29b-41d4-a716-446655440001', 'Trash bags', false),
    ('660e8400-e29b-41d4-a716-446655440001', 'Gloves', false),
    ('660e8400-e29b-41d4-a716-446655440001', 'Litter grabbers', false),
    ('660e8400-e29b-41d4-a716-446655440001', 'First aid kit', false),
    
    -- Santa Monica Beach Cleanup equipment
    ('660e8400-e29b-41d4-a716-446655440002', 'Beach cleanup bags', false),
    ('660e8400-e29b-41d4-a716-446655440002', 'Reusable gloves', false),
    ('660e8400-e29b-41d4-a716-446655440002', 'Sand sifters', false),
    ('660e8400-e29b-41d4-a716-446655440002', 'Sunscreen', false),
    
    -- Golden Gate Park equipment
    ('660e8400-e29b-41d4-a716-446655440003', 'Pruning shears', false),
    ('660e8400-e29b-41d4-a716-446655440003', 'Work gloves', false),
    ('660e8400-e29b-41d4-a716-446655440003', 'Native plant seedlings', false),
    ('660e8400-e29b-41d4-a716-446655440003', 'Wheelbarrow', false),
    
    -- Chicago River equipment
    ('660e8400-e29b-41d4-a716-446655440004', 'Water testing kits', false),
    ('660e8400-e29b-41d4-a716-446655440004', 'Waterproof gloves', false),
    ('660e8400-e29b-41d4-a716-446655440004', 'Data collection sheets', false),
    ('660e8400-e29b-41d4-a716-446655440004', 'Trash collection nets', false),
    
    -- Community Garden equipment
    ('660e8400-e29b-41d4-a716-446655440005', 'Garden tools', false),
    ('660e8400-e29b-41d4-a716-446655440005', 'Vegetable seeds', false),
    ('660e8400-e29b-41d4-a716-446655440005', 'Watering cans', false),
    ('660e8400-e29b-41d4-a716-446655440005', 'Compost bins', false);

-- Add some participants to events
INSERT INTO event_participants (event_id, user_id) VALUES
    -- Central Park Lake Cleanup participants
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
    
    -- Santa Monica Beach participants
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
    
    -- Golden Gate Park participants
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
    
    -- Chicago River participants
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005'),
    
    -- Community Garden participants
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003'),
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004');

-- Add some chat messages to make events feel active
INSERT INTO event_chat (event_id, user_id, message) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Looking forward to this cleanup! Should I bring my own gloves?'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'No need! We have plenty of gloves for everyone. Just bring water and enthusiasm! 🧤'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'This beach cleanup sounds amazing! What time should we meet?'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'We start at 8:30 AM sharp. Meet at the main lifeguard station! 🏖️'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'Excited to help restore the trails! Any specific plants we''ll be working with?'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'We''ll be planting native California poppies and removing invasive ivy. Perfect timing for spring! 🌸');