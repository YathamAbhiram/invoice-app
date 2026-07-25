import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Download,
  Phone,
  Building,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  MapPin,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const Customers = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      
      // Fetch all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (customersError) throw customersError
      
      if (!customersData || customersData.length === 0) {
        setCustomers([])
        setLoading(false)
        return
      }
      
      // For each customer, calculate total purchases from invoices
      const customerIds = customersData.map(c => c.id)
      
      // Fetch all invoices for these customers
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('customer_id, total_amount, created_at')
        .in('customer_id', customerIds)
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
        setCustomers(customersData)
        setLoading(false)
        return
      }
      
      // Group invoices by customer
      const invoicesByCustomer = {}
      invoicesData?.forEach(inv => {
        if (!invoicesByCustomer[inv.customer_id]) {
          invoicesByCustomer[inv.customer_id] = []
        }
        invoicesByCustomer[inv.customer_id].push(inv)
      })
      
      // Calculate totals for each customer
      const customersWithTotals = customersData.map(customer => {
        const customerInvoices = invoicesByCustomer[customer.id] || []
        const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        
        // Get last purchase date
        let lastPurchase = null
        if (customerInvoices.length > 0) {
          const sorted = [...customerInvoices].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )
          lastPurchase = sorted[0]?.created_at?.split('T')[0] || null
        }
        
        return {
          ...customer,
          total_purchases: totalPurchases,
          last_purchase: lastPurchase
        }
      })
      
      // Update customer records in database with correct totals
      for (const customer of customersWithTotals) {
        await supabase
          .from('customers')
          .update({
            total_purchases: customer.total_purchases,
            last_purchase: customer.last_purchase
          })
          .eq('id', customer.id)
      }
      
      setCustomers(customersWithTotals)
      
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.mobile?.includes(search) ||
      customer.gstin?.toLowerCase().includes(search) ||
      customer.company?.toLowerCase().includes(search)
    )
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)

  const handleViewCustomer = (id) => {
    navigate(`/customers/${id}`)
  }

  const handleEditCustomer = (id) => {
    toast.info('Edit functionality coming soon!')
  }

  const handleDeleteCustomer = async (id) => {
    const customer = customers.find(c => c.id === id)
    if (!customer) return
    
    if (window.confirm(`Delete ${customer.name}? This will also remove all associated data.`)) {
      try {
        // First delete all invoices for this customer
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .eq('customer_id', id)
        
        if (invoicesError) throw invoicesError
        
        // Then delete the customer
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        setCustomers(prev => prev.filter(c => c.id !== id))
        toast.success(`${customer.name} deleted successfully`)
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast.error('Failed to delete customer')
      }
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Company', 'Mobile', 'Email', 'GSTIN', 'Total Purchases', 'Last Purchase']
    const csvData = filteredCustomers.map(c => [
      c.name || '',
      c.company || '',
      c.mobile || '',
      c.email || '',
      c.gstin || '',
      c.total_purchases || 0,
      c.last_purchase || ''
    ])
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Customers exported successfully!')
  }

  // Mobile card view
  const renderMobileCard = (customer) => {
    return (
      <div key={customer.id} className="border rounded-lg p-4 mb-3 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{customer.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground truncate">{customer.company || 'No company'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => handleViewCustomer(customer.id)}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="View Details"
            >
              <Eye size={16} className="text-blue-600" />
            </button>
            <button
              onClick={() => handleEditCustomer(customer.id)}
              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Edit"
            >
              <Edit size={16} className="text-green-600" />
            </button>
            <button
              onClick={() => handleDeleteCustomer(customer.id)}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p className="font-medium text-sm">{customer.mobile || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">GSTIN</span>
            <p className="font-mono text-xs truncate">{customer.gstin || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Purchases</span>
            <p className="font-bold text-primary text-sm">₹{(customer.total_purchases || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Purchase</span>
            <p className="font-medium text-sm">{customer.last_purchase || 'N/A'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage all your customers</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExportCSV} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <UserPlus size={16} />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name, mobile, company, or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List - Mobile Card View / Desktop Table View */}
      {isMobile ? (
        // Mobile Card View
        <div className="space-y-2">
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            currentItems.map(renderMobileCard)
          )}
        </div>
      ) : (
        // Desktop Table View
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">#</th>
                  <th className="p-3 text-left text-sm font-medium">Customer</th>
                  <th className="p-3 text-left text-sm font-medium">Company</th>
                  <th className="p-3 text-left text-sm font-medium">Mobile</th>
                  <th className="p-3 text-left text-sm font-medium">GSTIN</th>
                  <th className="p-3 text-left text-sm font-medium">Total Purchases</th>
                  <th className="p-3 text-left text-sm font-medium">Last Purchase</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-muted-foreground">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((customer, index) => (
                    <tr key={customer.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm text-muted-foreground">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={18} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Building size={14} className="text-muted-foreground" />
                          <span className="text-sm">{customer.company || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-muted-foreground" />
                          <span className="text-sm">{customer.mobile}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {customer.gstin || '-'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-primary">
                        ₹{(customer.total_purchases || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm">{customer.last_purchase || '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewCustomer(customer.id)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer.id)}
                            className="p-1 hover:bg-green-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredCustomers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} customers
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

export default Customers