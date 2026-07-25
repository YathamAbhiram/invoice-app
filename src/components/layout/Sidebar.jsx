import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Activity, 
  Settings, 
  UserCog,
  User,
  LogOut,
  X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import useStore from '../../lib/store'
import { useState, useEffect } from 'react'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const { sidebarOpen, toggleSidebar } = useStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isSuperAdmin = profile?.role === 'super_admin'

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Activity, label: 'Activity Log', path: '/activity' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  if (isSuperAdmin) {
    menuItems.push(
      { icon: Settings, label: 'Company Settings', path: '/settings' },
      { icon: UserCog, label: 'User Management', path: '/users' }
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleCloseSidebar = () => {
    if (isMobile) {
      toggleSidebar()
    }
  }

  // On mobile, hide sidebar completely and use bottom nav
  if (isMobile) {
    return null
  }

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-64 bg-card border-r z-50
      transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static md:z-auto
      flex flex-col pt-16
    `}>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                         (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleCloseSidebar}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-muted text-foreground/70 hover:text-foreground'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className="text-sm truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
              )}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-destructive hover:text-destructive-foreground transition-colors text-foreground/70 hover:text-destructive-foreground"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar