import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  FileText,
  Users,
  Activity,
  PlusCircle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Bottom nav items - clean and simple (Settings & Users removed - in header dropdown)
  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      icon: FileText,
      label: 'Invoices',
      path: '/invoices',
      active: location.pathname === '/invoices' || location.pathname.startsWith('/invoices/')
    },
    {
      icon: PlusCircle,
      label: 'New',
      path: '/invoices/new',
      active: location.pathname === '/invoices/new',
      isPrimary: true
    },
    {
      icon: Users,
      label: 'Customers',
      path: '/customers',
      active: location.pathname === '/customers' || location.pathname.startsWith('/customers/')
    },
    {
      icon: Activity,
      label: 'Activity',
      path: '/activity',
      active: location.pathname === '/activity'
    }
  ]

  const handleNavClick = (path) => {
    navigate(path)
  }

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      bg-background/95 backdrop-blur-lg border-t
      transition-transform duration-300 ease-in-out
      md:hidden
      bottom-nav-safe
      ${isVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = item.active

          if (item.isPrimary) {
            return (
              <button
                key={index}
                onClick={() => handleNavClick(item.path)}
                className={`
                  relative -mt-6 flex items-center justify-center flex-shrink-0
                  w-14 h-14 rounded-full
                  bg-primary text-primary-foreground
                  shadow-lg shadow-primary/30
                  hover:shadow-primary/50 hover:scale-105
                  active:scale-95
                  transition-all duration-200
                `}
              >
                <Icon size={24} strokeWidth={2.5} />
                <span className="sr-only">{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={index}
              onClick={() => handleNavClick(item.path)}
              className={`
                flex flex-col items-center justify-center flex-shrink-0
                px-1.5 py-1 min-w-[56px]
                rounded-lg transition-all duration-200
                ${isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon 
                size={22} 
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={`
                text-[10px] font-medium mt-0.5 whitespace-nowrap
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
              `}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNav