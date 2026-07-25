import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    setProfile(data)
    console.log('📊 Profile loaded:', data) // Check if role is loaded
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    setLoading(false)
  }
}

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (!error && data.user) {
      await fetchProfile(data.user.id)
    }
    
    return { data, error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // FIXED: Update profile function (without updated_at)
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      console.log('📤 Updating profile with:', updates)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          company: updates.company
        })
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating profile:', error)
        return { data: null, error }
      }
      
      console.log('✅ Profile updated successfully:', data)
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error in updateProfile:', error)
      return { data: null, error }
    }
  }

  // Update password function
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('❌ Error updating password:', error)
        return { error }
      }
      
      console.log('✅ Password updated successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Error in updatePassword:', error)
      return { error }
    }
  }

  return { user, profile, loading, login, logout, updateProfile, updatePassword }
}