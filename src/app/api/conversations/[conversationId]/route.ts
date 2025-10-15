import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params

    // Verify the user is a participant in this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if the user is a participant
    const participantIds = conversation.participant_ids
    if (!participantIds.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized to delete this conversation' }, { status: 403 })
    }

    // Delete all messages in the conversation first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 })
    }

    // Delete the conversation
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Conversation deleted successfully',
      conversationId 
    })

  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
