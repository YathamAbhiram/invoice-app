import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Users, 
  DollarSign, 
  Clock,
  Copy,
  Send
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { getDashboardData } from '../services/database'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlySales: 0,
    totalInvoices: 0,
    dueAmount: 0,
    topProduct: { name: '-', qty: 0 },
    avgInvoice: 0,
    topCustomers: [],
    recentInvoices: [],
    last30Days: [],
    paymentStatus: [],
    recentActivity: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const { data, error } = await getDashboardData()
      
      if (error) throw error
      
      setStats({
        todaySales: data.todaySales || 0,
        monthlySales: data.monthlySales || 0,
        totalInvoices: data.totalInvoices || 0,
        dueAmount: data.dueAmount || 0,
        topProduct: data.topProduct || { name: '-', qty: 0 },
        avgInvoice: data.avgInvoice || 0,
        topCustomers: data.topCustomers || [],
        recentInvoices: data.recentInvoices || [],
        last30Days: data.last30Days || [],
        paymentStatus: data.paymentStatus || [],
        recentActivity: data.recentActivity || []
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLastInvoice = () => {
    toast.success('Last invoice copied!')
  }

  const handleSendReminder = () => {
    toast.success('Reminder sent via WhatsApp!')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>
  }

  const COLORS = ['#22c55e', '#ef4444', '#f59e0b']

  const statWidgets = [
    {
      title: "Today's Sale",
      value: `₹${stats.todaySales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Monthly Sales",
      value: `₹${stats.monthlySales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Due Amount",
      value: `₹${stats.dueAmount.toLocaleString()}`,
      icon: Clock,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/20"
    },
    {
      title: "Top Selling",
      value: stats.topProduct.name,
      subValue: `${stats.topProduct.qty} units`,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      title: "Avg Invoice",
      value: `₹${stats.avgInvoice.toFixed(0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/20"
    }
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleCopyLastInvoice} 
            variant="outline" 
            size="sm"
            className="flex-1 sm:flex-none items-center gap-1 text-xs md:text-sm"
          >
            <Copy size={14} />
            Copy Last
          </Button>
          <Button 
            onClick={handleSendReminder} 
            size="sm"
            className="flex-1 sm:flex-none items-center gap-1 text-xs md:text-sm"
          >
            <Send size={14} />
            Send Reminder
          </Button>
        </div>
      </div>

      {/* Stats Grid - 2 columns on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {statWidgets.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-sm md:text-lg font-bold truncate">{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-[10px] md:text-xs text-muted-foreground">{stat.subValue}</p>
                    )}
                  </div>
                  <div className={`p-1.5 md:p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-3 h-3 md:w-4 md:h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Last 30 Days Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="h-52 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Sales']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="h-44 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 768 ? 30 : 60}
                    outerRadius={window.innerWidth < 768 ? 50 : 80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={window.innerWidth >= 768}
                  >
                    {stats.paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              🏆 Top 5 Customers
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last 40 Days</p>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 md:space-y-3">
              {stats.topCustomers.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No customer data available
                </div>
              ) : (
                stats.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs md:text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base font-medium truncate max-w-[120px] md:max-w-[200px]">
                        {customer.name}
                      </span>
                    </div>
                    <span className="text-sm md:text-base font-semibold">₹{customer.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              📋 Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 md:space-y-3">
              {stats.recentInvoices.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No invoices found
                </div>
              ) : (
                stats.recentInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm md:text-base font-medium">{invoice.invoice_no}</div>
                      <div className="text-xs text-muted-foreground">{invoice.customer}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm md:text-base font-semibold">₹{invoice.amount.toLocaleString()}</div>
                      <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        invoice.status === 'unpaid' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <Link to="/invoices" className="text-xs md:text-sm text-primary hover:underline block text-center mt-3">
                View All Invoices →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            🔔 Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-2">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-sm">
                No recent activity
              </div>
            ) : (
              stats.recentActivity.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-xs md:text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate max-w-[80px] md:max-w-[150px]">
                      {activity.user}
                    </span>
                    <span className="text-muted-foreground hidden sm:inline">{activity.action}</span>
                    {activity.invoice && (
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[60px] md:max-w-[100px]">
                        {activity.invoice}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {activity.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard