import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  Package,
  User,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CustomerDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (id) {
      loadCustomerData()
    } else {
      toast.error('No customer ID provided')
      navigate('/customers')
    }
  }, [id])

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      console.log('📥 Loading customer with ID:', id)

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) {
        console.error('❌ Error fetching customer:', customerError)
        toast.error('Failed to load customer: ' + customerError.message)
        navigate('/customers')
        return
      }

      if (!customerData) {
        toast.error('Customer not found')
        navigate('/customers')
        return
      }

      console.log('✅ Customer data loaded:', customerData)

      // Fetch invoices for this customer
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (invoicesError) {
        console.error('❌ Error fetching invoices:', invoicesError)
        toast.error('Failed to load invoice history')
      } else {
        console.log('✅ Invoices loaded:', invoicesData)
        setInvoices(invoicesData || [])
        
        // Calculate total purchases from invoice history
        const totalPurchases = (invoicesData || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        
        // Get the last purchase date
        let lastPurchase = null
        if (invoicesData && invoicesData.length > 0) {
          // Sort by created_at and get the latest
          const sorted = [...invoicesData].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )
          lastPurchase = sorted[0]?.created_at?.split('T')[0] || null
        }
        
        // Update the customer record with correct totals from invoice history
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            total_purchases: totalPurchases,
            last_purchase: lastPurchase
          })
          .eq('id', customerData.id)
        
        if (updateError) {
          console.error('❌ Error updating customer totals:', updateError)
        } else {
          console.log('✅ Customer totals updated from invoice history:', { totalPurchases, lastPurchase })
          // Update the displayed customer data
          customerData.total_purchases = totalPurchases
          customerData.last_purchase = lastPurchase
        }
      }

      setCustomer(customerData)

    } catch (error) {
      console.error('❌ Error loading customer data:', error)
      toast.error('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm"
      >
        <ArrowLeft size={16} />
        Back to Customers
      </Button>

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User size={20} className="md:w-6 md:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-xl font-bold truncate">{customer.name || 'Unknown'}</div>
                <div className="text-xs md:text-sm font-normal text-muted-foreground truncate">
                  {customer.company || 'No company'}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone size={16} className="md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-muted-foreground">Mobile</div>
                  <div className="text-sm md:text-base font-medium truncate">{customer.mobile || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail size={16} className="md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-muted-foreground">Email</div>
                  <div className="text-sm md:text-base font-medium truncate">{customer.email || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg sm:col-span-2">
                <MapPin size={16} className="md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-muted-foreground">Address</div>
                  <div className="text-sm md:text-base font-medium truncate">{customer.address || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg sm:col-span-2">
                <FileText size={16} className="md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] md:text-xs text-muted-foreground">GSTIN</div>
                  <div className="text-sm md:text-base font-mono truncate">{customer.gstin || 'N/A'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">Total Purchases</span>
                <span className="font-bold text-base md:text-lg text-primary">
                  ₹{(customer.total_purchases || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">Total Invoices</span>
                <span className="font-bold text-base md:text-lg">{invoices.length}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs md:text-sm text-muted-foreground">Last Purchase</span>
                <span className="text-sm md:text-base font-medium">{customer.last_purchase || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm text-muted-foreground">Customer Since</span>
                <span className="text-sm md:text-base font-medium">
                  {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText size={18} className="md:w-5 md:h-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {invoices.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
              No invoices found for this customer
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <Package size={16} className="md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-sm md:text-base font-medium">{invoice.invoice_no}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                    <span className="font-semibold text-sm md:text-base">₹{invoice.total_amount?.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      invoice.status === 'unpaid' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <Link to={`/invoices/edit/${invoice.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 md:h-9 md:text-sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerDetails