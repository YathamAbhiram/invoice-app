import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  Plus,
  Trash2,
  Save,
  Printer,
  X,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { updateInvoice, getCompanySettings, logActivity, updateCustomerStats } from '../services/database'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import InvoicePDF from '../components/InvoicePDF'

const EditInvoice = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companySettings, setCompanySettings] = useState(null)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [originalInvoice, setOriginalInvoice] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showCustomerDetails, setShowCustomerDetails] = useState(true)
  const [showProducts, setShowProducts] = useState(true)
  const [showTotals, setShowTotals] = useState(true)
  const [poNumber, setPoNumber] = useState('')

  // Customer fields
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerPincode, setCustomerPincode] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')
  const [customerPlaceOfSupply, setCustomerPlaceOfSupply] = useState('')
  const [transportLocation, setTransportLocation] = useState('')

  const [products, setProducts] = useState([])
  const [transportCharges, setTransportCharges] = useState({
    enabled: false,
    name: '',
    quantity: 1,
    unit: 'NOS',
    price: 0,
    discount: 0,
    gst: 18,
    total: 0
  })
  const [additionalCharges, setAdditionalCharges] = useState({
    shipping: 0,
    handling: 0
  })
  const [invoiceStatus, setInvoiceStatus] = useState('unpaid')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (id) {
      loadInvoiceData()
      loadCompanySettings()
    } else {
      toast.error('No invoice ID provided')
      navigate('/invoices')
    }
  }, [id])

  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      console.log('📥 Loading invoice with ID:', id)

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Error fetching invoice:', error)
        toast.error('Failed to load invoice: ' + error.message)
        navigate('/invoices')
        return
      }

      if (!data) {
        console.error('❌ No invoice found with ID:', id)
        toast.error('Invoice not found')
        navigate('/invoices')
        return
      }

      console.log('✅ Invoice data loaded:', data)

      setOriginalInvoice(data)
      setInvoiceNo(data.invoice_no || '')
      setPoNumber(data.po_number || '')

      setCustomerName(data.customer_name || '')
      setCustomerCompany(data.customer_company || '')
      setCustomerAddress(data.customer_address || '')
      setCustomerPincode(data.customer_pincode || '')
      setCustomerMobile(data.customer_mobile || '')
      setCustomerGstin(data.customer_gstin || '')
      setCustomerPlaceOfSupply(data.customer_place_of_supply || '')
      setTransportLocation(data.transport_location || '')

      let items = []
      try {
        items = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || [])
      } catch (e) {
        items = data.items || []
      }

      const regularProducts = items.filter(p => !p.name?.includes('Transport Charges'))

      if (regularProducts.length > 0) {
        setProducts(regularProducts)
      } else {
        setProducts([{ 
          id: 1, 
          name: '', 
          hsn: '',
          quantity: 1, 
          unit: 'NOS', 
          price: 0, 
          discount: 0, 
          gst: 18, 
          total: 0 
        }])
      }

      const transportItem = items.find(p => p.name?.includes('Transport Charges'))
      if (transportItem) {
        setTransportCharges({
          enabled: true,
          name: transportItem.name || '',
          quantity: transportItem.quantity || 1,
          unit: transportItem.unit || 'NOS',
          price: transportItem.price || 0,
          discount: transportItem.discount || 0,
          gst: transportItem.gst || 18,
          total: transportItem.total || 0
        })
        const location = transportItem.name?.replace('Transport Charges - ', '') || ''
        setTransportLocation(location)
      }

      setAdditionalCharges({
        shipping: data.shipping_charges || 0,
        handling: data.handling_charges || 0
      })

      setInvoiceStatus(data.status || 'unpaid')

      console.log('✅ All data set successfully')

    } catch (error) {
      console.error('❌ Error loading invoice:', error)
      toast.error('Failed to load invoice')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await getCompanySettings()
      if (!error && data) {
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
    }
  }

  const calculateProductTotal = (product) => {
    const subtotal = product.quantity * product.price
    const discountAmount = (subtotal * product.discount) / 100
    const gstAmount = ((subtotal - discountAmount) * product.gst) / 100
    return subtotal - discountAmount + gstAmount
  }

  const calculateTransportTotal = () => {
    const subtotal = transportCharges.quantity * transportCharges.price
    const discountAmount = (subtotal * transportCharges.discount) / 100
    const gstAmount = ((subtotal - discountAmount) * transportCharges.gst) / 100
    return subtotal - discountAmount + gstAmount
  }

  const addProduct = () => {
    const newId = products.length + 1
    setProducts([
      ...products,
      {
        id: newId,
        name: '',
        hsn: '',
        quantity: 1,
        unit: 'NOS',
        price: 0,
        discount: 0,
        gst: 18,
        total: 0
      }
    ])
    if (isMobile) {
      setTimeout(() => {
        const lastProduct = document.getElementById(`product-${newId}`)
        if (lastProduct) {
          lastProduct.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  const removeProduct = (id) => {
    if (products.length === 1) {
      toast.error('At least one product is required')
      return
    }
    setProducts(products.filter(p => p.id !== id))
  }

  const updateProduct = (id, field, value) => {
    setProducts(products.map(product => {
      if (product.id === id) {
        const updated = { ...product, [field]: value }
        if (['quantity', 'price', 'discount', 'gst'].includes(field)) {
          updated.total = calculateProductTotal(updated)
        }
        return updated
      }
      return product
    }))
  }

  const updateTransportCharges = (field, value) => {
    setTransportCharges(prev => {
      const updated = { ...prev, [field]: value }
      if (['quantity', 'price', 'discount', 'gst'].includes(field)) {
        const subtotal = updated.quantity * updated.price
        const discountAmount = (subtotal * updated.discount) / 100
        const gstAmount = ((subtotal - discountAmount) * updated.gst) / 100
        updated.total = subtotal - discountAmount + gstAmount
      }
      return updated
    })
  }

  const calculateTotals = () => {
    let totalProductSubtotal = 0
    let totalProductDiscount = 0
    let totalProductGST = 0
    let totalProductFinal = 0

    products.forEach(p => {
      const subtotal = p.quantity * p.price
      const discount = (subtotal * p.discount) / 100
      const gst = ((subtotal - discount) * p.gst) / 100
      const final = subtotal - discount + gst

      totalProductSubtotal += subtotal
      totalProductDiscount += discount
      totalProductGST += gst
      totalProductFinal += final
    })

    let transportSubtotal = 0
    let transportDiscount = 0
    let transportGST = 0
    let transportFinal = 0

    if (transportCharges.enabled && transportCharges.price > 0) {
      const sub = transportCharges.quantity * transportCharges.price
      const disc = (sub * transportCharges.discount) / 100
      const gst = ((sub - disc) * transportCharges.gst) / 100
      const final = sub - disc + gst

      transportSubtotal = sub
      transportDiscount = disc
      transportGST = gst
      transportFinal = final
    }

    const totalSubtotal = totalProductSubtotal + transportSubtotal
    const totalDiscount = totalProductDiscount + transportDiscount
    const totalGST = totalProductGST + transportGST
    const allItemsTotal = totalProductFinal + transportFinal
    const grandTotal = allItemsTotal + additionalCharges.shipping + additionalCharges.handling

    return {
      subtotal: totalSubtotal,
      totalDiscount,
      totalGST,
      productTotal: allItemsTotal,
      grandTotal
    }
  }

  const totals = calculateTotals()

  // Update only (without PDF)
  const handleSaveOnly = async () => {
    if (!customerName) {
      toast.error('Customer name is required')
      return
    }

    try {
      setSaving(true)

      const allProducts = products.map(p => ({
        ...p,
        hsn: p.hsn || ''
      }))
      
      if (transportCharges.enabled && transportCharges.price > 0) {
        allProducts.push({
          id: 'transport',
          name: `Transport Charges - ${transportLocation}`,
          hsn: '',
          quantity: transportCharges.quantity,
          unit: transportCharges.unit,
          price: transportCharges.price,
          discount: transportCharges.discount,
          gst: transportCharges.gst,
          total: transportCharges.total
        })
      }

      let paidAmount = 0
      let dueAmount = totals.grandTotal

      if (invoiceStatus === 'paid') {
        paidAmount = totals.grandTotal
        dueAmount = 0
      } else if (invoiceStatus === 'pending') {
        paidAmount = Math.round(totals.grandTotal / 2)
        dueAmount = totals.grandTotal - paidAmount
      } else if (invoiceStatus === 'unpaid') {
        paidAmount = 0
        dueAmount = totals.grandTotal
      }

      const updateData = {
        customer_name: customerName,
        customer_company: customerCompany,
        customer_address: customerAddress,
        customer_pincode: customerPincode,
        customer_mobile: customerMobile,
        customer_gstin: customerGstin,
        customer_place_of_supply: customerPlaceOfSupply,
        transport_location: transportLocation || '',
        po_number: poNumber || '',
        items: allProducts,
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        total_gst: totals.totalGST,
        shipping_charges: additionalCharges.shipping,
        handling_charges: additionalCharges.handling,
        total_amount: totals.grandTotal,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        status: invoiceStatus
      }

      console.log('📤 Updating invoice with data:', updateData)

      const { data, error } = await updateInvoice(id, updateData)

      if (error) {
        console.error('❌ Update error:', error)
        toast.error('Failed to update invoice: ' + error.message)
        setSaving(false)
        return
      }

      console.log('✅ Invoice updated successfully:', data)

      // Update customer stats if amount changed
      const originalTotal = originalInvoice?.total_amount || 0
      const newTotal = totals.grandTotal
      const difference = newTotal - originalTotal

      if (difference !== 0) {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('customer_id')
          .eq('id', id)
          .single()
        
        if (invoiceData?.customer_id) {
          await updateCustomerStats(invoiceData.customer_id, difference)
        }
      }

      await logActivity(
        user?.id,
        profile?.name || 'System',
        'updated',
        id,
        invoiceNo,
        `Updated invoice #${invoiceNo}`
      )

      toast.success(`Invoice #${invoiceNo} updated successfully!`)
      setSaving(false)
      navigate('/invoices')

    } catch (error) {
      console.error('❌ Error updating invoice:', error)
      toast.error(error.message || 'Failed to update invoice')
      setSaving(false)
    }
  }

  // Update & Print
  const handleSaveAndPrint = async () => {
    if (!customerName) {
      toast.error('Customer name is required')
      return
    }

    try {
      setSaving(true)

      const allProducts = products.map(p => ({
        ...p,
        hsn: p.hsn || ''
      }))
      
      if (transportCharges.enabled && transportCharges.price > 0) {
        allProducts.push({
          id: 'transport',
          name: `Transport Charges - ${transportLocation}`,
          hsn: '',
          quantity: transportCharges.quantity,
          unit: transportCharges.unit,
          price: transportCharges.price,
          discount: transportCharges.discount,
          gst: transportCharges.gst,
          total: transportCharges.total
        })
      }

      let paidAmount = 0
      let dueAmount = totals.grandTotal

      if (invoiceStatus === 'paid') {
        paidAmount = totals.grandTotal
        dueAmount = 0
      } else if (invoiceStatus === 'pending') {
        paidAmount = Math.round(totals.grandTotal / 2)
        dueAmount = totals.grandTotal - paidAmount
      } else if (invoiceStatus === 'unpaid') {
        paidAmount = 0
        dueAmount = totals.grandTotal
      }

      const updateData = {
        customer_name: customerName,
        customer_company: customerCompany,
        customer_address: customerAddress,
        customer_pincode: customerPincode,
        customer_mobile: customerMobile,
        customer_gstin: customerGstin,
        customer_place_of_supply: customerPlaceOfSupply,
        transport_location: transportLocation || '',
        po_number: poNumber || '',
        items: allProducts,
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        total_gst: totals.totalGST,
        shipping_charges: additionalCharges.shipping,
        handling_charges: additionalCharges.handling,
        total_amount: totals.grandTotal,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        status: invoiceStatus
      }

      console.log('📤 Updating invoice with data:', updateData)

      const { data, error } = await updateInvoice(id, updateData)

      if (error) {
        console.error('❌ Update error:', error)
        toast.error('Failed to update invoice: ' + error.message)
        setSaving(false)
        return
      }

      console.log('✅ Invoice updated successfully:', data)

      // Update customer stats if amount changed
      const originalTotal = originalInvoice?.total_amount || 0
      const newTotal = totals.grandTotal
      const difference = newTotal - originalTotal

      if (difference !== 0) {
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('customer_id')
          .eq('id', id)
          .single()
        
        if (invoiceData?.customer_id) {
          await updateCustomerStats(invoiceData.customer_id, difference)
        }
      }

      await logActivity(
        user?.id,
        profile?.name || 'System',
        'updated',
        id,
        invoiceNo,
        `Updated invoice #${invoiceNo}`
      )

      toast.success(`Invoice #${invoiceNo} updated successfully!`)

      // Generate updated PDF
      try {
        const pdfData = {
          invoice_no: invoiceNo,
          po_number: poNumber || '',
          customer: {
            name: customerName,
            company: customerCompany,
            address: customerAddress,
            pincode: customerPincode,
            mobile: customerMobile,
            gstin: customerGstin,
            place_of_supply: customerPlaceOfSupply
          },
          products: allProducts,
          totals: totals,
          status: invoiceStatus,
          paid: paidAmount,
          due: dueAmount,
          created_at: new Date().toISOString(),
          transport_location: transportLocation || '',
          transport_id: '',
          shipping: additionalCharges.shipping,
          handling: additionalCharges.handling
        }

        const blob = await pdf(<InvoicePDF invoiceData={pdfData} companySettings={companySettings} />).toBlob()

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${invoiceNo}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`PDF updated: ${invoiceNo}.pdf`)
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError)
        toast.error('Invoice updated but PDF generation failed')
      }

      setSaving(false)
      navigate('/invoices')

    } catch (error) {
      console.error('❌ Error updating invoice:', error)
      toast.error(error.message || 'Failed to update invoice')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Changes will be lost.')) {
      navigate('/invoices')
    }
  }

  const toggleSection = (section) => {
    if (!isMobile) return
    switch(section) {
      case 'customer':
        setShowCustomerDetails(!showCustomerDetails)
        break
      case 'products':
        setShowProducts(!showProducts)
        break
      case 'totals':
        setShowTotals(!showTotals)
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header with Back button only */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate('/invoices')} className="flex items-center gap-2 p-2 sm:px-4">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Edit Invoice</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Invoice #{invoiceNo}</p>
        </div>
      </div>

      {/* Customer Details - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('customer')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span>Customer Details</span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showCustomerDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showCustomerDetails) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Customer Name</label>
                <Input
                  value={customerName || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed border-gray-200 text-sm"
                  placeholder="No customer name"
                />
                <p className="text-[10px] text-gray-400 mt-1">Customer name cannot be changed</p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Company Name</label>
                <Input
                  value={customerCompany || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed border-gray-200 text-sm"
                  placeholder="No company name"
                />
                <p className="text-[10px] text-gray-400 mt-1">Company name cannot be changed</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Address</label>
                <Input
                  value={customerAddress || ''}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter address"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Pincode</label>
                <Input
                  value={customerPincode || ''}
                  onChange={(e) => setCustomerPincode(e.target.value)}
                  placeholder="Enter pincode"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Mobile Number</label>
                <Input
                  value={customerMobile || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed border-gray-200 text-sm"
                  placeholder="No mobile number"
                />
                <p className="text-[10px] text-gray-400 mt-1">Mobile number cannot be changed</p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">GST Number</label>
                <Input
                  value={customerGstin || ''}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="Enter GST number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Place of Supply</label>
                <Input
                  value={customerPlaceOfSupply || ''}
                  onChange={(e) => setCustomerPlaceOfSupply(e.target.value)}
                  placeholder="Enter place of supply"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Transport Location</label>
                <Input
                  value={transportLocation || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setTransportLocation(value)
                    if (value.trim() !== '') {
                      setTransportCharges(prev => ({
                        ...prev,
                        enabled: true,
                        name: `Transport Charges - ${value}`
                      }))
                    } else {
                      setTransportCharges(prev => ({
                        ...prev,
                        enabled: false,
                        name: '',
                        quantity: 1,
                        price: 0,
                        discount: 0,
                        gst: 18,
                        total: 0
                      }))
                    }
                  }}
                  placeholder="Enter transport location"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">If entered, transport charges section will appear</p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">P.O. Number</label>
                <Input
                  value={poNumber || ''}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter P.O. number"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Purchase Order number (optional)</p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Invoice Status</label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full h-9 md:h-10 px-3 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="unpaid">❌ Unpaid</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">✅ Paid</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Products - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('products')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Products</CardTitle>
            {isMobile && (
              <span className="text-muted-foreground">
                {showProducts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </div>
        </CardHeader>
        {(!isMobile || showProducts) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="space-y-4">
              {/* Products */}
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  id={`product-${product.id}`}
                  className={`
                    ${isMobile ? 'border-b pb-3 mb-3 last:border-0' : 'grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0'}
                  `}
                >
                  {isMobile ? (
                    // Mobile View - 3 Lines
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Product Name *</label>
                          <Input
                            value={product.name || ''}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">HSN/SAC</label>
                          <Input
                            value={product.hsn || ''}
                            onChange={(e) => updateProduct(product.id, 'hsn', e.target.value)}
                            placeholder="HSN/SAC"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Qty *</label>
                          <Input
                            type="number"
                            value={product.quantity || 0}
                            onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Unit</label>
                          <select
                            value={product.unit || 'NOS'}
                            onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                            className="w-full h-9 px-2 border rounded-md text-sm bg-background"
                          >
                            <option value="NOS">NOS</option>
                            <option value="KGS">KGS</option>
                            <option value="PCS">PCS</option>
                            <option value="LTR">LTR</option>
                            <option value="MTR">MTR</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Price *</label>
                          <Input
                            type="number"
                            value={product.price || 0}
                            onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Disc %</label>
                          <Input
                            type="number"
                            value={product.discount || 0}
                            onChange={(e) => updateProduct(product.id, 'discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">GST %</label>
                          <select
                            value={product.gst || 18}
                            onChange={(e) => updateProduct(product.id, 'gst', parseFloat(e.target.value) || 0)}
                            className="w-full h-9 px-2 border rounded-md text-sm bg-background"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Total</label>
                          <div className="h-9 flex items-center font-semibold text-sm text-primary">
                            ₹{(product.total || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="w-full h-9"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Desktop View - 1 Line
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Product Name *</label>
                        <Input
                          value={product.name || ''}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          placeholder="Product name"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">HSN/SAC</label>
                        <Input
                          value={product.hsn || ''}
                          onChange={(e) => updateProduct(product.id, 'hsn', e.target.value)}
                          placeholder="HSN/SAC"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Qty *</label>
                        <Input
                          type="number"
                          value={product.quantity || 0}
                          onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Unit</label>
                        <select
                          value={product.unit || 'NOS'}
                          onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                          className="w-full h-10 px-2 border rounded-md text-sm"
                        >
                          <option value="NOS">NOS</option>
                          <option value="KGS">KGS</option>
                          <option value="PCS">PCS</option>
                          <option value="LTR">LTR</option>
                          <option value="MTR">MTR</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Price *</label>
                        <Input
                          type="number"
                          value={product.price || 0}
                          onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Disc %</label>
                        <Input
                          type="number"
                          value={product.discount || 0}
                          onChange={(e) => updateProduct(product.id, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">GST %</label>
                        <select
                          value={product.gst || 18}
                          onChange={(e) => updateProduct(product.id, 'gst', parseFloat(e.target.value) || 0)}
                          className="w-full h-10 px-2 border rounded-md text-sm"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Total</label>
                        <div className="h-10 flex items-center font-semibold text-lg">
                          ₹{(product.total || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="w-full"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add Product button at the bottom */}
              <Button 
                onClick={addProduct} 
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-dashed h-10 text-sm"
              >
                <Plus size={16} />
                Add Product
              </Button>

              {/* Transport Charges */}
              {transportCharges.enabled && (
                <div className={`
                  ${isMobile ? 'border-t pt-3 mt-3' : 'border-t pt-4 mt-4'}
                `}>
                  <h4 className={`
                    font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-primary mb-${isMobile ? '2' : '3'}
                  `}>
                    Transport Charges - {transportLocation}
                  </h4>
                  
                  {isMobile ? (
                    // Mobile View - 3 Lines
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Description</label>
                          <Input
                            value={`Transport Charges - ${transportLocation}`}
                            disabled
                            className="bg-muted text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">HSN/SAC</label>
                          <Input
                            value=""
                            disabled
                            className="bg-muted text-sm h-9"
                            placeholder="N/A"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Qty</label>
                          <Input
                            type="number"
                            value={transportCharges.quantity || 1}
                            onChange={(e) => updateTransportCharges('quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Unit</label>
                          <select
                            value={transportCharges.unit || 'NOS'}
                            onChange={(e) => updateTransportCharges('unit', e.target.value)}
                            className="w-full h-9 px-2 border rounded-md text-sm bg-background"
                          >
                            <option value="NOS">NOS</option>
                            <option value="KGS">KGS</option>
                            <option value="PCS">PCS</option>
                            <option value="LTR">LTR</option>
                            <option value="MTR">MTR</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Price</label>
                          <Input
                            type="number"
                            value={transportCharges.price || 0}
                            onChange={(e) => updateTransportCharges('price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Disc %</label>
                          <Input
                            type="number"
                            value={transportCharges.discount || 0}
                            onChange={(e) => updateTransportCharges('discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">GST %</label>
                          <select
                            value={transportCharges.gst || 18}
                            onChange={(e) => updateTransportCharges('gst', parseFloat(e.target.value) || 0)}
                            className="w-full h-9 px-2 border rounded-md text-sm bg-background"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Total</label>
                          <div className="h-9 flex items-center font-semibold text-sm text-primary">
                            ₹{(transportCharges.total || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTransportCharges(prev => ({
                                ...prev,
                                enabled: false,
                                name: '',
                                quantity: 1,
                                price: 0,
                                discount: 0,
                                gst: 18,
                                total: 0
                              }))
                              setTransportLocation('')
                            }}
                            className="w-full h-9 text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Desktop View - 1 Line
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <Input
                          value={`Transport Charges - ${transportLocation}`}
                          disabled
                          className="bg-muted"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">HSN/SAC</label>
                        <Input
                          value=""
                          disabled
                          className="bg-muted"
                          size="sm"
                          placeholder="N/A"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Qty</label>
                        <Input
                          type="number"
                          value={transportCharges.quantity || 1}
                          onChange={(e) => updateTransportCharges('quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Unit</label>
                        <select
                          value={transportCharges.unit || 'NOS'}
                          onChange={(e) => updateTransportCharges('unit', e.target.value)}
                          className="w-full h-10 px-2 border rounded-md text-sm"
                        >
                          <option value="NOS">NOS</option>
                          <option value="KGS">KGS</option>
                          <option value="PCS">PCS</option>
                          <option value="LTR">LTR</option>
                          <option value="MTR">MTR</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Price</label>
                        <Input
                          type="number"
                          value={transportCharges.price || 0}
                          onChange={(e) => updateTransportCharges('price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Disc %</label>
                        <Input
                          type="number"
                          value={transportCharges.discount || 0}
                          onChange={(e) => updateTransportCharges('discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">GST %</label>
                        <select
                          value={transportCharges.gst || 18}
                          onChange={(e) => updateTransportCharges('gst', parseFloat(e.target.value) || 0)}
                          className="w-full h-10 px-2 border rounded-md text-sm"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Total</label>
                        <div className="h-10 flex items-center font-semibold text-lg text-primary">
                          ₹{(transportCharges.total || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTransportCharges(prev => ({
                              ...prev,
                              enabled: false,
                              name: '',
                              quantity: 1,
                              price: 0,
                              discount: 0,
                              gst: 18,
                              total: 0
                            }))
                            setTransportLocation('')
                          }}
                          className="w-full text-red-500"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Totals - Collapsible on Mobile */}
              <div className={`${isMobile ? 'border-t pt-4 mt-4' : 'mt-6 space-y-2 border-t pt-4'}`}>
                {isMobile && (
                  <button
                    onClick={() => toggleSection('totals')}
                    className="flex items-center justify-between w-full text-left font-medium text-sm mb-3"
                  >
                    <span>Totals</span>
                    {showTotals ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                )}
                {(!isMobile || showTotals) && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">₹{(totals.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Total Discount:</span>
                      <span className="font-medium text-green-600">-₹{(totals.totalDiscount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Total GST:</span>
                      <span className="font-medium">₹{(totals.totalGST || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <Input
                        type="number"
                        value={additionalCharges.shipping || 0}
                        onChange={(e) => setAdditionalCharges({
                          ...additionalCharges,
                          shipping: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 md:w-32 h-8 md:h-10 text-sm"
                        min="0"
                        step="10"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Handling:</span>
                      <Input
                        type="number"
                        value={additionalCharges.handling || 0}
                        onChange={(e) => setAdditionalCharges({
                          ...additionalCharges,
                          handling: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 md:w-32 h-8 md:h-10 text-sm"
                        min="0"
                        step="10"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-4 border-t-2 pt-2 mt-2">
                      <span className="text-base md:text-lg font-bold">Grand Total:</span>
                      <span className="text-lg md:text-2xl font-bold text-primary">₹{(totals.grandTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bottom Actions - Cancel, Update, Update & Print in one line */}
      <div className="flex flex-wrap gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur p-3 border-t md:static md:bg-transparent md:p-0 md:border-0">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleCancel} className="flex-1 text-sm">
            Cancel
          </Button>
          <Button onClick={handleSaveOnly} disabled={saving} className="flex-1 text-sm">
            <Save size={16} className="mr-1" />
            {saving ? 'Updating...' : 'Update'}
          </Button>
          <Button onClick={handleSaveAndPrint} disabled={saving} className="flex-1 text-sm">
            <Save size={16} className="mr-1" />
            <Printer size={16} className="mr-1" />
            {saving ? 'Updating...' : 'Update & Print'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditInvoice