import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  Save,
  Upload,
  Image,
  Banknote,
  Palette,
  RefreshCw,
  FileText,
  FileCheck,
  PenTool,
  QrCode,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getCompanySettings, updateCompanySettings } from '../services/database'
import toast from 'react-hot-toast'

const CompanySettings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const logoInputRef = useRef(null)
  const signatureInputRef = useRef(null)
  const qrInputRef = useRef(null)
  const canvasRef = useRef(null)
  const [settingsId, setSettingsId] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showGeneral, setShowGeneral] = useState(true)
  const [showTerms, setShowTerms] = useState(true)
  const [showSignatory, setShowSignatory] = useState(true)
  const [showBanking, setShowBanking] = useState(true)
  const [showTheme, setShowTheme] = useState(true)

  const [settings, setSettings] = useState({
    portal_name: 'Invoice App',
    company_name: '',
    tagline: '',
    logo: null,
    address_line1: '',
    address_line2: '',
    address_line3: '',
    phone: '',
    email: '',
    website: '',
    gst_number: '',
    invoice_prefix: 'ANG',
    signatory_name: '',
    signature_image: null,
    signature_type: 'image',
    bank_name: '',
    bank_branch: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    upi_qr: null,
    terms_and_conditions: '',
    theme_mode: 'light',
    primary_color: '#2563eb',
    secondary_color: '#f3f4f6',
    background_color: '#ffffff'
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await getCompanySettings()
      
      if (error) throw error
      
      if (data) {
        setSettingsId(data.id)
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load company settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleTextareaChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSettings(prev => ({ ...prev, [field]: event.target.result }))
        toast.success(`${field.replace('_', ' ')} uploaded successfully!`)
      }
      reader.readAsDataURL(file)
    }
  }

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    canvas.isDrawing = true
    canvas.lastX = x
    canvas.lastY = y
  }

  const draw = (e) => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.isDrawing) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(canvas.lastX, canvas.lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    canvas.lastX = x
    canvas.lastY = y
  }

  const stopDrawing = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.isDrawing = false
      const dataUrl = canvas.toDataURL('image/png')
      setSettings(prev => ({ ...prev, signature_image: dataUrl }))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setSettings(prev => ({ ...prev, signature_image: null }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (!settings.company_name) {
        toast.error('Company name is required')
        setSaving(false)
        return
      }
      if (!settings.invoice_prefix || settings.invoice_prefix.length !== 3) {
        toast.error('Invoice prefix must be exactly 3 characters')
        setSaving(false)
        return
      }

      const { data, error } = await updateCompanySettings({
        ...settings,
        id: settingsId
      })
      
      if (error) throw error
      
      localStorage.setItem('invoice_prefix', settings.invoice_prefix)
      localStorage.setItem('portal_name', settings.portal_name)
      
      applyTheme(settings.theme_mode, settings.primary_color, settings.secondary_color)
      
      toast.success('Company settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save company settings')
    } finally {
      setSaving(false)
    }
  }

  const applyTheme = (mode, primary, secondary) => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (mode === 'custom') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.setProperty('--primary', primary)
      document.documentElement.style.setProperty('--secondary', secondary)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      localStorage.removeItem('invoice_prefix')
      localStorage.removeItem('portal_name')
      window.location.reload()
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `company_settings_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Settings exported successfully!')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        setSettings(prev => ({ ...prev, ...data }))
        toast.success('Settings imported successfully!')
      } catch (error) {
        toast.error('Invalid settings file')
      }
    }
    reader.readAsText(file)
  }

  const toggleSection = (section) => {
    if (!isMobile) return
    switch(section) {
      case 'general':
        setShowGeneral(!showGeneral)
        break
      case 'terms':
        setShowTerms(!showTerms)
        break
      case 'signatory':
        setShowSignatory(!showSignatory)
        break
      case 'banking':
        setShowBanking(!showBanking)
        break
      case 'theme':
        setShowTheme(!showTheme)
        break
      default:
        break
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>
  }

  return (
    <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Company Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your company and invoice settings</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <FileText size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none items-center gap-2 text-sm">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* General Settings - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('general')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <Building size={18} className="md:w-5 md:h-5" />
              General Settings
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showGeneral ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showGeneral) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Portal Name</label>
                <Input
                  name="portal_name"
                  value={settings.portal_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter portal name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Company Name *</label>
                <Input
                  name="company_name"
                  value={settings.company_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Tagline</label>
                <Input
                  name="tagline"
                  value={settings.tagline || ''}
                  onChange={handleInputChange}
                  placeholder="Enter tagline"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Company Logo</label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image size={20} className="md:w-6 md:h-6 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Upload size={14} />
                    Upload
                  </Button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Invoice Prefix * (3 letters)</label>
                <Input
                  name="invoice_prefix"
                  value={settings.invoice_prefix || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. ANG"
                  maxLength={3}
                  className="uppercase text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Example: {settings.invoice_prefix}20260001</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Address Line 1</label>
                <Input
                  name="address_line1"
                  value={settings.address_line1 || ''}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Address Line 2 (City)</label>
                <Input
                  name="address_line2"
                  value={settings.address_line2 || ''}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Address Line 3 (State, Pincode)</label>
                <Input
                  name="address_line3"
                  value={settings.address_line3 || ''}
                  onChange={handleInputChange}
                  placeholder="State, Pincode"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Phone Number</label>
                <Input
                  name="phone"
                  value={settings.phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Email</label>
                <Input
                  name="email"
                  value={settings.email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Website</label>
                <Input
                  name="website"
                  value={settings.website || ''}
                  onChange={handleInputChange}
                  placeholder="Enter website"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">GST Number</label>
                <Input
                  name="gst_number"
                  value={settings.gst_number || ''}
                  onChange={handleInputChange}
                  placeholder="Enter GST number"
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Terms & Conditions - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('terms')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <FileCheck size={18} className="md:w-5 md:h-5" />
              Terms & Conditions
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showTerms ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showTerms) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-1">Terms & Conditions (one per line)</label>
              <textarea
                name="terms_and_conditions"
                value={settings.terms_and_conditions || ''}
                onChange={handleTextareaChange}
                rows={isMobile ? 4 : 6}
                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder="Enter terms and conditions, one per line..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                These will appear at the bottom of every invoice PDF
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Authorized Signatory - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('signatory')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <PenTool size={18} className="md:w-5 md:h-5" />
              Authorized Signatory
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showSignatory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showSignatory) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Signatory Name</label>
                <Input
                  name="signatory_name"
                  value={settings.signatory_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Signature Type</label>
                <select
                  value={settings.signature_type || 'image'}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    signature_type: e.target.value,
                    signature_image: null 
                  }))}
                  className="w-full h-9 md:h-10 px-3 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="image">Upload Image</option>
                  <option value="draw">Draw Signature</option>
                </select>
              </div>

              {settings.signature_type === 'image' ? (
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Signature Image</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-28 h-14 md:w-32 md:h-16 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                      {settings.signature_image ? (
                        <img src={settings.signature_image} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <User size={20} className="md:w-6 md:h-6 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Upload size={14} />
                      Upload
                    </Button>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature_image')}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Draw Signature</label>
                  <div className="border rounded-lg p-2">
                    <canvas
                      ref={canvasRef}
                      width={isMobile ? 300 : 400}
                      height={isMobile ? 80 : 100}
                      className="w-full border rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={clearCanvas} className="text-sm">
                        Clear
                      </Button>
                      {settings.signature_image && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <span>✓</span> Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Banking Details - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('banking')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <Banknote size={18} className="md:w-5 md:h-5" />
              Banking Details
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showBanking ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showBanking) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Bank Name</label>
                <Input
                  name="bank_name"
                  value={settings.bank_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter bank name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Branch</label>
                <Input
                  name="bank_branch"
                  value={settings.bank_branch || ''}
                  onChange={handleInputChange}
                  placeholder="Enter branch"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Account Number</label>
                <Input
                  name="account_number"
                  value={settings.account_number || ''}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">IFSC Code</label>
                <Input
                  name="ifsc_code"
                  value={settings.ifsc_code || ''}
                  onChange={handleInputChange}
                  placeholder="Enter IFSC code"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">UPI ID</label>
                <Input
                  name="upi_id"
                  value={settings.upi_id || ''}
                  onChange={handleInputChange}
                  placeholder="Enter UPI ID"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">UPI QR Code</label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                    {settings.upi_qr ? (
                      <img src={settings.upi_qr} alt="UPI QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode size={24} className="md:w-8 md:h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => qrInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Upload size={14} />
                    Upload QR
                  </Button>
                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'upi_qr')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Theme Settings - Collapsible on Mobile */}
      <Card>
        <CardHeader 
          className={`p-3 md:p-6 ${isMobile ? 'cursor-pointer select-none' : ''}`}
          onClick={() => toggleSection('theme')}
        >
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2">
              <Palette size={18} className="md:w-5 md:h-5" />
              Theme Settings
            </span>
            {isMobile && (
              <span className="text-muted-foreground">
                {showTheme ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {(!isMobile || showTheme) && (
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Theme Mode</label>
                <select
                  value={settings.theme_mode || 'light'}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme_mode: e.target.value }))}
                  className="w-full h-9 md:h-10 px-3 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Primary Color</label>
                <div className="flex items-center gap-2 md:gap-3">
                  <input
                    type="color"
                    value={settings.primary_color || '#2563eb'}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.primary_color || '#2563eb'}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#hexcode"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Secondary Color</label>
                <div className="flex items-center gap-2 md:gap-3">
                  <input
                    type="color"
                    value={settings.secondary_color || '#f3f4f6'}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.secondary_color || '#f3f4f6'}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                    placeholder="#hexcode"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 md:mt-4 p-3 md:p-4 border rounded-lg bg-muted/30">
              <p className="text-xs md:text-sm text-muted-foreground">Preview:</p>
              <div className="flex items-center gap-3 md:gap-4 mt-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded" style={{ backgroundColor: settings.primary_color || '#2563eb' }} />
                <div className="w-8 h-8 md:w-10 md:h-10 rounded" style={{ backgroundColor: settings.secondary_color || '#f3f4f6' }} />
                <span className="text-xs md:text-sm">
                  {settings.theme_mode === 'light' && '☀️ Light Mode'}
                  {settings.theme_mode === 'dark' && '🌙 Dark Mode'}
                  {settings.theme_mode === 'custom' && '🎨 Custom Mode'}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">Import Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => document.getElementById('importSettings')?.click()}
              className="flex items-center gap-2 text-sm"
            >
              <Upload size={14} />
              Import Settings
            </Button>
            <input
              id="importSettings"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <span className="text-xs text-muted-foreground">
              Upload a JSON settings file to restore configuration
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompanySettings