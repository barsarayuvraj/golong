import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get conversations for the user with participant details
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:profiles!conversations_participant1_id_fkey(id, username, avatar_url, display_name),
        participant2:profiles!conversations_participant2_id_fkey(id, username, avatar_url, display_name),
        messages!messages_conversation_id_fkey(
          id,
          content,
          sender_id,
          created_at,
          message_type,
          encrypted
        )
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Transform the data to include the other participant's info
    const transformedConversations = conversations.map((conversation: any) => {
      const isParticipant1 = conversation.participant1_id === user.id
      const otherParticipant = isParticipant1 ? conversation.participant2 : conversation.participant1
      const lastMessage = conversation.messages && conversation.messages.length > 0 
        ? conversation.messages[0] 
        : null

      return {
        id: conversation.id,
        otherParticipant,
        lastMessage,
        lastMessageAt: conversation.last_message_at,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        // Check if conversation is deleted by current user
        isDeleted: isParticipant1 ? conversation.participant1_deleted : conversation.participant2_deleted
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 })
    }

    if (otherUserId === user.id) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 })
    }

    // Check if other user exists
    const { data: otherUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', otherUserId)
      .single()

    if (userError || !otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is blocked
    const { data: blockedCheck } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId})`)
      .single()

    if (blockedCheck) {
      return NextResponse.json({ error: 'Cannot create conversation with blocked user' }, { status: 403 })
    }

    // Check message preferences
    const { data: preferences } = await supabase
      .from('message_preferences')
      .select('allow_messages_from')
      .eq('user_id', otherUserId)
      .single()

    if (preferences?.allow_messages_from === 'none') {
      return NextResponse.json({ error: 'User does not accept messages' }, { status: 403 })
    }

    if (preferences?.allow_messages_from === 'followers') {
      // Check if current user follows the other user
      const { data: followCheck } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', otherUserId)
        .single()

      if (!followCheck) {
        return NextResponse.json({ error: 'User only accepts messages from followers' }, { status: 403 })
      }
    }

    // Get or create conversation using the database function
    const { data: conversationId, error: conversationError } = await supabase
      .rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      })

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ 
      conversationId,
      otherUser,
      message: 'Conversation created successfully'
    })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
