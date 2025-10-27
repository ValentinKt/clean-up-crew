-- Eco Cleanup Crew Database Schema
-- This file contains all the necessary tables, policies, and RPC functions for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE event_status AS ENUM ('upcoming', 'in_progress', 'completed', 'cancelled');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location JSONB NOT NULL,
    map_image_url TEXT,
    radius NUMERIC NOT NULL DEFAULT 2,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status event_status DEFAULT 'upcoming',
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Event equipment table
CREATE TABLE IF NOT EXISTS event_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event chat table
CREATE TABLE IF NOT EXISTS event_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event photos table
CREATE TABLE IF NOT EXISTS event_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for events table
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Organizers can update their events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for event_participants table
CREATE POLICY "Anyone can view participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join events" ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events they joined" ON event_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for event_equipment table
CREATE POLICY "Anyone can view equipment" ON event_equipment FOR SELECT USING (true);
CREATE POLICY "Event organizers can manage equipment" ON event_equipment FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_equipment.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Event participants can check equipment" ON event_equipment FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_participants WHERE event_participants.event_id = event_equipment.event_id AND event_participants.user_id = auth.uid())
);

-- RLS Policies for event_chat table
CREATE POLICY "Anyone can view chat messages" ON event_chat FOR SELECT USING (true);
CREATE POLICY "Event participants can send messages" ON event_chat FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM event_participants WHERE event_participants.event_id = event_chat.event_id AND event_participants.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM events WHERE events.id = event_chat.event_id AND events.organizer_id = auth.uid())
);

-- RLS Policies for event_photos table
CREATE POLICY "Anyone can view photos" ON event_photos FOR SELECT USING (true);
CREATE POLICY "Event participants can upload photos" ON event_photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM event_participants WHERE event_participants.event_id = event_photos.event_id AND event_participants.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM events WHERE events.id = event_photos.event_id AND events.organizer_id = auth.uid())
);

-- RPC Functions

-- Function to create a new event
CREATE OR REPLACE FUNCTION create_new_event(
    p_organizer_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_location JSONB,
    p_map_image_url TEXT,
    p_radius NUMERIC,
    p_date TIMESTAMP WITH TIME ZONE,
    p_equipment_names TEXT[]
) RETURNS JSONB AS $$
DECLARE
    new_event_id UUID;
    equipment_name TEXT;
    result JSONB;
BEGIN
    -- Insert the new event
    INSERT INTO events (organizer_id, title, description, location, map_image_url, radius, date)
    VALUES (p_organizer_id, p_title, p_description, p_location, p_map_image_url, p_radius, p_date)
    RETURNING id INTO new_event_id;
    
    -- Insert equipment items
    FOREACH equipment_name IN ARRAY p_equipment_names
    LOOP
        INSERT INTO event_equipment (event_id, name)
        VALUES (new_event_id, equipment_name);
    END LOOP;
    
    -- Return the complete event data
    SELECT jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'location', e.location,
        'mapImageUrl', e.map_image_url,
        'radius', e.radius,
        'date', e.date,
        'status', e.status,
        'organizer', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatarUrl', u.avatar_url
        ),
        'participants', '[]'::jsonb,
        'equipment', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', eq.id, 'name', eq.name, 'isChecked', eq.is_checked))
             FROM event_equipment eq WHERE eq.event_id = e.id),
            '[]'::jsonb
        ),
        'chat', '[]'::jsonb,
        'photos', '[]'::jsonb
    ) INTO result
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE e.id = new_event_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get event by ID
CREATE OR REPLACE FUNCTION get_event_by_id(p_event_id UUID) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'location', e.location,
        'mapImageUrl', e.map_image_url,
        'radius', e.radius,
        'date', e.date,
        'status', e.status,
        'organizer', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatarUrl', u.avatar_url
        ),
        'participants', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', pu.id,
                'name', pu.name,
                'email', pu.email,
                'avatarUrl', pu.avatar_url
            ))
             FROM event_participants ep
             JOIN users pu ON ep.user_id = pu.id
             WHERE ep.event_id = e.id),
            '[]'::jsonb
        ),
        'equipment', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', eq.id, 'name', eq.name, 'isChecked', eq.is_checked))
             FROM event_equipment eq WHERE eq.event_id = e.id),
            '[]'::jsonb
        ),
        'chat', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', ec.id,
                'message', ec.message,
                'timestamp', ec.timestamp,
                'user', jsonb_build_object(
                    'id', cu.id,
                    'name', cu.name,
                    'email', cu.email,
                    'avatarUrl', cu.avatar_url
                )
            ) ORDER BY ec.timestamp)
             FROM event_chat ec
             JOIN users cu ON ec.user_id = cu.id
             WHERE ec.event_id = e.id),
            '[]'::jsonb
        ),
        'photos', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', ep.id,
                'photoUrl', ep.photo_url,
                'caption', ep.caption,
                'uploadedAt', ep.uploaded_at,
                'user', jsonb_build_object(
                    'id', pu.id,
                    'name', pu.name,
                    'email', pu.email,
                    'avatarUrl', pu.avatar_url
                )
            ))
             FROM event_photos ep
             JOIN users pu ON ep.user_id = pu.id
             WHERE ep.event_id = e.id),
            '[]'::jsonb
        )
    ) INTO result
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE e.id = p_event_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all events
CREATE OR REPLACE FUNCTION get_all_events() RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'title', e.title,
            'description', e.description,
            'location', e.location,
            'mapImageUrl', e.map_image_url,
            'radius', e.radius,
            'date', e.date,
            'status', e.status,
            'organizer', jsonb_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email,
                'avatarUrl', u.avatar_url
            ),
            'participants', COALESCE(participants_data.participants, '[]'::jsonb),
            'equipment', COALESCE(equipment_data.equipment, '[]'::jsonb),
            'chat', COALESCE(chat_data.chat, '[]'::jsonb),
            'photos', COALESCE(photos_data.photos, '[]'::jsonb)
        )
    ) INTO result
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    LEFT JOIN (
        SELECT ep.event_id, jsonb_agg(jsonb_build_object(
            'id', pu.id,
            'name', pu.name,
            'email', pu.email,
            'avatarUrl', pu.avatar_url
        )) as participants
        FROM event_participants ep
        JOIN users pu ON ep.user_id = pu.id
        GROUP BY ep.event_id
    ) participants_data ON e.id = participants_data.event_id
    LEFT JOIN (
        SELECT eq.event_id, jsonb_agg(jsonb_build_object(
            'id', eq.id,
            'name', eq.name,
            'isChecked', eq.is_checked
        )) as equipment
        FROM event_equipment eq
        GROUP BY eq.event_id
    ) equipment_data ON e.id = equipment_data.event_id
    LEFT JOIN (
        SELECT ec.event_id, jsonb_agg(jsonb_build_object(
            'id', ec.id,
            'message', ec.message,
            'timestamp', ec.timestamp,
            'user', jsonb_build_object(
                'id', cu.id,
                'name', cu.name,
                'email', cu.email,
                'avatarUrl', cu.avatar_url
            )
        ) ORDER BY ec.timestamp) as chat
        FROM event_chat ec
        JOIN users cu ON ec.user_id = cu.id
        GROUP BY ec.event_id
    ) chat_data ON e.id = chat_data.event_id
    LEFT JOIN (
        SELECT ep.event_id, jsonb_agg(jsonb_build_object(
            'id', ep.id,
            'photoUrl', ep.photo_url,
            'caption', ep.caption,
            'uploadedAt', ep.uploaded_at,
            'user', jsonb_build_object(
                'id', pu.id,
                'name', pu.name,
                'email', pu.email,
                'avatarUrl', pu.avatar_url
            )
        )) as photos
        FROM event_photos ep
        JOIN users pu ON ep.user_id = pu.id
        GROUP BY ep.event_id
    ) photos_data ON e.id = photos_data.event_id
    ORDER BY e.date;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join an event
CREATE OR REPLACE FUNCTION join_event(p_event_id UUID, p_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO event_participants (event_id, user_id)
    VALUES (p_event_id, p_user_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave an event
CREATE OR REPLACE FUNCTION leave_event(p_event_id UUID, p_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM event_participants
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add equipment item
CREATE OR REPLACE FUNCTION add_equipment_item(p_event_id UUID, p_name TEXT) RETURNS JSONB AS $$
DECLARE
    new_item_id UUID;
    result JSONB;
BEGIN
    INSERT INTO event_equipment (event_id, name)
    VALUES (p_event_id, p_name)
    RETURNING id INTO new_item_id;
    
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'isChecked', is_checked
    ) INTO result
    FROM event_equipment
    WHERE id = new_item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle equipment item
CREATE OR REPLACE FUNCTION toggle_equipment_item(p_item_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE event_equipment
    SET is_checked = NOT is_checked
    WHERE id = p_item_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send chat message
CREATE OR REPLACE FUNCTION send_chat_message(p_event_id UUID, p_user_id UUID, p_message TEXT) RETURNS JSONB AS $$
DECLARE
    new_message_id UUID;
    result JSONB;
BEGIN
    INSERT INTO event_chat (event_id, user_id, message)
    VALUES (p_event_id, p_user_id, p_message)
    RETURNING id INTO new_message_id;
    
    SELECT jsonb_build_object(
        'id', ec.id,
        'message', ec.message,
        'timestamp', ec.timestamp,
        'user', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatarUrl', u.avatar_url
        )
    ) INTO result
    FROM event_chat ec
    JOIN users u ON ec.user_id = u.id
    WHERE ec.id = new_message_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update event status
CREATE OR REPLACE FUNCTION update_event_status(p_event_id UUID, p_status event_status) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE events
    SET status = p_status, updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_equipment_event_id ON event_equipment(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_event_id ON event_chat(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);