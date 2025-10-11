'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { useComments, useCreateComment, useDeleteComment, useUpdateComment } from '@/hooks/useApi'
import { toast } from 'sonner'
import { useRelativeTime } from '@/hooks/useRelativeTime'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string
    avatar_url?: string
  }
}

// Individual comment component with real-time relative time
function CommentItem({ 
  comment, 
  user, 
  editingComment, 
  editContent, 
  setEditContent, 
  updating,
  onEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete 
}: {
  comment: Comment
  user: SupabaseUser | null
  editingComment: string | null
  editContent: string
  setEditContent: (content: string) => void
  updating: boolean
  onEdit: (commentId: string, content: string) => void
  onCancelEdit: () => void
  onSaveEdit: (commentId: string) => void
  onDelete: (commentId: string) => void
}) {
  const relativeTime = useRelativeTime(comment.created_at)
  
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback>
          {comment.profiles.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.profiles.username}</span>
          <span className="text-xs text-gray-500">
            {relativeTime}
            {comment.updated_at !== comment.created_at && (
              <span className="ml-1 text-gray-400">(edited)</span>
            )}
          </span>
          {user?.id === comment.profiles.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit(comment.id, comment.content)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(comment.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {editingComment === comment.id ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              placeholder="Edit your comment..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSaveEdit(comment.id)}
                disabled={updating || !editContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelEdit}
                disabled={updating}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  )
}

interface CommentsSectionProps {
  streakId: string
}

export function CommentsSection({ streakId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const supabase = createClient()
  
  // Use our custom hooks
  const { data: commentsData, loading, error, refetch } = useComments(streakId)
  const { createComment, loading: submitting } = useCreateComment()
  const { deleteComment, loading: deleting } = useDeleteComment()
  const { updateComment, loading: updating } = useUpdateComment()
  
  const comments = commentsData?.comments || []

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      await createComment({
        streak_id: streakId,
        content: newComment.trim(),
      })
      
      setNewComment('')
      toast.success('Comment posted successfully!')
      refetch() // Refresh comments
    } catch (error) {
      toast.error('Failed to post comment. Please try again.')
      console.error('Error creating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      toast.success('Comment deleted successfully!')
      refetch() // Refresh comments
    } catch (error) {
      toast.error('Failed to delete comment. Please try again.')
      console.error('Error deleting comment:', error)
    }
  }

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingComment(commentId)
    setEditContent(currentContent)
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      await updateComment(commentId, { content: editContent.trim() })
      toast.success('Comment updated successfully!')
      setEditingComment(null)
      setEditContent('')
      refetch() // Refresh comments
    } catch (error) {
      toast.error('Failed to update comment. Please try again.')
      console.error('Error updating comment:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.user_metadata?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts about this streak..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4 mr-1" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CommentItem
                  comment={comment}
                  user={user}
                  editingComment={editingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  updating={updating}
                  onEdit={handleEditComment}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteComment}
                />
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
