-- Add the missing mark_messages_as_read function

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_uuid UUID, user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert read records for all unread messages in the conversation
    INSERT INTO public.message_reads (message_id, user_id, read_at)
    SELECT m.id, user_uuid, NOW()
    FROM public.messages m
    WHERE m.conversation_id = conversation_uuid
      AND m.sender_id != user_uuid  -- Don't mark own messages as read
      AND NOT EXISTS (
          SELECT 1 FROM public.message_reads mr
          WHERE mr.message_id = m.id AND mr.user_id = user_uuid
      );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO service_role;

SELECT 'mark_messages_as_read function created successfully!' as status;
