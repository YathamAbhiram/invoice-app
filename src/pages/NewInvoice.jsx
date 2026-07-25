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
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getPreviewInvoiceNumber, getNextInvoiceNumberOnSave } from '../lib/invoiceUtils'
import { 
  findOrCreateCustomer, 
  createInvoice, 
  getCompanySettings, 
  logActivity,
  updateCustomerStats 
} from '../services/database'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import InvoicePDF from '../components/InvoicePDF'

const NewInvoice = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState('unpaid')
  const [poNumber, setPoNumber] = useState('')
  const [companySettings, setCompanySettings] = useState(null)
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showCustomerDetails, setShowCustomerDetails] = useState(true)
  const [showProducts, setShowProducts] = useState(true)
  const [showTotals, setShowTotals] = useState(true)
  
  const [customer, setCustomer] = useState({
    name: '',
    company: '',
    address: '',
    pincode: '',
    mobile: '',
    gstin: '',
    place_of_supply: '',
    transport_location: ''
  })

  const [products, setProducts] = useState([
    {
      id: 1,
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    previewNewInvoiceNumber()
    loadCompanySettings()
  }, [])

  const previewNewInvoiceNumber = async () => {
    try {
      setIsGeneratingNumber(true)
      const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
      const number = await getPreviewInvoiceNumber(prefix)
      setInvoiceNumber(number)
    } catch (error) {
      console.error('❌ Error previewing invoice number:', error)
      const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      setInvoiceNumber(`${prefix}${year}${month}${random}`)
    } finally {
      setIsGeneratingNumber(false)
    }
  }

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await getCompanySettings()
      if (!error && data) {
        setCompanySettings(data)
        if (data.invoice_prefix) {
          localStorage.setItem('invoice_prefix', data.invoice_prefix)
        }
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

  const handleSaveOnly = async () => {
    setLoading(true)
    
    if (!customer.name) {
      toast.error('Please enter customer name')
      setLoading(false)
      return
    }
    if (!customer.mobile) {
      toast.error('Please enter customer mobile number')
      setLoading(false)
      return
    }
    
    const invalidProduct = products.find(p => !p.name || p.quantity <= 0 || p.price <= 0)
    if (invalidProduct) {
      toast.error('Please fill all product details correctly')
      setLoading(false)
      return
    }

    try {
      const { data: customerData, error: customerError } = await findOrCreateCustomer(customer, user?.id)
      if (customerError) throw customerError
      
      let paidAmount = 0
      let dueAmount = totals.grandTotal
      
      if (invoiceStatus === 'paid') {
        paidAmount = totals.grandTotal
        dueAmount = 0
      } else if (invoiceStatus === 'pending') {
        paidAmount = Math.round(totals.grandTotal / 2)
        dueAmount = totals.grandTotal - paidAmount
      }

      let transportId = ''
      if (customer.transport_location) {
        const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        transportId = `${prefix}${year}${month}TP${random}`
      }

      let transportProduct = null
      if (transportCharges.enabled && transportCharges.price > 0) {
        transportProduct = {
          name: `Transport Charges - ${customer.transport_location}`,
          hsn: '',
          quantity: transportCharges.quantity,
          unit: transportCharges.unit,
          price: transportCharges.price,
          discount: transportCharges.discount,
          gst: transportCharges.gst,
          total: transportCharges.total
        }
      }

      const allProducts = products.map(p => ({
        ...p,
        hsn: p.hsn || ''
      }))
      
      if (transportProduct) {
        allProducts.push(transportProduct)
      }

      const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
      const nextInvoiceNumber = await getNextInvoiceNumberOnSave(prefix)

      const invoiceData = {
        invoice_no: nextInvoiceNumber,
        customer_id: customerData.id,
        customer_name: customer.name,
        customer_company: customer.company || '',
        customer_address: customer.address || '',
        customer_pincode: customer.pincode || '',
        customer_mobile: customer.mobile,
        customer_gstin: customer.gstin || '',
        customer_place_of_supply: customer.place_of_supply || '',
        po_number: poNumber || '',
        transport_location: customer.transport_location || '',
        transport_id: transportId,
        items: allProducts,
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        total_gst: totals.totalGST,
        shipping_charges: additionalCharges.shipping,
        handling_charges: additionalCharges.handling,
        total_amount: totals.grandTotal,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        status: invoiceStatus,
        created_by: user?.id
      }

      const { data: invoiceResult, error: invoiceError } = await createInvoice(invoiceData)
      if (invoiceError) throw invoiceError

      await updateCustomerStats(customerData.id, totals.grandTotal)

      await logActivity(
        user?.id,
        profile?.name || 'System',
        'created',
        invoiceResult.id,
        nextInvoiceNumber,
        `Created new invoice for ${customer.name}`
      )

      toast.success(`Invoice #${nextInvoiceNumber} created successfully!`)
      
      const newPreview = await getPreviewInvoiceNumber(prefix)
      setInvoiceNumber(newPreview)
      
      setLoading(false)
      navigate('/invoices')
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(error.message || 'Failed to create invoice')
      setLoading(false)
    }
  }

  const handleSaveAndPrint = async () => {
    setLoading(true)
    
    if (!customer.name) {
      toast.error('Please enter customer name')
      setLoading(false)
      return
    }
    if (!customer.mobile) {
      toast.error('Please enter customer mobile number')
      setLoading(false)
      return
    }
    
    const invalidProduct = products.find(p => !p.name || p.quantity <= 0 || p.price <= 0)
    if (invalidProduct) {
      toast.error('Please fill all product details correctly')
      setLoading(false)
      return
    }

    try {
      const { data: customerData, error: customerError } = await findOrCreateCustomer(customer, user?.id)
      if (customerError) throw customerError
      
      let paidAmount = 0
      let dueAmount = totals.grandTotal
      
      if (invoiceStatus === 'paid') {
        paidAmount = totals.grandTotal
        dueAmount = 0
      } else if (invoiceStatus === 'pending') {
        paidAmount = Math.round(totals.grandTotal / 2)
        dueAmount = totals.grandTotal - paidAmount
      }

      let transportId = ''
      if (customer.transport_location) {
        const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        transportId = `${prefix}${year}${month}TP${random}`
      }

      let transportProduct = null
      if (transportCharges.enabled && transportCharges.price > 0) {
        transportProduct = {
          name: `Transport Charges - ${customer.transport_location}`,
          hsn: '',
          quantity: transportCharges.quantity,
          unit: transportCharges.unit,
          price: transportCharges.price,
          discount: transportCharges.discount,
          gst: transportCharges.gst,
          total: transportCharges.total
        }
      }

      const allProducts = products.map(p => ({
        ...p,
        hsn: p.hsn || ''
      }))
      
      if (transportProduct) {
        allProducts.push(transportProduct)
      }

      const prefix = localStorage.getItem('invoice_prefix') || 'ANG'
      const nextInvoiceNumber = await getNextInvoiceNumberOnSave(prefix)

      const invoiceData = {
        invoice_no: nextInvoiceNumber,
        customer_id: customerData.id,
        customer_name: customer.name,
        customer_company: customer.company || '',
        customer_address: customer.address || '',
        customer_pincode: customer.pincode || '',
        customer_mobile: customer.mobile,
        customer_gstin: customer.gstin || '',
        customer_place_of_supply: customer.place_of_supply || '',
        po_number: poNumber || '',
        transport_location: customer.transport_location || '',
        transport_id: transportId,
        items: allProducts,
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        total_gst: totals.totalGST,
        shipping_charges: additionalCharges.shipping,
        handling_charges: additionalCharges.handling,
        total_amount: totals.grandTotal,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        status: invoiceStatus,
        created_by: user?.id
      }

      const { data: invoiceResult, error: invoiceError } = await createInvoice(invoiceData)
      if (invoiceError) throw invoiceError

      await updateCustomerStats(customerData.id, totals.grandTotal)

      await logActivity(
        user?.id,
        profile?.name || 'System',
        'created',
        invoiceResult.id,
        nextInvoiceNumber,
        `Created new invoice for ${customer.name}`
      )

      toast.success(`Invoice #${nextInvoiceNumber} created successfully!`)
      
      try {
        const pdfData = {
          invoice_no: nextInvoiceNumber,
          po_number: poNumber || '',
          customer: customer,
          products: allProducts,
          totals: totals,
          status: invoiceStatus,
          paid: paidAmount,
          due: dueAmount,
          created_at: new Date().toISOString(),
          transport_location: customer.transport_location || '',
          transport_id: transportId,
          shipping: additionalCharges.shipping,
          handling: additionalCharges.handling
        }

        const blob = await pdf(<InvoicePDF invoiceData={pdfData} companySettings={companySettings} />).toBlob()
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${nextInvoiceNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success(`PDF downloaded: ${nextInvoiceNumber}.pdf`)
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError)
        toast.error('Invoice saved but PDF generation failed')
      }
      
      const newPreview = await getPreviewInvoiceNumber(prefix)
      setInvoiceNumber(newPreview)
      
      setLoading(false)
      navigate('/invoices')
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(error.message || 'Failed to create invoice')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All data will be lost.')) {
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

  return (
    <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header with Back button only */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2 p-2 sm:px-4">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">New Invoice</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Invoice #{invoiceNumber} 
            {isGeneratingNumber && <span className="text-xs text-muted-foreground ml-1">(generating...)</span>}
          </p>
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
                <label className="block text-xs md:text-sm font-medium mb-1">Customer Name *</label>
                <div className="flex gap-2">
                  <Input
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    placeholder="Enter customer name"
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" className="flex items-center gap-1 flex-shrink-0">
                    <Search size={14} />
                    <span className="hidden sm:inline">Find</span>
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Company Name</label>
                <Input
                  value={customer.company}
                  onChange={(e) => setCustomer({...customer, company: e.target.value})}
                  placeholder="Enter company name"
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Address</label>
                <Input
                  value={customer.address}
                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                  placeholder="Enter address"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Pincode</label>
                <Input
                  value={customer.pincode}
                  onChange={(e) => setCustomer({...customer, pincode: e.target.value})}
                  placeholder="Enter pincode"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Mobile Number *</label>
                <Input
                  value={customer.mobile}
                  onChange={(e) => setCustomer({...customer, mobile: e.target.value})}
                  placeholder="Enter mobile number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">GST Number</label>
                <Input
                  value={customer.gstin}
                  onChange={(e) => setCustomer({...customer, gstin: e.target.value})}
                  placeholder="Enter GST number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Place of Supply</label>
                <Input
                  value={customer.place_of_supply}
                  onChange={(e) => setCustomer({...customer, place_of_supply: e.target.value})}
                  placeholder="Enter place of supply"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Transport Location</label>
                <Input
                  value={customer.transport_location}
                  onChange={(e) => {
                    const value = e.target.value
                    setCustomer({...customer, transport_location: value})
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  If entered, transport charges section will appear
                </p>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">P.O. Number</label>
                <Input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter P.O. number"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Purchase Order number (optional)
                </p>
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
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  id={`product-${product.id}`}
                  className={`
                    ${isMobile ? 'border-b pb-3 mb-3 last:border-0' : 'grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0'}
                  `}
                >
                  {isMobile ? (
                    // Mobile View - 3 Lines (HSN beside Product Name)
                    <>
                      {/* Line 1: Product Name & HSN/SAC (side by side) */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Product Name *</label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">HSN/SAC</label>
                          <Input
                            value={product.hsn}
                            onChange={(e) => updateProduct(product.id, 'hsn', e.target.value)}
                            placeholder="HSN/SAC"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      
                      {/* Line 2: Qty, Unit, Price */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Qty *</label>
                          <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Unit</label>
                          <select
                            value={product.unit}
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
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      
                      {/* Line 3: Discount, GST, Total, Delete */}
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Disc %</label>
                          <Input
                            type="number"
                            value={product.discount}
                            onChange={(e) => updateProduct(product.id, 'discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">GST %</label>
                          <select
                            value={product.gst}
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
                            ₹{product.total.toFixed(2)}
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
                    // Desktop View - 1 Line (HSN included)
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Product Name *</label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          placeholder="Product name"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">HSN/SAC</label>
                        <Input
                          value={product.hsn}
                          onChange={(e) => updateProduct(product.id, 'hsn', e.target.value)}
                          placeholder="HSN/SAC"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Qty *</label>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Unit</label>
                        <select
                          value={product.unit}
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
                          value={product.price}
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
                          value={product.discount}
                          onChange={(e) => updateProduct(product.id, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">GST %</label>
                        <select
                          value={product.gst}
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
                          ₹{product.total.toFixed(2)}
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
                    Transport Charges - {customer.transport_location}
                  </h4>
                  
                  {isMobile ? (
                    // Mobile View - 3 Lines
                    <>
                      {/* Line 1: Description & HSN/SAC (side by side) */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Description</label>
                          <Input
                            value={`Transport Charges - ${customer.transport_location}`}
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
                      
                      {/* Line 2: Qty, Unit, Price */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Qty</label>
                          <Input
                            type="number"
                            value={transportCharges.quantity}
                            onChange={(e) => updateTransportCharges('quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Unit</label>
                          <select
                            value={transportCharges.unit}
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
                            value={transportCharges.price}
                            onChange={(e) => updateTransportCharges('price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      
                      {/* Line 3: Discount, GST, Total, Delete */}
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">Disc %</label>
                          <Input
                            type="number"
                            value={transportCharges.discount}
                            onChange={(e) => updateTransportCharges('discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">GST %</label>
                          <select
                            value={transportCharges.gst}
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
                            ₹{transportCharges.total.toFixed(2)}
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
                              setCustomer({...customer, transport_location: ''})
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
                          value={`Transport Charges - ${customer.transport_location}`}
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
                          value={transportCharges.quantity}
                          onChange={(e) => updateTransportCharges('quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">Unit</label>
                        <select
                          value={transportCharges.unit}
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
                          value={transportCharges.price}
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
                          value={transportCharges.discount}
                          onChange={(e) => updateTransportCharges('discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          size="sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium mb-1">GST %</label>
                        <select
                          value={transportCharges.gst}
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
                          ₹{transportCharges.total.toFixed(2)}
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
                            setCustomer({...customer, transport_location: ''})
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
                      <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Total Discount:</span>
                      <span className="font-medium text-green-600">-₹{totals.totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Total GST:</span>
                      <span className="font-medium">₹{totals.totalGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <Input
                        type="number"
                        value={additionalCharges.shipping}
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
                        value={additionalCharges.handling}
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
                      <span className="text-lg md:text-2xl font-bold text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bottom Actions - Cancel, Save, Save & Print in one line */}
      <div className="flex flex-wrap gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur p-3 border-t md:static md:bg-transparent md:p-0 md:border-0">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleCancel} className="flex-1 text-sm">
            Cancel
          </Button>
          <Button onClick={handleSaveOnly} disabled={loading} className="flex-1 text-sm">
            <Save size={16} className="mr-1" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={handleSaveAndPrint} disabled={loading} className="flex-1 text-sm">
            <Save size={16} className="mr-1" />
            <Printer size={16} className="mr-1" />
            {loading ? 'Saving...' : 'Save & Print'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NewInvoice