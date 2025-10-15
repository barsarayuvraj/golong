-- Create the missing get_or_create_conversation function
-- This function is needed for the messaging feature to work

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO service_role;

-- Create the conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(participant1_id, participant2_id)
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create message_reads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
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

-- Create RLS policies for messages
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

-- Create RLS policies for message_reads
DROP POLICY IF EXISTS "Users can view their own message reads" ON public.message_reads;
CREATE POLICY "Users can view their own message reads"
ON public.message_reads FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;
CREATE POLICY "Users can mark messages as read"
ON public.message_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.message_reads TO authenticated;

SELECT 'Conversation function and tables created successfully!' as status;
