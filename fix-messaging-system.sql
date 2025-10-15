-- Fix the messaging system by creating all necessary tables and functions

-- 1. Create the conversations table with all necessary columns
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_message_at TIMESTAMPTZ,
    participant1_deleted BOOLEAN DEFAULT FALSE,
    participant2_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(participant1_id, participant2_id)
);

-- 2. Create the messages table with all necessary columns
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create the message_reads table
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id)
);

-- 4. Create the blocked_users table (referenced in API)
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

-- 5. Create the message_preferences table (referenced in API)
CREATE TABLE IF NOT EXISTS public.message_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    allow_messages_from VARCHAR(20) DEFAULT 'everyone', -- 'everyone', 'followers', 'none'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- 6. Create the get_or_create_conversation function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- First, try to find an existing conversation between these two users
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE (participant1_id = user1_id AND participant2_id = user2_id)
       OR (participant1_id = user2_id AND participant2_id = user1_id)
    LIMIT 1;
    
    -- If conversation exists, return its ID
    IF conversation_id IS NOT NULL THEN
        RETURN conversation_id;
    END IF;
    
    -- If no conversation exists, create a new one
    INSERT INTO public.conversations (participant1_id, participant2_id, created_at, updated_at)
    VALUES (user1_id, user2_id, NOW(), NOW())
    RETURNING id INTO conversation_id;
    
    RETURN conversation_id;
END;
$$;

-- 7. Create function to update last_message_at when a message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$;

-- 8. Create trigger to automatically update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- 9. Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_preferences ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
    participant1_id = auth.uid() OR 
    participant2_id = auth.uid()
);

-- 11. Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
);

-- 12. Create RLS policies for message_reads
DROP POLICY IF EXISTS "Users can view their own message reads" ON public.message_reads;
CREATE POLICY "Users can view their own message reads"
ON public.message_reads FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;
CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 13. Create RLS policies for blocked_users
DROP POLICY IF EXISTS "Users can view their own blocked users" ON public.blocked_users;
CREATE POLICY "Users can view their own blocked users"
ON public.blocked_users FOR SELECT
USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "Users can block/unblock other users" ON public.blocked_users;
CREATE POLICY "Users can block/unblock other users"
ON public.blocked_users FOR ALL
USING (blocker_id = auth.uid());

-- 14. Create RLS policies for message_preferences
DROP POLICY IF EXISTS "Users can view their own message preferences" ON public.message_preferences;
CREATE POLICY "Users can view their own message preferences"
ON public.message_preferences FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own message preferences" ON public.message_preferences;
CREATE POLICY "Users can update their own message preferences"
ON public.message_preferences FOR ALL
USING (user_id = auth.uid());

-- 15. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO service_role;

GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.message_reads TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.message_preferences TO authenticated;

-- 16. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);

SELECT 'Messaging system tables and functions created successfully!' as status;
