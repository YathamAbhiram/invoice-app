import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  User,
  Mail,
  Shield,
  Camera,
  Save,
  Lock,
  UserCircle,
  Building,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  LogOut
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, profile, logout, updateProfile, updatePassword } = useAuth()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showAccountActions, setShowAccountActions] = useState(true)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    company: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        role: profile.role || 'staff',
        phone: profile.phone || '',
        company: profile.company || ''
      })
      // Load existing photo if any
      if (profile.photo) {
        setProfilePhoto(profile.photo)
      }
    }
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await updateProfile({
        name: formData.name,
        phone: formData.phone || '',
        company: formData.company || '',
        photo: profilePhoto // Include photo in update
      })
      
      if (error) {
        console.error('❌ Error updating profile:', error)
        toast.error('Failed to update profile: ' + error.message)
        setLoading(false)
        return
      }
      
      console.log('✅ Profile updated:', data)
      toast.success('Profile updated successfully!')
      setEditMode(false)
    } catch (error) {
      console.error('❌ Error in handleUpdateProfile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle photo upload with database save
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }

    setUploadingPhoto(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const photoData = event.target.result
        
        // Update local state
        setProfilePhoto(photoData)
        
        // Save to database
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .update({ photo: photoData })
            .eq('id', user.id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ Error saving photo:', error)
            toast.error('Failed to save photo')
            setProfilePhoto(null)
          } else {
            toast.success('Profile photo updated!')
            // Update the profile in auth context
            await updateProfile({ photo: photoData })
          }
        }
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('❌ Error uploading photo:', error)
      toast.error('Failed to upload photo')
      setUploadingPhoto(false)
    }
  }

  // Remove photo
  const handleRemovePhoto = async () => {
    if (window.confirm('Remove your profile photo?')) {
      try {
        setProfilePhoto(null)
        
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ photo: null })
            .eq('id', user.id)
          
          if (error) {
            console.error('❌ Error removing photo:', error)
            toast.error('Failed to remove photo')
            setProfilePhoto(profile.photo || null)
            return
          }
          
          toast.success('Profile photo removed')
        }
      } catch (error) {
        console.error('❌ Error removing photo:', error)
        toast.error('Failed to remove photo')
      }
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await updatePassword(passwordData.newPassword)
      
      if (error) {
        console.error('❌ Error changing password:', error)
        toast.error('Failed to change password: ' + error.message)
        setLoading(false)
        return
      }
      
      toast.success('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
    } catch (error) {
      console.error('❌ Error in handleChangePassword:', error)
      toast.error('Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      staff: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      staff: 'Staff'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.staff}`}>
        {labels[role] || role}
      </span>
    )
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64">Loading profile...</div>
  }

  return (
    <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>
        {!editMode && (
          <Button onClick={() => setEditMode(true)} className="w-full sm:w-auto flex items-center gap-2 text-sm">
            <User size={16} />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Left Column - Profile Photo */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0 flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-primary/20">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="md:w-16 md:h-16 text-primary/60" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-1.5 md:p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera size={14} className="md:w-5 md:h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {uploadingPhoto && (
              <p className="text-xs text-primary mt-2">Uploading...</p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 text-center">
              Click the camera icon to upload a new photo
            </p>
            {profilePhoto && (
              <div className="mt-3 md:mt-4 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm"
                  onClick={handleRemovePhoto}
                >
                  Remove Photo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {editMode ? (
              // Edit Mode
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Full Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Email Address</label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-muted text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Enter company name"
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={handleUpdateProfile} disabled={loading} className="flex-1 sm:flex-none text-sm">
                    <Save size={16} className="mr-1 md:mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false)
                      setFormData({
                        name: profile.name || '',
                        email: profile.email || '',
                        role: profile.role || 'staff',
                        phone: profile.phone || '',
                        company: profile.company || ''
                      })
                    }}
                    className="flex-1 sm:flex-none text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User size={16} className="md:w-5 md:h-5 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Full Name</div>
                      <div className="text-sm md:text-base font-medium">{formData.name}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="md:w-5 md:h-5 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Email Address</div>
                      <div className="text-sm md:text-base font-medium">{formData.email}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="md:w-5 md:h-5 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Role</div>
                      <div className="text-sm md:text-base font-medium">{getRoleBadge(formData.role)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="md:w-5 md:h-5 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Phone Number</div>
                      <div className="text-sm md:text-base font-medium">{formData.phone || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="md:w-5 md:h-5 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Company</div>
                      <div className="text-sm md:text-base font-medium">{formData.company || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader 
          className={`p-4 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <Lock size={18} className="md:w-5 md:h-5" />
              Change Password
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showPasswordForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPasswordForm(!showPasswordForm)
                }}
                className="text-sm"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showPasswordForm) && (
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="text-sm"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading} className="w-full sm:w-auto text-sm">
                <Lock size={16} className="mr-1 md:mr-2" />
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader 
          className={`p-4 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => setShowAccountActions(!showAccountActions)}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <LogOut size={18} className="md:w-5 md:h-5" />
              Account Actions
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showAccountActions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showAccountActions) && (
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
              <div>
                <div className="text-sm md:text-base font-medium">Session</div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Currently logged in as {formData.email}
                </div>
              </div>
              <Button variant="destructive" onClick={logout} className="w-full sm:w-auto text-sm">
                <LogOut size={16} className="mr-1 md:mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default Profile