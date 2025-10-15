import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, participant1_id, participant2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.participant1_id !== user.id && conversation.participant2_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Mark messages as read using the database function
    const { error } = await supabase
      .rpc('mark_messages_as_read', {
        conversation_uuid: conversationId,
        user_uuid: user.id
      })

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
