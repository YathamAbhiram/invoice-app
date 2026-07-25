import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Printer, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle,
  Calendar,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { getInvoices, deleteInvoice, updateInvoice, logActivity, updateCustomerStats } from '../services/database'
import InvoicePDF from '../components/InvoicePDF'
import { useAuth } from '../hooks/useAuth'
import { getCompanySettings } from '../services/database'

const InvoiceList = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [companySettings, setCompanySettings] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showFilters, setShowFilters] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)

  useEffect(() => {
    loadData()
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [invoicesRes, settingsRes] = await Promise.all([
        getInvoices(),
        getCompanySettings()
      ])
      
      if (invoicesRes.error) throw invoicesRes.error
      if (settingsRes.error) throw settingsRes.error
      
      setInvoices(invoicesRes.data || [])
      setCompanySettings(settingsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const searchMatch = 
      invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const statusMatch = statusFilter === 'all' || invoice.status === statusFilter
    
    let dateMatch = true
    const today = new Date()
    const invoiceDate = new Date(invoice.created_at)
    
    switch(dateFilter) {
      case 'today':
        dateMatch = invoiceDate.toDateString() === today.toDateString()
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        dateMatch = invoiceDate.toDateString() === yesterday.toDateString()
        break
      case 'this_week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        dateMatch = invoiceDate >= weekStart
        break
      case 'last_week':
        const lastWeekStart = new Date(today)
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        dateMatch = invoiceDate >= lastWeekStart && invoiceDate <= lastWeekEnd
        break
      case 'this_month':
        dateMatch = invoiceDate.getMonth() === today.getMonth() && 
                   invoiceDate.getFullYear() === today.getFullYear()
        break
      case 'last_month':
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        dateMatch = invoiceDate.getMonth() === lastMonth.getMonth() && 
                   invoiceDate.getFullYear() === lastMonth.getFullYear()
        break
      case 'this_year':
        dateMatch = invoiceDate.getFullYear() === today.getFullYear()
        break
      case 'custom':
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom)
          from.setHours(0, 0, 0, 0)
          const to = new Date(customDateTo)
          to.setHours(23, 59, 59, 999)
          dateMatch = invoiceDate >= from && invoiceDate <= to
        } else {
          dateMatch = true
        }
        break
      default:
        dateMatch = true
    }
    
    return searchMatch && statusMatch && dateMatch
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(currentItems.map(inv => inv.id))
    } else {
      setSelectedInvoices([])
    }
  }

  const handleSelectInvoice = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) 
        ? prev.filter(invId => invId !== id)
        : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to delete')
      return
    }
    if (window.confirm(`Delete ${selectedInvoices.length} invoice(s)?`)) {
      try {
        for (const id of selectedInvoices) {
          const invoice = invoices.find(inv => inv.id === id)
          
          // Get customer ID for stats update
          const { data: invoiceData } = await supabase
            .from('invoices')
            .select('customer_id, total_amount')
            .eq('id', id)
            .single()
          
          if (invoice) {
            await logActivity(
              user?.id,
              profile?.name || 'System',
              'deleted',
              id,
              invoice.invoice_no,
              `Deleted invoice #${invoice.invoice_no}`
            )
          }
          
          await deleteInvoice(id)
          
          // Update customer stats (subtract the deleted invoice amount)
          if (invoiceData?.customer_id && invoiceData?.total_amount) {
            await updateCustomerStats(invoiceData.customer_id, -invoiceData.total_amount)
          }
        }
        setInvoices(prev => prev.filter(inv => !selectedInvoices.includes(inv.id)))
        setSelectedInvoices([])
        toast.success(`${selectedInvoices.length} invoice(s) deleted successfully`)
      } catch (error) {
        console.error('Error in bulk delete:', error)
        toast.error('Failed to delete invoices')
      }
    }
  }

  const handleBulkMarkPaid = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to mark as paid')
      return
    }
    
    try {
      for (const id of selectedInvoices) {
        const invoice = invoices.find(inv => inv.id === id)
        await updateInvoice(id, {
          status: 'paid',
          paid_amount: invoice.total_amount,
          due_amount: 0
        })
        if (invoice) {
          await logActivity(
            user?.id,
            profile?.name || 'System',
            'marked_paid',
            id,
            invoice.invoice_no,
            `Marked invoice #${invoice.invoice_no} as paid`
          )
        }
      }
      
      setInvoices(prev => prev.map(inv => 
        selectedInvoices.includes(inv.id) 
          ? { ...inv, status: 'paid', paid_amount: inv.total_amount, due_amount: 0 }
          : inv
      ))
      setSelectedInvoices([])
      toast.success(`${selectedInvoices.length} invoice(s) marked as paid`)
    } catch (error) {
      console.error('Error in bulk mark paid:', error)
      toast.error('Failed to mark invoices as paid')
    }
  }

  const handleBulkExportPDF = () => {
    if (selectedInvoices.length === 0) {
      toast.error('Please select invoices to export')
      return
    }
    toast.success(`Exporting ${selectedInvoices.length} invoice(s) as PDF...`)
  }

  const handleEdit = (id) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (invoice) {
      navigate(`/invoices/edit/${id}`)
    }
  }

  const handlePrint = async (id) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return

    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' })
      
      const invoiceData = {
        invoice_no: invoice.invoice_no,
        po_number: invoice.po_number || '',
        customer: {
          name: invoice.customer_name,
          company: invoice.customer_company,
          address: invoice.customer_address,
          pincode: invoice.customer_pincode,
          mobile: invoice.customer_mobile,
          gstin: invoice.customer_gstin,
          place_of_supply: invoice.customer_place_of_supply
        },
        products: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || [],
        totals: {
          subtotal: invoice.subtotal || 0,
          totalDiscount: invoice.total_discount || 0,
          totalGST: invoice.total_gst || 0,
          grandTotal: invoice.total_amount || 0
        },
        status: invoice.status,
        paid: invoice.paid_amount || 0,
        due: invoice.due_amount || 0,
        created_at: invoice.created_at,
        transport_location: invoice.transport_location || '',
        transport_id: invoice.transport_id || '',
        shipping: invoice.shipping_charges || 0,
        handling: invoice.handling_charges || 0
      }

      const blob = await pdf(<InvoicePDF invoiceData={invoiceData} companySettings={companySettings} />).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoice_no}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`Invoice #${invoice.invoice_no} downloaded!`, { id: 'pdf-gen' })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF', { id: 'pdf-gen' })
    }
  }

  const handleDelete = async (id) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return
    
    if (window.confirm(`Are you sure you want to delete invoice #${invoice.invoice_no}? This action cannot be undone.`)) {
      try {
        // Get customer ID for stats update
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('customer_id, total_amount')
          .eq('id', id)
          .single()
        
        await logActivity(
          user?.id,
          profile?.name || 'System',
          'deleted',
          id,
          invoice.invoice_no,
          `Deleted invoice #${invoice.invoice_no}`
        )
        
        const { error } = await deleteInvoice(id)
        if (error) {
          console.error('Delete error:', error)
          toast.error('Failed to delete invoice: ' + error.message)
          return
        }
        
        // Update customer stats (subtract the deleted invoice amount)
        if (invoiceData?.customer_id && invoiceData?.total_amount) {
          await updateCustomerStats(invoiceData.customer_id, -invoiceData.total_amount)
        }
        
        setInvoices(prev => prev.filter(inv => inv.id !== id))
        toast.success(`Invoice #${invoice.invoice_no} deleted successfully`)
        setSelectedInvoices(prev => prev.filter(selectedId => selectedId !== id))
      } catch (error) {
        console.error('Error deleting invoice:', error)
        toast.error('Failed to delete invoice')
      }
    }
  }

  const handleMarkPaid = async (id) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return
    
    try {
      const { error } = await updateInvoice(id, {
        status: 'paid',
        paid_amount: invoice.total_amount,
        due_amount: 0
      })
      
      if (error) throw error
      
      await logActivity(
        user?.id,
        profile?.name || 'System',
        'marked_paid',
        id,
        invoice.invoice_no,
        `Marked invoice #${invoice.invoice_no} as paid`
      )
      
      setInvoices(prev => prev.map(inv => 
        inv.id === id 
          ? { ...inv, status: 'paid', paid_amount: inv.total_amount, due_amount: 0 }
          : inv
      ))
      toast.success(`Invoice #${invoice.invoice_no} marked as paid`)
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      toast.error('Failed to mark invoice as paid')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return
    
    let paidAmount = invoice.paid_amount || 0
    let dueAmount = invoice.due_amount || invoice.total_amount
    
    if (newStatus === 'paid') {
      paidAmount = invoice.total_amount
      dueAmount = 0
    } else if (newStatus === 'unpaid') {
      paidAmount = 0
      dueAmount = invoice.total_amount
    } else if (newStatus === 'pending') {
      if (paidAmount === 0 || paidAmount === invoice.total_amount) {
        paidAmount = Math.round(invoice.total_amount / 2)
        dueAmount = invoice.total_amount - paidAmount
      }
    }
    
    try {
      const { error } = await updateInvoice(id, {
        status: newStatus,
        paid_amount: paidAmount,
        due_amount: dueAmount
      })
      
      if (error) throw error
      
      await logActivity(
        user?.id,
        profile?.name || 'System',
        'updated',
        id,
        invoice.invoice_no,
        `Changed invoice #${invoice.invoice_no} status to ${newStatus}`
      )
      
      setInvoices(prev => prev.map(inv => 
        inv.id === id 
          ? { ...inv, status: newStatus, paid_amount: paidAmount, due_amount: dueAmount }
          : inv
      ))
      toast.success(`Invoice #${invoice.invoice_no} status changed to ${newStatus}`)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast.error('Failed to update invoice status')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
    const labels = {
      paid: '✅ Paid',
      unpaid: '❌ Unpaid',
      pending: '⏳ Pending'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  }

  // Mobile card view
  const renderMobileCard = (invoice) => {
    return (
      <div key={invoice.id} className="border rounded-lg p-4 mb-3 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedInvoices.includes(invoice.id)}
                onChange={() => handleSelectInvoice(invoice.id)}
                className="rounded border-gray-300 flex-shrink-0"
              />
              <span className="font-medium text-sm truncate">{invoice.invoice_no}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">{invoice.customer_name}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => handleEdit(invoice.id)}
              className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
              title="Edit"
            >
              <Edit size={16} className="text-yellow-600" />
            </button>
            <button
              onClick={() => handlePrint(invoice.id)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Print"
            >
              <Printer size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => handleDelete(invoice.id)}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Date</span>
            <p className="font-medium">
              {new Date(invoice.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Items</span>
            <p className="font-medium text-center">
              {invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items).length : invoice.items.length) : 0}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Amount</span>
            <p className="font-bold text-primary">₹{invoice.total_amount?.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Status</span>
            <div>
              <select
                value={invoice.status}
                onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary w-full ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  invoice.status === 'unpaid' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                <option value="paid">✅ Paid</option>
                <option value="unpaid">❌ Unpaid</option>
                <option value="pending">⏳ Pending</option>
              </select>
            </div>
          </div>
        </div>

        {invoice.status !== 'paid' && invoice.due_amount > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Due Amount</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                ₹{invoice.due_amount?.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading invoices...</div>
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage all your invoices</p>
        </div>
        <Link to="/invoices/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2 text-sm">
            <Plus size={16} />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            
            {/* Mobile: Expandable Filter Sections */}
            {isMobile ? (
              // Mobile View - Accordion Style Filters
              <div className="flex flex-col gap-2">
                {/* Status Filter Toggle */}
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="flex items-center justify-between w-full p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Filter size={16} />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                  </span>
                  {showStatusFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showStatusFilter && (
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">✅ Paid</option>
                      <option value="unpaid">❌ Unpaid</option>
                      <option value="pending">⏳ Pending</option>
                    </select>
                  </div>
                )}

                {/* Date Filter Toggle */}
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center justify-between w-full p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    Date: {dateFilter === 'all' ? 'All Time' : dateFilter.replace('_', ' ')}
                  </span>
                  {showDateFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showDateFilter && (
                  <div className="p-2 bg-muted/30 rounded-lg space-y-2">
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value)
                        if (e.target.value === 'custom') {
                          setShowCustomDate(true)
                        } else {
                          setShowCustomDate(false)
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="this_week">This Week</option>
                      <option value="last_week">Last Week</option>
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="this_year">This Year</option>
                      <option value="custom">Custom Date</option>
                    </select>

                    {/* Custom Date Range */}
                    {showCustomDate && (
                      <div className="space-y-2 mt-2 p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium w-8">From:</span>
                          <Input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => {
                              setCustomDateFrom(e.target.value)
                              setDateFilter('custom')
                            }}
                            className="flex-1 text-sm h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium w-8">To:</span>
                          <Input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => {
                              setCustomDateTo(e.target.value)
                              setDateFilter('custom')
                            }}
                            className="flex-1 text-sm h-8"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomDateFrom('')
                            setCustomDateTo('')
                            setShowCustomDate(false)
                            setDateFilter('all')
                          }}
                          className="w-full text-xs h-7"
                        >
                          <X size={14} className="mr-1" />
                          Clear Dates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Desktop View - Horizontal Filters
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="paid">✅ Paid</option>
                  <option value="unpaid">❌ Unpaid</option>
                  <option value="pending">⏳ Pending</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    if (e.target.value === 'custom') {
                      setShowCustomDate(true)
                    } else {
                      setShowCustomDate(false)
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Date</option>
                </select>

                <Button variant="outline" className="flex items-center gap-2 text-sm">
                  <Filter size={16} />
                  More Filters
                </Button>
              </div>
            )}

            {/* Custom Date Range - Desktop */}
            {!isMobile && showCustomDate && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">From:</span>
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value)
                      setDateFilter('custom')
                    }}
                    className="w-full sm:w-auto text-sm h-9"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium whitespace-nowrap">To:</span>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => {
                      setCustomDateTo(e.target.value)
                      setDateFilter('custom')
                    }}
                    className="w-full sm:w-auto text-sm h-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomDateFrom('')
                    setCustomDateTo('')
                    setShowCustomDate(false)
                    setDateFilter('all')
                  }}
                  className="text-sm h-9"
                >
                  <X size={16} />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="text-xs font-medium mr-1">{selectedInvoices.length} selected</span>
              <Button onClick={handleBulkMarkPaid} size="sm" variant="outline" className="flex items-center gap-1 text-xs">
                <CheckCircle size={14} />
                Mark Paid
              </Button>
              <Button onClick={handleBulkExportPDF} size="sm" variant="outline" className="flex items-center gap-1 text-xs">
                <Download size={14} />
                Export PDF
              </Button>
              <Button onClick={handleBulkDelete} size="sm" variant="destructive" className="flex items-center gap-1 text-xs">
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice List - Mobile Card View / Desktop Table View */}
      {isMobile ? (
        // Mobile Card View
        <div className="space-y-2">
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
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
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedInvoices.length === currentItems.length && currentItems.length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Invoice No</th>
                  <th className="p-3 text-left text-sm font-medium">Customer</th>
                  <th className="p-3 text-left text-sm font-medium">Date & Time</th>
                  <th className="p-3 text-left text-sm font-medium">Items</th>
                  <th className="p-3 text-left text-sm font-medium">Total</th>
                  <th className="p-3 text-left text-sm font-medium">Paid</th>
                  <th className="p-3 text-left text-sm font-medium">Due</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Created By</th>
                  <th className="p-3 text-left text-sm font-medium">Edit</th>
                  <th className="p-3 text-left text-sm font-medium">Print</th>
                  <th className="p-3 text-left text-sm font-medium">Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="p-6 text-center text-muted-foreground">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((invoice) => (
                    <tr key={invoice.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3 font-medium">{invoice.invoice_no}</td>
                      <td className="p-3">{invoice.customer_name}</td>
                      <td className="p-3 text-sm">
                        <div>{new Date(invoice.created_at).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items).length : invoice.items.length) : 0}
                      </td>
                      <td className="p-3 font-semibold">₹{invoice.total_amount?.toLocaleString()}</td>
                      <td className="p-3">₹{invoice.paid_amount?.toLocaleString()}</td>
                      <td className="p-3">₹{invoice.due_amount?.toLocaleString()}</td>
                      <td className="p-3">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            invoice.status === 'unpaid' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          <option value="paid">✅ Paid</option>
                          <option value="unpaid">❌ Unpaid</option>
                          <option value="pending">⏳ Pending</option>
                        </select>
                      </td>
                      <td className="p-3 text-sm">{invoice.created_by_name || 'System'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(invoice.id)}
                          className="p-1.5 hover:bg-yellow-100 rounded transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handlePrint(invoice.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={16} className="text-gray-600" />
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
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
      {filteredInvoices.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInvoices.length)} of {filteredInvoices.length} invoices
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

export default InvoiceList