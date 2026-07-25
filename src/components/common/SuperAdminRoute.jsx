import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const SuperAdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user is Super Admin by role
  const isSuperAdmin = profile?.role === 'super_admin'
  
  console.log('SuperAdminRoute check:', { 
    email: profile?.email, 
    role: profile?.role,
    isSuperAdmin 
  })
  
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default SuperAdminRoute