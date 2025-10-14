'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Bell, Shield, Save, Upload, X, Lock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showDefaultAvatars, setShowDefaultAvatars] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Default avatar options
  const defaultAvatars = [
    { id: 'default-1', url: '/avatars/default-1.svg', name: 'Blue Avatar', color: '#3B82F6' },
    { id: 'default-2', url: '/avatars/default-2.svg', name: 'Green Avatar', color: '#10B981' },
    { id: 'default-3', url: '/avatars/default-3.svg', name: 'Orange Avatar', color: '#F59E0B' },
    { id: 'default-4', url: '/avatars/default-4.svg', name: 'Red Avatar', color: '#EF4444' },
    { id: 'default-5', url: '/avatars/default-5.svg', name: 'Purple Avatar', color: '#8B5CF6' },
    { id: 'default-6', url: '/avatars/default-6.svg', name: 'Cyan Avatar', color: '#06B6D4' },
  ]
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    email_notifications: true,
    streak_reminders: true,
    is_private: false,
  })
  const [originalFormData, setOriginalFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    email_notifications: true,
    streak_reminders: true,
    is_private: false,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)
        const initialFormData = {
          username: profileData?.username || '',
          display_name: profileData?.display_name || '',
          bio: profileData?.bio || '',
          email_notifications: true, // Default values
          streak_reminders: true,
          is_private: profileData?.is_private || false,
        }
        setFormData(initialFormData)
        setOriginalFormData(initialFormData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleAvatarUpload = async () => {
    if (!user || !selectedFile) return

    setUploadingAvatar(true)
    try {
      // Create a unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile({ ...profile, avatar_url: avatarUrl })
      setSelectedFile(null)
      setPreviewUrl(null)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Error uploading avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCancelAvatar = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDefaultAvatarSelect = async (avatarUrl: string) => {
    if (!user) return

    setUploadingAvatar(true)
    try {
      // Update profile with default avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile({ ...profile, avatar_url: avatarUrl })
      setShowDefaultAvatars(false)
      
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error('Error updating avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Check if there are any changes to save
  const hasChanges = () => {
    return (
      formData.username !== originalFormData.username ||
      formData.display_name !== originalFormData.display_name ||
      formData.bio !== originalFormData.bio ||
      formData.email_notifications !== originalFormData.email_notifications ||
      formData.streak_reminders !== originalFormData.streak_reminders ||
      formData.is_private !== originalFormData.is_private
    )
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          is_private: formData.is_private,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Update original form data to reflect saved state
      setOriginalFormData({ ...formData })
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and profile</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={previewUrl || profile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex gap-2">
                    {!selectedFile ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDefaultAvatars(!showDefaultAvatars)}
                        >
                          Choose Default
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCancelAvatar}
                          disabled={uploadingAvatar}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    {selectedFile 
                      ? `Selected: ${selectedFile.name}` 
                      : 'Upload a new profile picture (max 5MB) or choose from defaults'
                    }
                  </p>

                  {/* Default Avatar Selection */}
                  {showDefaultAvatars && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <h4 className="text-sm font-medium mb-3">Choose a Default Avatar</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {defaultAvatars.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => handleDefaultAvatarSelect(avatar.url)}
                            disabled={uploadingAvatar}
                            className="relative group"
                          >
                            <Avatar className="h-16 w-16 mx-auto border-2 border-transparent group-hover:border-blue-500 transition-colors">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback className="text-sm">
                                {avatar.name}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-center mt-1 text-gray-600">
                              {avatar.name}
                            </p>
                          </button>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setShowDefaultAvatars(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter display name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about your streaks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your streaks
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, email_notifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="streak_reminders">Streak Reminders</Label>
                  <p className="text-sm text-gray-500">
                    Get reminded to check in to your streaks
                  </p>
                </div>
                <Switch
                  id="streak_reminders"
                  checked={formData.streak_reminders}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, streak_reminders: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your profile and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {formData.is_private ? (
                      <Lock className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <Label htmlFor="is_private">Private Profile</Label>
                      <p className="text-sm text-gray-500">
                        {formData.is_private 
                          ? 'Your profile is private. Users need to send follow requests to see your content.'
                          : 'Your profile is public. Anyone can see your profile and public streaks.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <Switch
                  id="is_private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_private: checked })
                  }
                />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">How Privacy Works:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Public Profile:</strong> Anyone can find and view your profile, see your public streaks, and follow you directly.</p>
                  <p><strong>Private Profile:</strong> Users can find you but must send a follow request. You can accept or reject requests.</p>
                  <p><strong>Streak Privacy:</strong> Individual streaks can still be made private regardless of your profile setting.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
