import { supabase } from '../lib/supabase'


// ============ COMPANY SETTINGS ============
export const getCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()
  
  return { data, error }
}

export const updateCompanySettings = async (settings) => {
  const { data, error } = await supabase
    .from('company_settings')
    .update({
      portal_name: settings.portal_name,
      company_name: settings.company_name,
      tagline: settings.tagline,
      logo: settings.logo,
      address_line1: settings.address_line1,
      address_line2: settings.address_line2,
      address_line3: settings.address_line3,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      gst_number: settings.gst_number,
      invoice_prefix: settings.invoice_prefix,
      bank_name: settings.bank_name,
      bank_branch: settings.bank_branch,
      account_number: settings.account_number,
      ifsc_code: settings.ifsc_code,
      upi_id: settings.upi_id,
      upi_qr: settings.upi_qr,
      signature_image: settings.signature_image,
      signatory_name: settings.signatory_name,
      terms_and_conditions: settings.terms_and_conditions,
      theme_mode: settings.theme_mode,
      primary_color: settings.primary_color,
      secondary_color: settings.secondary_color,
      background_color: settings.background_color,
      updated_at: new Date().toISOString()
    })
    .eq('id', settings.id)
    .select()
    .single()
  
  return { data, error }
}

// ============ CUSTOMERS ============
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getCustomerById = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const getCustomerInvoices = async (customerId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: customerData.name,
      company: customerData.company,
      address: customerData.address,
      pincode: customerData.pincode,
      mobile: customerData.mobile,
      email: customerData.email,
      gstin: customerData.gstin,
      place_of_supply: customerData.place_of_supply,
      created_by: customerData.created_by
    }])
    .select()
    .single()
  
  return { data, error }
}

export const findOrCreateCustomer = async (customerData, userId) => {
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('name', customerData.name)
    .eq('mobile', customerData.mobile)
    .maybeSingle()
  
  if (existing) {
    return { data: existing, error: null }
  }
  
  const { data, error } = await createCustomer({
    ...customerData,
    created_by: userId
  })
  
  return { data, error }
}

export const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      company: customerData.company,
      address: customerData.address,
      pincode: customerData.pincode,
      mobile: customerData.mobile,
      email: customerData.email,
      gstin: customerData.gstin,
      place_of_supply: customerData.place_of_supply,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  return { error }
}




// ============ CUSTOMERS ============
export const updateCustomerStats = async (customerId, amount) => {
  try {
    console.log('📊 updateCustomerStats called with:', { customerId, amount })
    
    if (!customerId) {
      console.error('❌ No customer ID provided')
      return { error: 'No customer ID provided' }
    }
    
    // Get current customer data
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('total_purchases, last_purchase')
      .eq('id', customerId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching customer:', fetchError)
      return { error: fetchError }
    }
    
    if (!customer) {
      console.error('❌ Customer not found:', customerId)
      return { error: 'Customer not found' }
    }
    
    console.log('📊 Current customer data:', customer)
    
    // Calculate new totals
    const currentTotal = customer.total_purchases || 0
    const newTotal = Math.max(0, currentTotal + amount) // Prevent negative
    const today = new Date().toISOString().split('T')[0]
    
    console.log('📊 Updating: currentTotal=', currentTotal, 'newTotal=', newTotal, 'today=', today)
    
    // Update customer
    const { data, error } = await supabase
      .from('customers')
      .update({
        total_purchases: newTotal,
        last_purchase: today
      })
      .eq('id', customerId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating customer stats:', error)
      return { error }
    }
    
    console.log('✅ Customer stats updated successfully:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in updateCustomerStats:', error)
    return { error }
  }
}

// New function to recalculate customer totals from invoices
export const recalculateCustomerTotals = async (customerId) => {
  try {
    // Get all invoices for this customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .eq('customer_id', customerId)
    
    if (invoicesError) {
      console.error('❌ Error fetching invoices for recalculation:', invoicesError)
      return { error: invoicesError }
    }
    
    // Calculate total purchases
    const totalPurchases = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    // Get last purchase date
    let lastPurchase = null
    if (invoices && invoices.length > 0) {
      const sorted = [...invoices].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      lastPurchase = sorted[0]?.created_at?.split('T')[0] || null
    }
    
    // Update customer
    const { data, error } = await supabase
      .from('customers')
      .update({
        total_purchases: totalPurchases,
        last_purchase: lastPurchase
      })
      .eq('id', customerId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating customer totals:', error)
      return { error }
    }
    
    console.log('✅ Customer totals recalculated:', { totalPurchases, lastPurchase })
    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in recalculateCustomerTotals:', error)
    return { error }
  }
}

// ============ INVOICES ============
export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// ============ INVOICES ============
export const getInvoiceById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching invoice by ID:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Error in getInvoiceById:', error)
    return { data: null, error }
  }
}

export const createInvoice = async (invoiceData) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      invoice_no: invoiceData.invoice_no,
      customer_id: invoiceData.customer_id,
      customer_name: invoiceData.customer_name,
      customer_company: invoiceData.customer_company,
      customer_address: invoiceData.customer_address,
      customer_pincode: invoiceData.customer_pincode,
      customer_mobile: invoiceData.customer_mobile,
      customer_gstin: invoiceData.customer_gstin,
      customer_place_of_supply: invoiceData.customer_place_of_supply,
      invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
      challan_no: invoiceData.challan_no,
      transport_location: invoiceData.transport_location,
      transport_id: invoiceData.transport_id,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      total_discount: invoiceData.total_discount,
      total_gst: invoiceData.total_gst,
      shipping_charges: invoiceData.shipping_charges,
      handling_charges: invoiceData.handling_charges,
      total_amount: invoiceData.total_amount,
      paid_amount: invoiceData.paid_amount || 0,
      due_amount: invoiceData.due_amount || invoiceData.total_amount,
      status: invoiceData.status || 'unpaid',
      created_by: invoiceData.created_by
    }])
    .select()
    .single()
  
  return { data, error }
}

export const updateInvoice = async (id, invoiceData) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        customer_name: invoiceData.customer_name,
        customer_company: invoiceData.customer_company,
        customer_address: invoiceData.customer_address,
        customer_pincode: invoiceData.customer_pincode,
        customer_mobile: invoiceData.customer_mobile,
        customer_gstin: invoiceData.customer_gstin,
        customer_place_of_supply: invoiceData.customer_place_of_supply,
        transport_location: invoiceData.transport_location,
        challan_no: invoiceData.challan_no,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        total_discount: invoiceData.total_discount,
        total_gst: invoiceData.total_gst,
        shipping_charges: invoiceData.shipping_charges,
        handling_charges: invoiceData.handling_charges,
        total_amount: invoiceData.total_amount,
        paid_amount: invoiceData.paid_amount,
        due_amount: invoiceData.due_amount,
        status: invoiceData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating invoice:', error)
      return { data: null, error }
    }

    console.log('✅ Invoice updated successfully:', data)
    return { data, error: null }
  } catch (error) {
    console.error('❌ Error in updateInvoice:', error)
    return { data: null, error }
  }
}

// ============ INVOICES ============
export const deleteInvoice = async (id) => {
  try {
    // Get the invoice details before deleting (for preserving invoice_no in logs)
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('invoice_no, customer_name')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching invoice before delete:', fetchError)
      // Continue with deletion even if we can't fetch
    }
    
    // Update activity logs to remove invoice_id reference (set to null)
    // but keep the invoice_no for reference
    const { error: updateLogError } = await supabase
      .from('activity_logs')
      .update({ 
        invoice_id: null
      })
      .eq('invoice_id', id)
    
    if (updateLogError) {
      console.error('❌ Error updating activity logs:', updateLogError)
      // Continue with invoice deletion even if log update fails
    }
    
    // Then delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error deleting invoice:', error)
      return { error }
    }
    
    console.log('✅ Invoice deleted successfully, activity logs preserved:', id)
    return { error: null }
  } catch (error) {
    console.error('❌ Error in deleteInvoice:', error)
    return { error }
  }
}

export const deleteBulkInvoices = async (ids) => {
  try {
    console.log('🗑️ Deleting multiple invoices:', ids)
    
    // Delete activity logs for all invoices
    const { error: logError } = await supabase
      .from('activity_logs')
      .delete()
      .in('invoice_id', ids)
    
    if (logError) {
      console.error('❌ Error deleting activity logs:', logError)
      // Continue with invoice deletion even if log deletion fails
    } else {
      console.log('✅ Activity logs deleted successfully for invoices:', ids)
    }
    
    // Delete all invoices
    const { error } = await supabase
      .from('invoices')
      .delete()
      .in('id', ids)
    
    if (error) {
      console.error('❌ Error deleting invoices:', error)
      return { error }
    }
    
    console.log('✅ Invoices deleted successfully:', ids)
    return { error: null }
  } catch (error) {
    console.error('❌ Error in deleteBulkInvoices:', error)
    return { error }
  }
}

export const getInvoiceStats = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
  
  if (error) return { error }
  
  const total = data.length
  const paid = data.filter(inv => inv.status === 'paid').length
  const unpaid = data.filter(inv => inv.status === 'unpaid').length
  const pending = data.filter(inv => inv.status === 'pending').length
  
  const totalAmount = data.reduce((sum, inv) => sum + inv.total_amount, 0)
  const paidAmount = data.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0)
  const dueAmount = data.reduce((sum, inv) => sum + inv.due_amount, 0)
  
  return {
    data: {
      total,
      paid,
      unpaid,
      pending,
      totalAmount,
      paidAmount,
      dueAmount
    },
    error: null
  }
}

// ============ INVOICE NUMBER SEQUENCE ============

// Get the current sequence WITHOUT incrementing (for preview)
// ============ INVOICE NUMBER SEQUENCE ============

// Get the current sequence WITHOUT incrementing (for preview)
export const getCurrentInvoiceNumber = async (prefix) => {
  try {
    const currentYear = new Date().getFullYear().toString()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    
    console.log('👁️ Getting current sequence for:', { prefix, currentYear, currentMonth })
    
    // FIRST check localStorage for the latest sequence
    const localKey = `invoice_seq_${prefix}_${currentYear}_${currentMonth}`
    const localStored = localStorage.getItem(localKey)
    
    // Try to get existing sequence from Supabase
    let { data: existing, error: selectError } = await supabase
      .from('invoice_sequences')
      .select('*')
      .eq('prefix', prefix)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .maybeSingle()
    
    // Use the highest value from either source
    let lastSeq = 0
    
    if (existing && existing.last_sequence) {
      lastSeq = existing.last_sequence
    }
    
    if (localStored && parseInt(localStored) > lastSeq) {
      lastSeq = parseInt(localStored)
    }
    
    let nextSeq = lastSeq + 1
    
    const invoiceNumber = prefix + currentYear + currentMonth + String(nextSeq).padStart(4, '0')
    
    console.log('👁️ Preview invoice number:', invoiceNumber, 'Sequence:', nextSeq)
    
    return { data: invoiceNumber, error: null }
  } catch (error) {
    console.error('❌ Error in getCurrentInvoiceNumber:', error)
    const currentYear = new Date().getFullYear().toString()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    return getCurrentInvoiceNumberLocal(prefix, currentYear, currentMonth)
  }
}

// Get current sequence from localStorage
const getCurrentInvoiceNumberLocal = (prefix, currentYear, currentMonth) => {
  try {
    const key = `invoice_seq_${prefix}_${currentYear}_${currentMonth}`
    const stored = localStorage.getItem(key)
    const nextSeq = stored ? parseInt(stored) + 1 : 1
    
    const invoiceNumber = prefix + currentYear + currentMonth + String(nextSeq).padStart(4, '0')
    
    console.log('📁 Current from localStorage:', invoiceNumber)
    
    return { data: invoiceNumber, error: null }
  } catch (error) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return { data: `${prefix}${year}${month}${random}`, error: null }
  }
}

// INCREMENT the sequence and return the NEW number (only on save)
export const incrementInvoiceNumber = async (prefix) => {
  try {
    const currentYear = new Date().getFullYear().toString()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    
    console.log('🔍 Incrementing sequence for:', { prefix, currentYear, currentMonth })
    
    // FIRST update localStorage (this ensures we always have a record)
    const localKey = `invoice_seq_${prefix}_${currentYear}_${currentMonth}`
    const localStored = localStorage.getItem(localKey)
    const localNextSeq = localStored ? parseInt(localStored) + 1 : 1
    localStorage.setItem(localKey, String(localNextSeq))
    
    // Try to get existing sequence from Supabase
    let { data: existing, error: selectError } = await supabase
      .from('invoice_sequences')
      .select('*')
      .eq('prefix', prefix)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .maybeSingle()
    
    let nextSeq = localNextSeq
    
    if (existing) {
      // Use the larger of the two values
      const dbNextSeq = existing.last_sequence + 1
      nextSeq = Math.max(localNextSeq, dbNextSeq)
      
      const { error: updateError } = await supabase
        .from('invoice_sequences')
        .update({ 
          last_sequence: nextSeq,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
      
      if (updateError) {
        console.error('❌ Error updating sequence:', updateError)
        // Continue with localStorage value
      }
    } else {
      const { error: insertError } = await supabase
        .from('invoice_sequences')
        .insert([{
          prefix: prefix,
          year: currentYear,
          month: currentMonth,
          last_sequence: nextSeq
        }])
      
      if (insertError) {
        console.error('❌ Error inserting sequence:', insertError)
        // Continue with localStorage value
      }
    }
    
    // Update localStorage with the final sequence
    localStorage.setItem(localKey, String(nextSeq))
    
    const invoiceNumber = prefix + currentYear + currentMonth + String(nextSeq).padStart(4, '0')
    
    console.log('✅ Incremented invoice number:', invoiceNumber, 'Sequence:', nextSeq)
    localStorage.setItem('last_invoice_number', invoiceNumber)
    
    return { data: invoiceNumber, error: null }
  } catch (error) {
    console.error('❌ Error incrementing invoice number:', error)
    const currentYear = new Date().getFullYear().toString()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    return incrementInvoiceNumberLocal(prefix, currentYear, currentMonth)
  }
}

// Increment localStorage
const incrementInvoiceNumberLocal = (prefix, currentYear, currentMonth) => {
  try {
    const key = `invoice_seq_${prefix}_${currentYear}_${currentMonth}`
    const stored = localStorage.getItem(key)
    const nextSeq = stored ? parseInt(stored) + 1 : 1
    
    localStorage.setItem(key, String(nextSeq))
    
    const invoiceNumber = prefix + currentYear + currentMonth + String(nextSeq).padStart(4, '0')
    
    console.log('📁 Incremented from localStorage:', invoiceNumber, 'Sequence:', nextSeq)
    
    return { data: invoiceNumber, error: null }
  } catch (error) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return { data: `${prefix}${year}${month}${random}`, error: null }
  }
}

// ============ ACTIVITY LOGS ============
export const getActivityLogs = async () => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  return { data, error }
}

export const logActivity = async (userId, userName, action, invoiceId, invoiceNo, details) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{
      user_id: userId,
      user_name: userName,
      action,
      invoice_id: invoiceId,
      invoice_no: invoiceNo,
      details
    }])
    .select()
    .single()
  
  return { data, error }
}

// ============ USERS ============
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export const updateUserRole = async (userId, role) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const updateUser = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  return { error }
}

// ============ DASHBOARD ============
export const getDashboardData = async () => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthStartStr = monthStart.toISOString().split('T')[0]
  
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
  
  if (error) return { error }
  
  const todaySales = invoices
    .filter(inv => inv.created_at?.split('T')[0] === todayStr)
    .reduce((sum, inv) => sum + inv.total_amount, 0)
  
  const monthlySales = invoices
    .filter(inv => inv.created_at?.split('T')[0] >= monthStartStr)
    .reduce((sum, inv) => sum + inv.total_amount, 0)
  
  const totalInvoices = invoices.length
  const dueAmount = invoices.reduce((sum, inv) => sum + inv.due_amount, 0)
  
  const productCounts = {}
  invoices.forEach(inv => {
    if (inv.items) {
      const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items
      items.forEach(item => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity
      })
    }
  })
  
  const topProduct = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])[0]
  
  const avgInvoice = totalInvoices > 0 ? invoices.reduce((sum, inv) => sum + inv.total_amount, 0) / totalInvoices : 0
  
  const fortyDaysAgo = new Date(today)
  fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40)
  const fortyDaysAgoStr = fortyDaysAgo.toISOString().split('T')[0]
  
  const customerSales = {}
  invoices
    .filter(inv => inv.created_at?.split('T')[0] >= fortyDaysAgoStr)
    .forEach(inv => {
      customerSales[inv.customer_name] = (customerSales[inv.customer_name] || 0) + inv.total_amount
    })
  
  const topCustomers = Object.entries(customerSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))
  
  const last30Days = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const daySales = invoices
      .filter(inv => inv.created_at?.split('T')[0] === dateStr)
      .reduce((sum, inv) => sum + inv.total_amount, 0)
    last30Days.push({
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      amount: daySales
    })
  }
  
  const recentInvoices = invoices
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(inv => ({
      id: inv.id,
      invoice_no: inv.invoice_no,
      customer: inv.customer_name,
      amount: inv.total_amount,
      status: inv.status,
      date: new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }))
  
  const paidCount = invoices.filter(inv => inv.status === 'paid').length
  const unpaidCount = invoices.filter(inv => inv.status === 'unpaid').length
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length
  const totalCount = invoices.length || 1
  
  const paymentStatus = [
    { name: 'Paid', value: Math.round((paidCount / totalCount) * 100) },
    { name: 'Unpaid', value: Math.round((unpaidCount / totalCount) * 100) },
    { name: 'Pending', value: Math.round((pendingCount / totalCount) * 100) }
  ]
  
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  const recentActivity = activities ? activities.map(a => ({
    user: a.user_name || 'System',
    action: a.action,
    invoice: a.invoice_no || '',
    time: new Date(a.created_at).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  })) : []
  
  return {
    data: {
      todaySales,
      monthlySales,
      totalInvoices,
      dueAmount,
      topProduct: topProduct ? { name: topProduct[0], qty: topProduct[1] } : { name: 'No sales', qty: 0 },
      avgInvoice,
      topCustomers,
      recentInvoices,
      last30Days,
      paymentStatus,
      recentActivity
    },
    error: null
  }
}