import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  UserPlus,
  User,
  Mail,
  Shield,
  Trash2,
  RefreshCw,
  Key,
  X,
  Save,
  Users,
  UserCog,
  ChevronDown,
  ChevronUp,
  Camera
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getUsers, updateUserRole, deleteUser, updateUser } from '../services/database'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const { profile } = useAuth()
  const fileInputRef = useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(null)
  const [users, setUsers] = useState([])
  const [showUsers, setShowUsers] = useState(true)

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
    photo: null
  })

  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
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
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await getUsers()
      
      if (error) throw error
      
      // Filter out Super Admin
      const filteredUsers = (data || []).filter(u => u.email !== 'yathamabhiram80@gmail.com')
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill all required fields')
      return
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (users.some(u => u.email === newUser.email)) {
      toast.error('Email already exists')
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          role: newUser.role
        }
      })
      
      if (authError) throw authError
      
      toast.success(`User ${newUser.name} added successfully!`)
      
      await loadUsers()
      setShowAddUser(false)
      setNewUser({
        name: '',
        email: '',
        role: 'staff',
        password: '',
        confirmPassword: '',
        photo: null
      })
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(error.message || 'Failed to add user')
    }
  }

  const handleSwitchRole = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    const newRole = user.role === 'admin' ? 'staff' : 'admin'
    
    try {
      const { data, error } = await updateUserRole(userId, newRole)
      
      if (error) throw error
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`${user.name} is now ${newRole}`)
    } catch (error) {
      console.error('Error switching role:', error)
      toast.error('Failed to switch role')
    }
  }

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    if (window.confirm(`Delete ${user.name}? This action cannot be undone.`)) {
      try {
        const { error } = await deleteUser(userId)
        if (error) throw error
        
        setUsers(users.filter(u => u.id !== userId))
        toast.success(`${user.name} deleted successfully`)
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
      }
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
      toast.error('Please fill all fields')
      return
    }
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (resetPasswordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        resetPasswordData.userId,
        { password: resetPasswordData.newPassword }
      )
      
      if (error) throw error
      
      toast.success('Password reset successfully!')
      setShowResetPassword(null)
      setResetPasswordData({
        userId: null,
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      staff: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
    const labels = {
      admin: 'Admin',
      staff: 'Staff'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.staff}`}>
        {labels[role] || role}
      </span>
    )
  }

  // Mobile card view
  const renderMobileCard = (user) => {
    return (
      <div key={user.id} className="border rounded-lg p-3 mb-3 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-primary/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{user.name}</span>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwitchRole(user.id)}
            className="flex-1 items-center gap-1 text-xs h-8"
          >
            <UserCog size={14} />
            {user.role === 'admin' ? 'Make Staff' : 'Make Admin'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetPassword(user.id)}
            className="flex-1 items-center gap-1 text-xs h-8"
          >
            <Key size={14} />
            Reset Pass
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteUser(user.id)}
            className="flex-1 items-center gap-1 text-xs h-8"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Reset Password Form (inline) */}
        {showResetPassword === user.id && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Reset Password for {user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetPassword(null)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New password"
                value={resetPasswordData.newPassword}
                onChange={(e) => setResetPasswordData({
                  userId: user.id,
                  newPassword: e.target.value,
                  confirmPassword: resetPasswordData.confirmPassword
                })}
                className="text-sm h-8"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={resetPasswordData.confirmPassword}
                onChange={(e) => setResetPasswordData({
                  userId: user.id,
                  newPassword: resetPasswordData.newPassword,
                  confirmPassword: e.target.value
                })}
                className="text-sm h-8"
              />
              <div className="flex gap-2">
                <Button onClick={handleResetPassword} size="sm" className="text-xs h-8 flex-1">
                  <Save size={14} className="mr-1" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResetPassword(null)
                    setResetPasswordData({
                      userId: null,
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading users...</div>
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage all users in the system</p>
        </div>
        <Button onClick={() => setShowAddUser(true)} className="w-full sm:w-auto flex items-center gap-2 text-sm">
          <UserPlus size={16} />
          Add New User
        </Button>
      </div>

      {/* User List - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => setShowUsers(!showUsers)}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <Users size={18} className="md:w-5 md:h-5" />
              All Users ({users.length})
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showUsers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showUsers) && (
          <CardContent className="p-0">
            {isMobile ? (
              // Mobile Card View
              <div className="p-3 space-y-2">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  users.map(renderMobileCard)
                )}
              </div>
            ) : (
              // Desktop Table View
              <div className="divide-y">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.photo ? (
                            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-primary/60" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold">{user.name}</span>
                            {getRoleBadge(user.role)}
                            <span className="text-sm text-muted-foreground">• {user.email}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwitchRole(user.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <UserCog size={14} />
                            {user.role === 'admin' ? 'Make Staff' : 'Make Admin'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResetPassword(user.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Key size={14} />
                            Reset Pass
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {showResetPassword === user.id && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-2 mb-3">
                            <Key size={16} className="text-primary" />
                            <span className="font-medium">Reset Password for {user.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowResetPassword(null)}
                              className="ml-auto"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">New Password</label>
                              <Input
                                type="password"
                                value={resetPasswordData.newPassword}
                                onChange={(e) => setResetPasswordData({
                                  userId: user.id,
                                  newPassword: e.target.value,
                                  confirmPassword: resetPasswordData.confirmPassword
                                })}
                                placeholder="Enter new password"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Confirm Password</label>
                              <Input
                                type="password"
                                value={resetPasswordData.confirmPassword}
                                onChange={(e) => setResetPasswordData({
                                  userId: user.id,
                                  newPassword: resetPasswordData.newPassword,
                                  confirmPassword: e.target.value
                                })}
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button onClick={handleResetPassword} size="sm">
                              <Save size={14} className="mr-1" />
                              Reset Password
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowResetPassword(null)
                                setResetPasswordData({
                                  userId: null,
                                  newPassword: '',
                                  confirmPassword: ''
                                })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold">Add New User</h2>
                <button
                  onClick={() => {
                    setShowAddUser(false)
                    setNewUser({
                      name: '',
                      email: '',
                      role: 'staff',
                      password: '',
                      confirmPassword: '',
                      photo: null
                    })
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Photo Upload */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30">
                    {newUser.photo ? (
                      <img src={newUser.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="md:w-8 md:h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Camera size={14} />
                      Upload Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setNewUser({...newUser, photo: event.target.result})
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Optional</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Full Name *</label>
                    <Input
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Enter full name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="Enter email"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full h-9 md:h-10 px-3 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Password *</label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Enter password"
                      className="text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium mb-1">Confirm Password *</label>
                    <Input
                      type="password"
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                      placeholder="Confirm password"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button onClick={handleAddUser} className="flex-1 md:flex-none items-center gap-2 text-sm">
                    <UserPlus size={16} />
                    Add User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddUser(false)
                      setNewUser({
                        name: '',
                        email: '',
                        role: 'staff',
                        password: '',
                        confirmPassword: '',
                        photo: null
                      })
                    }}
                    className="flex-1 md:flex-none text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement