// src/lib/invoiceUtils.js
import { 
  getCurrentInvoiceNumber,
  incrementInvoiceNumber
} from '../services/database'

/**
 * Get the current invoice number WITHOUT incrementing (preview)
 * This is called when the page loads and after save
 */
export const getPreviewInvoiceNumber = async (prefix = 'ANG') => {
  try {
    console.log('📝 Getting preview invoice with prefix:', prefix)
    const { data, error } = await getCurrentInvoiceNumber(prefix)
    
    if (error) {
      console.error('❌ Error getting preview invoice number:', error)
      return generateFallbackInvoiceNumber(prefix)
    }
    
    if (data) {
      console.log('👁️ Preview invoice number:', data)
      return data
    }
    
    return generateFallbackInvoiceNumber(prefix)
  } catch (error) {
    console.error('❌ Error getting preview invoice number:', error)
    return generateFallbackInvoiceNumber(prefix)
  }
}

/**
 * Increment the sequence and get the next invoice number (only on save)
 */
export const getNextInvoiceNumberOnSave = async (prefix = 'ANG') => {
  try {
    console.log('📝 Getting next invoice number on save with prefix:', prefix)
    const { data, error } = await incrementInvoiceNumber(prefix)
    
    if (error) {
      console.error('❌ Error getting next invoice number:', error)
      return generateFallbackInvoiceNumber(prefix)
    }
    
    if (data) {
      console.log('✅ Next invoice number on save:', data)
      return data
    }
    
    return generateFallbackInvoiceNumber(prefix)
  } catch (error) {
    console.error('❌ Error getting next invoice number:', error)
    return generateFallbackInvoiceNumber(prefix)
  }
}

/**
 * Fallback: Generate invoice number with timestamp + random
 */
const generateFallbackInvoiceNumber = (prefix = 'ANG') => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  const invoiceNumber = `${prefix}${year}${month}${random}`
  console.log('⚠️ Fallback generated:', invoiceNumber)
  return invoiceNumber
}