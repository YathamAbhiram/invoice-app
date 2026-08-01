import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica'
  },
  
  // Header Section
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 8,
  },
  logoContainer: {
    width: 85,
    marginRight: 12,
    paddingTop: 2,
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  companyInfoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b2253',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00a896',
    marginBottom: 3,
    backgroundColor: '#e6f7f4',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 2,
  },
  addressLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  addressLine: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.8,
    marginBottom: 0,
    paddingVertical: 1,
  },
  contactRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingLeft: 10,
    minWidth: 130,
  },
  contactLineBold: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.8,
    marginBottom: 0,
    textAlign: 'right',
    fontWeight: 'bold',
    paddingVertical: 1,
  },

  // Tax Invoice Header Bar
  taxInvoiceBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    alignItems: 'center',
    padding: 3,
    marginTop: 4,
  },
  gstText: {
    width: '35%',
    fontSize: 9,
    fontWeight: 'bold',
    paddingLeft: 4,
  },
  taxInvoiceTitle: {
    width: '30%',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyRight: {
    width: '35%',
  },

  // Details Container
  detailsContainer: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  leftDetails: {
    width: '55%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderStyle: 'solid',
  },
  rightDetails: {
    width: '45%',
  },
  sectionHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    backgroundColor: '#f5f5f5',
  },
  infoRow: {
    flexDirection: 'row',
    minHeight: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    borderStyle: 'solid',
  },
  infoLabel: {
    width: 55,
    fontSize: 8,
    fontWeight: 'bold',
    padding: 2,
    paddingLeft: 4,
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    padding: 2,
  },
  noBorder: {
    borderBottomWidth: 0,
  },

  // Products Table
  productsTable: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'solid',
    backgroundColor: '#f5f5f5',
    minHeight: 25,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 4,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'solid',
    minHeight: 20,
  },
  tableCell: {
    fontSize: 7,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderStyle: 'solid',
  },
  noBorderRight: {
    borderRightWidth: 0,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },

  // Column widths
  colSr: { width: 25, textAlign: 'center' },
  colName: { flex: 1.5 },
  colHsn: { width: 50, textAlign: 'center' },
  colQty: { width: 40, textAlign: 'center' },
  colRate: { width: 55, textAlign: 'right' },
  colTaxable: { width: 60, textAlign: 'right' },
  colGstPct: { width: 30, textAlign: 'center' },
  colGstAmt: { width: 50, textAlign: 'right' },
  colTotal: { width: 60, textAlign: 'right', borderRightWidth: 0 },

  // Bottom Layout
  bottomLayoutContainer: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  bottomLeftSection: {
    width: '60%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    borderStyle: 'solid',
  },
  bottomRightSection: {
    width: '40%',
  },

  wordsBlock: {
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'solid',
    minHeight: 30,
  },
  wordsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  wordsContent: {
    fontSize: 8,
    textAlign: 'center',
  },

  bankInfoContainer: {
    flexDirection: 'row',
    padding: 4,
  },
  bankDetailsList: {
    flex: 1,
  },
  qrCodeBox: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 50,
    height: 50,
  },
  qrText: {
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },

  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderStyle: 'solid',
    minHeight: 14,
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    paddingLeft: 4,
  },
  summaryValue: {
    width: 85,
    fontSize: 8,
    textAlign: 'right',
    paddingRight: 4,
  },
  summaryValueBold: {
    width: 85,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 4,
  },

  termsContainer: {
    padding: 4,
  },
  termsHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  termsText: {
    fontSize: 7.5,
    lineHeight: 1.3,
  },

  computerGeneratedText: {
    fontSize: 7,
    color: '#444444',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 2,
  },
  sigText: {
    fontSize: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    paddingTop: 2,
    width: 90,
    textAlign: 'center',
  },
  footerGreeting: {
    fontSize: 8,
    paddingLeft: 4,
    paddingBottom: 4,
  }
});

// Helper: Number to Words
const numberToWords = (num) => {
  if (num === 0) return 'ZERO';
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  const numToWordsFn = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + numToWordsFn(n % 100) : '');
    if (n < 100000) return numToWordsFn(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + numToWordsFn(n % 1000) : '');
    return numToWordsFn(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + numToWordsFn(n % 100000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = numToWordsFn(rupees) + ' RUPEES';
  if (paise > 0) {
    result += ' AND ' + numToWordsFn(paise) + ' PAISE';
  }
  return result + ' ONLY';
};

// SIMPLE Indian number formatter - FIXED
const formatIndianNumber = (num) => {
  if (isNaN(num) || num === null || num === undefined) return '0.00';
  const n = parseFloat(num);
  if (n === 0) return '0.00';
  
  const fixedNum = n.toFixed(2);
  const parts = fixedNum.split('.');
  let intPart = parts[0];
  const decPart = parts[1] || '00';
  
  // Remove leading zeros
  intPart = intPart.replace(/^0+/, '') || '0';
  
  // Format with Indian numbering system
  // Last 3 digits, then groups of 2
  const len = intPart.length;
  
  if (len <= 3) {
    return intPart + '.' + decPart;
  }
  
  // Get last 3 digits
  const lastThree = intPart.substring(len - 3);
  const otherDigits = intPart.substring(0, len - 3);
  
  // Format the rest in groups of 2
  let formattedOther = '';
  for (let i = 0; i < otherDigits.length; i++) {
    formattedOther += otherDigits[i];
    // Add comma after every 2 digits from the right
    if ((otherDigits.length - i - 1) % 2 === 0 && i < otherDigits.length - 1) {
      formattedOther += ',';
    }
  }
  
  return formattedOther + ',' + lastThree + '.' + decPart;
};

// Format as currency
const formatCurrency = (num) => {
  return 'Rs. ' + formatIndianNumber(num);
};

const InvoicePDF = ({ invoiceData, companySettings }) => {
  const {
    invoice_no = 'ANG2026001',
    po_number = '',
    customer = {},
    products = [],
    totals = {},
    created_at = new Date(),
    transport_location = '',
    transport_id = '',
    transport_charges = null,
  } = invoiceData || {};

  const settings = companySettings || JSON.parse(localStorage.getItem('company_settings') || '{}');
  
  // Combine products with transport if exists
  let allProducts = [...(products || [])];
  
  if (transport_charges && transport_charges.price > 0) {
    const hasTransport = allProducts.some(p => 
      p.name && p.name.includes('Transport Charges')
    );
    if (!hasTransport) {
      allProducts.push(transport_charges);
    }
  }
  
  // Calculate totals
  let calculatedTaxableAmount = 0;
  let calculatedGSTAmount = 0;
  let calculatedTotalAmount = 0;
  
  allProducts.forEach(p => {
    const qty = p.quantity || 0;
    const price = p.price || 0;
    const gst = p.gst !== undefined && p.gst !== null ? p.gst : 0;
    const discount = p.discount || 0;
    
    const subtotal = qty * price;
    const discountAmount = (subtotal * discount) / 100;
    const taxable = subtotal - discountAmount;
    const gstAmount = (taxable * gst) / 100;
    const total = taxable + gstAmount;
    
    calculatedTaxableAmount += taxable;
    calculatedGSTAmount += gstAmount;
    calculatedTotalAmount += total;
  });
  
  const shipping = totals?.shipping || 0;
  const handling = totals?.handling || 0;
  calculatedTotalAmount += shipping + handling;
  
  const taxableAmount = calculatedTaxableAmount || totals?.subtotal || 0;
  const totalGST = calculatedGSTAmount || totals?.totalGST || 0;
  const grandTotal = calculatedTotalAmount || totals?.grandTotal || 0;

  // Format address from settings - 3 lines
  const addressLine1 = settings.address_line1 || '';
  const addressLine2 = settings.address_line2 || '';
  const addressLine3 = settings.address_line3 || '';

  const formattedDate = new Date(created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date(created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const hasTransport = transport_location && transport_location.trim() !== '';

  // Pre-format all numbers
  const formattedTaxable = formatIndianNumber(taxableAmount);
  const formattedGST = formatIndianNumber(totalGST);
  const formattedGrandTotal = formatIndianNumber(grandTotal);
  const formattedCurrency = formatCurrency(grandTotal);

  // Contact details
  const phone = settings.phone || '';
  const email = settings.email || '';
  const website = settings.website || '';
  const gstNumber = settings.gst_number || '26CORPP3939N1';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {settings.logo ? (
              <Image src={settings.logo} style={styles.logo} />
            ) : (
              <View style={{ width: 80, height: 60, borderWidth: 2, borderColor: '#00a896', borderStyle: 'dashed' }} />
            )}
          </View>
          
          {/* Company Info */}
          <View style={styles.companyInfoContainer}>
            <Text style={styles.companyName}>{settings.company_name || 'GUJARAT FREIGHT TOOLS'}</Text>
            <Text style={styles.tagline}>{settings.tagline || 'Manufacturing & Supply of Precision Press Tool & Room Component'}</Text>
            
            {/* Address with Contact Details Beside */}
            <View style={styles.addressRow}>
              <View style={styles.addressLeft}>
                <Text style={styles.addressLine}>{addressLine1}</Text>
                <Text style={styles.addressLine}>{addressLine2}</Text>
                <Text style={styles.addressLine}>{addressLine3}</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactLineBold}>Tel: {phone}</Text>
                <Text style={styles.contactLineBold}>Email: {email}</Text>
                <Text style={styles.contactLineBold}>Web: {website}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tax Invoice Bar */}
        <View style={styles.taxInvoiceBar}>
          <Text style={styles.gstText}>GST : {gstNumber}</Text>
          <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
          <View style={styles.emptyRight} />
        </View>

        {/* Details Container */}
        <View style={styles.detailsContainer}>
          <View style={styles.leftDetails}>
            <Text style={styles.sectionHeader}>Customer Detail</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{customer.name || ''}</Text>
            </View>
            {customer.company && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>{customer.company}</Text>
              </View>
            )}
            <View style={[styles.infoRow, { minHeight: 25 }]}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{customer.address || ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{customer.mobile || ''}</Text>
            </View>
            {customer.gstin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GSTIN</Text>
                <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{customer.gstin}</Text>
              </View>
            )}
            {customer.place_of_supply && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Place of Supply</Text>
                <Text style={styles.infoValue}>{customer.place_of_supply}</Text>
              </View>
            )}
            {po_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>P.O. No.</Text>
                <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{po_number}</Text>
              </View>
            )}
          </View>

          <View style={styles.rightDetails}>
            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={styles.infoLabel}>Invoice No.</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{invoice_no}</Text>
              <Text style={[styles.infoLabel, { width: 45 }]}>Invoice Date</Text>
              <Text style={[styles.infoValue, { fontSize: 6 }]}>{formattedDate}</Text>
            </View>
            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={styles.infoLabel}>P.O. No.</Text>
              <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{po_number || '-'}</Text>
              <Text style={[styles.infoLabel, { width: 45 }]}>Time</Text>
              <Text style={[styles.infoValue, { fontSize: 6 }]}>{formattedTime}</Text>
            </View>
            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={styles.infoLabel}>Place of Supply</Text>
              <Text style={styles.infoValue}>{customer.place_of_supply || '-'}</Text>
            </View>
            {hasTransport && (
              <>
                <View style={[styles.infoRow, styles.noBorder]}>
                  <Text style={styles.infoLabel}>Transport</Text>
                  <Text style={styles.infoValue}>{transport_location}</Text>
                </View>
                <View style={[styles.infoRow, styles.noBorder]}>
                  <Text style={styles.infoLabel}>Transport ID</Text>
                  <Text style={styles.infoValue}>{transport_id}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Products Table */}
        <View style={styles.productsTable}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.colSr]}>
              <Text>Sr.</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colName]}>
              <Text>Name of Product / Service</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colHsn]}>
              <Text>HSN / SAC</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colQty]}>
              <Text>Qty</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colRate]}>
              <Text>Rate</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTaxable]}>
              <Text>Taxable Value</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colGstPct]}>
              <Text>GST</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colGstAmt]}>
              <Text>Amount</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTotal, styles.noBorderRight]}>
              <Text>Total</Text>
            </View>
          </View>
          
          {allProducts.map((product, index) => {
            const qty = product.quantity || 0;
            const price = product.price || 0;
            const gst = product.gst !== undefined && product.gst !== null ? product.gst : 0;
            const discount = product.discount || 0;
            const subtotal = qty * price;
            const discountAmount = (subtotal * discount) / 100;
            const taxable = subtotal - discountAmount;
            const gstAmount = (taxable * gst) / 100;
            const total = taxable + gstAmount;
            const hsn = product.hsn || '';
            
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSr]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.colName]}>{product.name}</Text>
                <Text style={[styles.tableCell, styles.colHsn]}>{hsn}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{qty} {product.unit || 'NOS'}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{price.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.colTaxable]}>{taxable.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.colGstPct]}>{gst}%</Text>
                <Text style={[styles.tableCell, styles.colGstAmt]}>{gstAmount.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.colTotal, styles.noBorderRight]}>{total.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={[styles.tableRow, styles.noBottomBorder]}>
            <Text style={[styles.tableCell, styles.colSr]}></Text>
            <Text style={[styles.tableCell, styles.colName, { textAlign: 'right', fontWeight: 'bold' }]}>Total</Text>
            <Text style={[styles.tableCell, styles.colHsn]}></Text>
            <Text style={[styles.tableCell, styles.colQty, { fontWeight: 'bold' }]}>{allProducts.length} NOS</Text>
            <Text style={[styles.tableCell, styles.colRate]}></Text>
            <Text style={[styles.tableCell, styles.colTaxable, { fontWeight: 'bold' }]}>{taxableAmount.toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.colGstPct]}></Text>
            <Text style={[styles.tableCell, styles.colGstAmt, { fontWeight: 'bold' }]}>{totalGST.toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.colTotal, styles.noBorderRight, { fontWeight: 'bold' }]}>{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Bottom Layout */}
        <View style={styles.bottomLayoutContainer}>
          <View style={styles.bottomLeftSection}>
            <View style={styles.wordsBlock}>
              <Text style={styles.wordsTitle}>Total in words</Text>
              <Text style={styles.wordsContent}>{numberToWords(grandTotal)}</Text>
            </View>
            
            <Text style={[styles.sectionHeader, { borderBottomWidth: 1 }]}>Bank Details</Text>
            <View style={styles.bankInfoContainer}>
              <View style={styles.bankDetailsList}>
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ width: 50, fontSize: 8, fontWeight: 'bold' }}>Name</Text>
                  <Text style={{ fontSize: 8 }}>: {settings.bank_name || ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ width: 50, fontSize: 8, fontWeight: 'bold' }}>Branch</Text>
                  <Text style={{ fontSize: 8 }}>: {settings.bank_branch || ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ width: 50, fontSize: 8, fontWeight: 'bold' }}>Acc. Number</Text>
                  <Text style={{ fontSize: 8 }}>: {settings.account_number || ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ width: 50, fontSize: 8, fontWeight: 'bold' }}>IFSC</Text>
                  <Text style={{ fontSize: 8 }}>: {settings.ifsc_code || ''}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ width: 50, fontSize: 8, fontWeight: 'bold' }}>UPI ID</Text>
                  <Text style={{ fontSize: 8 }}>: {settings.upi_id || ''}</Text>
                </View>
              </View>
              
              <View style={styles.qrCodeBox}>
                {settings.upi_qr ? (
                  <Image src={settings.upi_qr} style={styles.qrImage} />
                ) : (
                  <View style={{ width: 40, height: 40, borderWidth: 1, borderColor: '#000000', borderStyle: 'dashed' }} />
                )}
                <Text style={styles.qrText}>Pay using UPI</Text>
              </View>
            </View>

            <View style={[styles.termsContainer, { borderTopWidth: 1, borderTopColor: '#000000' }]}>
              <Text style={styles.termsHeader}>Terms and Conditions</Text>
              {settings.terms_and_conditions ? (
                settings.terms_and_conditions.split('\n').filter(t => t.trim()).map((term, index) => (
                  <Text key={index} style={styles.termsText}>{index + 1}. {term.trim()}</Text>
                ))
              ) : (
                <>
                  <Text style={styles.termsText}>1. This is a computer generated invoice no signature required.</Text>
                  <Text style={styles.termsText}>2. Subject to Maharashtra Jurisdiction.</Text>
                  <Text style={styles.termsText}>3. Our Responsibility Ceases as soon as goods leaves our Premises.</Text>
                  <Text style={styles.termsText}>4. Goods once sold will not taken back.</Text>
                  <Text style={styles.termsText}>5. Delivery Ex-Premises.</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.bottomRightSection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryValue}>{formattedTaxable}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Add : GST</Text>
              <Text style={styles.summaryValue}>{formattedGST}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tax</Text>
              <Text style={styles.summaryValue}>{formattedGST}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 1, minHeight: 16 }]}>
              <Text style={styles.summaryLabel}>Total Amount After Tax</Text>
              <Text style={[styles.summaryValueBold, { paddingRight: 6 }]}>
                {formattedCurrency}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', paddingRight: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 7, fontStyle: 'italic' }}>(E & O.E.)</Text>
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end', minHeight: 50, paddingBottom: 4, alignItems: 'center' }}>
              {settings.signature_image && (
                <Image src={settings.signature_image} style={{ width: 60, height: 25, objectFit: 'contain' }} />
              )}
              <Text style={[styles.sigText, { borderTopWidth: 0.5, width: '70%' }]}>Authorised Signatory</Text>
              <Text style={styles.computerGeneratedText}>This is a computer generated invoice.</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
          <Text style={{ fontSize: 8, color: '#333333', paddingRight: 4 }}>Thank you for shopping with us!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
