-- Messages system tables for GoLong app
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table - represents a chat between two users
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participant1_deleted BOOLEAN DEFAULT false,
  participant2_deleted BOOLEAN DEFAULT false,
  -- Ensure unique conversation between two users
  UNIQUE(participant1_id, participant2_id),
  -- Ensure participant1_id is always the smaller UUID for consistency
  CHECK (participant1_id < participant2_id)
);

-- Messages table - individual messages within conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, -- This will store encrypted content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Message status tracking
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  -- Soft delete for messages
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_recipient BOOLEAN DEFAULT false
);

-- Message read receipts table - track who has read which messages
CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- User message preferences table
CREATE TABLE IF NOT EXISTS public.message_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  allow_messages_from TEXT DEFAULT 'followers' CHECK (allow_messages_from IN ('everyone', 'followers', 'none')),
  show_online_status BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked users table for message blocking
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  -- Prevent self-blocking
  CHECK (blocker_id != blocked_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON public.message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Message reads policies
CREATE POLICY "Users can view their own message reads" ON public.message_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own message reads" ON public.message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Message preferences policies
CREATE POLICY "Users can manage their own message preferences" ON public.message_preferences
  FOR ALL USING (user_id = auth.uid());

-- Blocked users policies
CREATE POLICY "Users can view their own blocked users" ON public.blocked_users
  FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can block/unblock other users" ON public.blocked_users
  FOR ALL USING (blocker_id = auth.uid());

-- Functions for common operations

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant1 UUID;
  participant2 UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF user1_id < user2_id THEN
    participant1 := user1_id;
    participant2 := user2_id;
  ELSE
    participant1 := user2_id;
    participant2 := user1_id;
  END IF;

  -- Check if conversation already exists
  SELECT id INTO conversation_id 
  FROM public.conversations 
  WHERE participant1_id = participant1 AND participant2_id = participant2;

  -- Create conversation if it doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant1_id, participant2_id)
    VALUES (participant1, participant2)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation's last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.message_reads (message_id, user_id)
  SELECT m.id, user_uuid
  FROM public.messages m
  WHERE m.conversation_id = conversation_uuid 
    AND m.sender_id != user_uuid
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads mr 
      WHERE mr.message_id = m.id AND mr.user_id = user_uuid
    );
    
  -- Update read_at timestamp for messages
  UPDATE public.messages 
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid 
    AND sender_id != user_uuid
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
