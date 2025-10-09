import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const groupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  max_members: z.number().min(2).max(1000).default(50),
  is_private: z.boolean().default(false),
})

const updateGroupSchema = groupSchema.partial()

const inviteMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['member', 'moderator']).default('member'),
})

// GET /api/groups - Get groups
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('id')
    const user_groups = searchParams.get('user_groups') === 'true'
    const public_only = searchParams.get('public_only') === 'true'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (group_id) {
      // Get specific group
      const { data: group, error } = await supabase
        .from('groups')
        .select(`
          *,
          profiles!groups_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          group_members(
            *,
            profiles(
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', group_id)
        .single()

      if (error) {
        console.error('Error fetching group:', error)
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }

      // Check if user can view this group
      if (group.is_private) {
        const isMember = group.group_members.some((member: any) => member.user_id === user.id)
        if (!isMember) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      return NextResponse.json({ group })
    } else {
      // Get multiple groups
      let query = supabase
        .from('groups')
        .select(`
          *,
          profiles!groups_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          group_members(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (user_groups) {
        // Get groups where user is a member
        query = query.in('id', 
          supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
        )
      }

      if (public_only) {
        query = query.eq('is_private', false)
      }

      if (category) {
        query = query.eq('category', category)
      }

      const { data: groups, error } = await query

      if (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
      }

      return NextResponse.json({ groups })
    }
  } catch (error) {
    console.error('Groups GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = groupSchema.parse(body)

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select(`
        *,
        profiles!groups_created_by_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating group:', error)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Groups POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/groups - Update a group
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    // Check if user is admin or moderator of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!['admin', 'moderator'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin or moderator access required' }, { status: 403 })
    }

    const { data: group, error } = await supabase
      .from('groups')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select(`
        *,
        profiles!groups_created_by_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating group:', error)
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Groups PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/groups - Delete a group
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Check if user is admin of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Groups DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/groups/join - Join a group
export async function JOIN_GROUP(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { group_id } = body

    if (!group_id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Verify the group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('is_private, max_members')
      .eq('id', group_id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check member limit
    const { count: memberCount, error: countError } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group_id)

    if (!countError && memberCount && memberCount >= group.max_members) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMembership, error: existingError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 409 })
    }

    // Join the group
    const { data: membership, error } = await supabase
      .from('group_members')
      .insert({
        group_id,
        user_id: user.id,
        role: 'member',
      })
      .select(`
        *,
        profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error joining group:', error)
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/groups/leave - Leave a group
export async function LEAVE_GROUP(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error leaving group:', error)
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Left group successfully' })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/groups/invite - Invite a user to a group
export async function INVITE_MEMBER(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { group_id, ...inviteData } = body
    const validatedData = inviteMemberSchema.parse(inviteData)

    if (!group_id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Check if user is admin or moderator of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!['admin', 'moderator'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin or moderator access required' }, { status: 403 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', validatedData.user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMembership, error: existingError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', validatedData.user_id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    // Add the member
    const { data: newMembership, error } = await supabase
      .from('group_members')
      .insert({
        group_id,
        user_id: validatedData.user_id,
        role: validatedData.role,
      })
      .select(`
        *,
        profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error inviting member:', error)
      return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
    }

    // Create notification for the invited user
    await supabase
      .from('notifications')
      .insert({
        user_id: validatedData.user_id,
        type: 'group_invite',
        title: 'Group Invitation',
        message: `You've been invited to join a group`,
        data: { group_id, inviter_id: user.id }
      })

    return NextResponse.json({ membership: newMembership }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
