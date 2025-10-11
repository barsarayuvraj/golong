'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileText, Send, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useApi'
import { useRelativeTime } from '@/hooks/useRelativeTime'
import { toast } from 'sonner'

type SupabaseUser = {
  id: string
  email?: string
}

interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  streak_id: string
  profiles: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

// Individual note component with real-time relative time
function NoteItem({ 
  note, 
  user, 
  editingNote, 
  editContent, 
  setEditContent, 
  updating,
  onEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete 
}: {
  note: Note
  user: SupabaseUser | null
  editingNote: string | null
  editContent: string
  setEditContent: (content: string) => void
  updating: boolean
  onEdit: (noteId: string, content: string) => void
  onCancelEdit: () => void
  onSaveEdit: (noteId: string) => void
  onDelete: (noteId: string) => void
}) {
  const relativeTime = useRelativeTime(note.created_at)
  
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.user_metadata?.avatar_url} />
        <AvatarFallback>
          {(user?.user_metadata?.username || user?.user_metadata?.display_name || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{user?.user_metadata?.username || user?.user_metadata?.display_name || 'User'}</span>
          <span className="text-xs text-gray-500">
            {relativeTime}
            {note.updated_at !== note.created_at && (
              <span className="ml-1 text-gray-400">(edited)</span>
            )}
          </span>
          {user?.id === note.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit(note.id, note.content)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {editingNote === note.id ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              placeholder="Edit your note..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSaveEdit(note.id)}
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
            {note.content}
          </p>
        )}
      </div>
    </div>
  )
}

interface NotesSectionProps {
  streakId: string
  onNotePosted?: () => void
}

export function NotesSection({ streakId, onNotePosted }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const supabase = createClient()
  
  // Use our custom hooks
  const { data: notesData, loading, error, refetch } = useNotes(streakId)
  const { createNote, loading: submitting } = useCreateNote()
  const { updateNote, loading: updating } = useUpdateNote()
  const { deleteNote, loading: deleting } = useDeleteNote()
  
  const notes = notesData?.notes || []

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !user) return

    try {
      await createNote({
        streak_id: streakId,
        content: newNote.trim(),
      })
      
      setNewNote('')
      toast.success('Note saved successfully!')
      refetch() // Refresh notes
      onNotePosted?.() // Notify parent component
    } catch (error) {
      toast.error('Failed to save note. Please try again.')
      console.error('Error creating note:', error)
    }
  }

  const handleEditNote = (noteId: string, currentContent: string) => {
    setEditingNote(noteId)
    setEditContent(currentContent)
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setEditContent('')
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) {
      toast.error('Note cannot be empty')
      return
    }

    try {
      await updateNote(noteId, { content: editContent.trim() })
      toast.success('Note updated successfully!')
      setEditingNote(null)
      setEditContent('')
      refetch() // Refresh notes
    } catch (error) {
      toast.error('Failed to update note. Please try again.')
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteNote(noteId)
      toast.success('Note deleted successfully!')
      refetch() // Refresh notes
    } catch (error) {
      toast.error('Failed to delete note. Please try again.')
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
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
          <FileText className="h-5 w-5" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about your progress..."
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitNote}
                    disabled={submitting || !newNote.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save Note
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notes List */}
        <div className="space-y-1">
          {notes.length > 0 ? (
            notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                user={user}
                editingNote={editingNote}
                editContent={editContent}
                setEditContent={setEditContent}
                updating={updating}
                onEdit={handleEditNote}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onDelete={handleDeleteNote}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notes yet. Add your first note to track your progress!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
