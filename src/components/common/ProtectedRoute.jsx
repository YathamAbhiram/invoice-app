import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  // Show loading while checking auth
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>
  }
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default ProtectedRoute