import { useState, useEffect } from 'react'
import { Menu, Moon, Sun, User, ChevronDown, LogOut, Settings, UserCog, Activity } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { getCompanySettings } from '../../services/database'

const Header = () => {
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useStore()
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [portalName, setPortalName] = useState('Invoice App')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(null)

  useEffect(() => {
    const loadPortalName = async () => {
      try {
        const { data, error } = await getCompanySettings()
        if (!error && data?.portal_name) {
          setPortalName(data.portal_name)
        }
      } catch (error) {
        console.error('Error loading portal name:', error)
      }
    }
    loadPortalName()

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load profile photo from profile
  useEffect(() => {
    if (profile?.photo) {
      setProfilePhoto(profile.photo)
    } else {
      setProfilePhoto(null)
    }
  }, [profile])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setDropdownOpen(false)
  }

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest('.user-dropdown')) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropdownOpen])

  const isSuperAdmin = profile?.role === 'super_admin'

  // Get user initials
  const getUserInitials = () => {
    if (profile?.name) {
      return profile.name.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4 flex items-center justify-between fixed top-0 right-0 left-0 z-50 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        {!isMobile && (
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu size={20} className="md:w-6 md:h-6" />
          </button>
        )}
        {/* Portal Name - Bigger and Bolder */}
        <span className="font-extrabold text-lg md:text-2xl tracking-tight truncate max-w-[140px] sm:max-w-[250px]">
          {portalName}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={toggleTheme} 
          className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {theme === 'light' ? <Moon size={18} className="md:w-5 md:h-5" /> : <Sun size={18} className="md:w-5 md:h-5" />}
        </button>

        {/* User Avatar with Dropdown - Shows profile photo if available */}
        <div className="relative user-dropdown">
          <button
            onClick={handleDropdownToggle}
            className="flex items-center gap-1.5 md:gap-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={profile?.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-semibold text-xs md:text-sm">
                  {getUserInitials()}
                </span>
              )}
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border py-1 z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt={profile?.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-sm">
                        {getUserInitials()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                  </div>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role || 'Staff'}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User size={16} />
                My Profile
              </Link>

              {isSuperAdmin && (
                <>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Settings size={16} />
                    Company Settings
                  </Link>
                  <Link
                    to="/users"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <UserCog size={16} />
                    User Management
                  </Link>
                </>
              )}

              <Link
                to="/activity"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Activity size={16} />
                Activity Log
              </Link>

              <div className="border-t mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header