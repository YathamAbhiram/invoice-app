import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Clock,
  Download,
  RefreshCw,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getActivityLogs } from '../services/database'

const ActivityLog = () => {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const { data, error } = await getActivityLogs()
      
      if (error) throw error
      
      setActivities(data || [])
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const uniqueUsers = [...new Set(activities.map(a => a.user_name || 'System'))]

  const getActionIcon = (action) => {
    const icons = {
      created: Plus,
      updated: Edit,
      deleted: Trash2,
      marked_paid: CheckCircle,
      added_customer: User
    }
    return icons[action] || FileText
  }

  const getActionColor = (action) => {
    const colors = {
      created: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
      updated: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400',
      deleted: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
      marked_paid: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
      added_customer: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400'
    }
    return colors[action] || 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
  }

  const getActionLabel = (action) => {
    const labels = {
      created: 'Created Invoice',
      updated: 'Updated Invoice',
      deleted: 'Deleted Invoice',
      marked_paid: 'Marked Paid',
      added_customer: 'Added Customer'
    }
    return labels[action] || action
  }

  const filteredActivities = activities.filter(activity => {
    const search = searchTerm.toLowerCase()
    const searchMatch = 
      (activity.user_name || '').toLowerCase().includes(search) ||
      (activity.details || '').toLowerCase().includes(search) ||
      (activity.invoice_no || '').toLowerCase().includes(search)
    
    const actionMatch = actionFilter === 'all' || activity.action === actionFilter
    const userMatch = userFilter === 'all' || (activity.user_name || 'System') === userFilter
    
    return searchMatch && actionMatch && userMatch
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)

  const handleRefresh = () => {
    setLoading(true)
    loadActivities()
  }

  const handleExport = () => {
    const headers = ['User', 'Action', 'Invoice No', 'Details', 'Timestamp']
    const csvData = filteredActivities.map(a => [
      a.user_name || 'System',
      getActionLabel(a.action),
      a.invoice_no || '',
      a.details || '',
      new Date(a.created_at).toLocaleString()
    ])
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Activity log exported successfully!')
  }

  // Mobile card view
  const renderMobileCard = (activity) => {
    const Icon = getActionIcon(activity.action)
    const colorClass = getActionColor(activity.action)
    const label = getActionLabel(activity.action)

    return (
      <div key={activity.id} className="border rounded-lg p-3 mb-3 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-semibold text-sm">{activity.user_name || 'System'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${colorClass}`}>
                {label}
              </span>
            </div>
            {activity.invoice_no && (
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded inline-block mt-1">
                {activity.invoice_no}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
              <Clock size={12} />
              <span>{new Date(activity.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading activity log...</div>
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">Track all user actions in the system</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by user, invoice, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Mobile: Show/Hide Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:hidden"
            >
              <Filter size={16} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row gap-3 ${showFilters ? 'block' : 'hidden md:flex'}`}>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
                <option value="marked_paid">Marked Paid</option>
                <option value="added_customer">Added Customer</option>
              </select>

              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List - Mobile Card View / Desktop List View */}
      {isMobile ? (
        // Mobile Card View
        <div className="space-y-2">
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found
            </div>
          ) : (
            currentItems.map(renderMobileCard)
          )}
        </div>
      ) : (
        // Desktop List View
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {currentItems.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No activities found
                </div>
              ) : (
                currentItems.map((activity) => {
                  const Icon = getActionIcon(activity.action)
                  const colorClass = getActionColor(activity.action)
                  const label = getActionLabel(activity.action)

                  return (
                    <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold">{activity.user_name || 'System'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                              {label}
                            </span>
                            {activity.invoice_no && (
                              <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                {activity.invoice_no}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredActivities.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredActivities.length)} of {filteredActivities.length} activities
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-sm"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="text-sm"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLog