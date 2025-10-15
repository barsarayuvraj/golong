'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { messageEncryption } from '@/lib/message-encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Send, 
  MessageCircle, 
  Plus, 
  MoreVertical, 
  Check, 
  CheckCheck,
  UserPlus,
  Shield,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/time-utils'

// Utility function to get date string for separators
const getDateString = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const messageDate = new Date(date)
  
  // Reset time to compare only dates
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
  
  if (messageDateOnly.getTime() === todayDate.getTime()) {
    return 'Today'
  } else if (messageDateOnly.getTime() === yesterdayDate.getTime()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

// Check if we need to show a date separator
const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message): boolean => {
  if (!previousMessage) return true // First message always shows date
  
  const currentDate = new Date(currentMessage.created_at)
  const previousDate = new Date(previousMessage.created_at)
  
  // Reset time to compare only dates
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate())
  
  return currentDateOnly.getTime() !== previousDateOnly.getTime()
}

interface User {
  id: string
  username: string
  display_name: string
  avatar_url?: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: string
  encrypted: boolean
  sender: User
  read_at?: string
  delivered_at?: string
}

interface Conversation {
  id: string
  otherParticipant: User
  lastMessage?: Message
  lastMessageAt: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export function MessagesInterface() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [searching, setSearching] = useState(false)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true) // Always enabled for security
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation && user) {
      setMessages([]) // Clear messages when switching conversations
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, user])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers(searchQuery)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const data = await response.json()
      const messagesWithDecryption = await Promise.all(
        data.messages.map(async (message: Message) => {
          if (message.encrypted && user) {
            try {
              // Ensure we have the right user IDs for key generation
              const senderId = message.sender_id
              const recipientId = user.id
              
              // Generate key with consistent ordering
              const key = await messageEncryption.getSharedKey(senderId, recipientId)
              
              const decryptedContent = await messageEncryption.decryptMessage(
                message.content,
                key
              )
              return { ...message, content: decryptedContent }
            } catch (error) {
              console.error('Failed to decrypt message:', error)
              return { ...message, content: '[Encrypted message - unable to decrypt]' }
            }
          }
          return message
        })
      )
      
      setMessages(messagesWithDecryption)
      
      // Mark messages as read
      await markMessagesAsRead(conversationId)
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const searchUsers = async (query: string) => {
    setSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search users')
      
      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return

    setSending(true)
    try {
      // Always encrypt messages for security
      const key = await messageEncryption.getSharedKey(
        user.id,
        selectedConversation.otherParticipant.id
      )
      const messageContent = await messageEncryption.encryptMessage(
        newMessage.trim(),
        key
      )

      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: 'text',
          encrypted: true
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      // Add message to local state (decrypted for display)
      const newMsg = {
        ...data.message,
        content: newMessage.trim() // Show decrypted content locally
      }
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
      
      // Update conversations list
      await fetchConversations()
      
      // Scroll to bottom after state update
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 200)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = async (otherUser: User) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherUserId: otherUser.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create conversation')
      }

      const data = await response.json()
      
      // Create a conversation object for local state
      const newConversation: Conversation = {
        id: data.conversationId,
        otherParticipant: otherUser,
        lastMessage: undefined,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      }
      
      setConversations(prev => [newConversation, ...prev])
      setSelectedConversation(newConversation)
      setShowNewMessage(false)
      setSearchQuery('')
      setSearchResults([])
      
      toast.success(`Started conversation with ${otherUser.username}`)
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      toast.error(error.message || 'Failed to start conversation')
    }
  }

  const deleteConversation = async () => {
    if (!selectedConversation) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete conversation')
      }

      // Remove conversation from local state
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id))
      
      // Clear selected conversation and messages
      setSelectedConversation(null)
      setMessages([])
      setShowDeleteDialog(false)
      
      toast.success('Conversation deleted successfully')
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      toast.error(error.message || 'Failed to delete conversation')
    } finally {
      setDeleting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white shadow-lg">
        {/* Conversations List */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold">Messages</h1>
              <Button
                size="sm"
                onClick={() => setShowNewMessage(true)}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                title="Start new conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showNewMessage && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                
                {searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-center text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => startNewConversation(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              {user.display_name && (
                                <div className="text-sm text-gray-500">{user.display_name}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No users found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1 p-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a new conversation!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-100 border border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.otherParticipant.avatar_url} />
                        <AvatarFallback>
                          {conversation.otherParticipant.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">
                            {conversation.otherParticipant.username}
                          </div>
                          {conversation.lastMessage && (
                            <div className="text-xs text-gray-500">
                              {formatRelativeTime(conversation.lastMessageAt || conversation.lastMessage?.created_at)}
                            </div>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.encrypted ? 
                              '🔒 Encrypted message' : 
                              conversation.lastMessage.content
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white">
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              {/* Chat Header - Fixed Position */}
              <div className="p-4 border-b bg-white flex-shrink-0 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.otherParticipant.avatar_url} />
                      <AvatarFallback>
                        {selectedConversation.otherParticipant.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedConversation.otherParticipant.username}</div>
                      {selectedConversation.otherParticipant.display_name && (
                        <div className="text-sm text-gray-500">
                          {selectedConversation.otherParticipant.display_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      End-to-End Encrypted
                    </Badge>
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      Messages are encrypted with AES-256-GCM
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 flex-shrink-0 border border-gray-200 hover:border-red-300"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 pt-20 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const previousMessage = index > 0 ? messages[index - 1] : undefined
                      const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                      
                      return (
                        <div key={message.id}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-4">
                              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                {getDateString(new Date(message.created_at))}
                              </div>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                  : 'bg-blue-50 text-blue-900 border border-blue-200'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs mt-1 flex items-center gap-1 text-blue-600">
                                <span>{formatRelativeTime(message.created_at || message.updated_at)}</span>
                                {message.sender_id === user?.id && (
                                  <div className="ml-1">
                                    {message.read_at ? (
                                      <CheckCheck className="h-3 w-3 text-blue-600" />
                                    ) : (
                                      <Check className="h-3 w-3 text-blue-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Fixed */}
              <div className="p-4 border-t bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation with{' '}
              <span className="font-semibold">{selectedConversation?.otherParticipant.username}</span>?
              This action cannot be undone and will permanently delete all messages in this conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteConversation}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Conversation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
