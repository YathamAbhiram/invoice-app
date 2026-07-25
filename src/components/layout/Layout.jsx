import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import useStore from '../../lib/store'

const Layout = () => {
  const { sidebarOpen } = useStore()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Pages where bottom nav should be hidden
  const hideBottomNav = ['/login']
  const showBottomNav = !hideBottomNav.includes(location.pathname) && isMobile

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className={`
          flex-1 transition-all duration-300
          min-h-[calc(100vh-4rem)]
          ${sidebarOpen ? 'md:ml-0' : 'md:ml-0'}
          ${showBottomNav ? 'pb-20' : 'pb-4'}
        `}>
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export default Layout