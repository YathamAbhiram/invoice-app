import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import SuperAdminRoute from './components/common/SuperAdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import NewInvoice from './pages/NewInvoice';
import EditInvoice from './pages/EditInvoice';  // ← ADD THIS IMPORT
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import ActivityLog from './pages/ActivityLog';
import CompanySettings from './pages/CompanySettings';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<NewInvoice />} />
          <Route path="invoices/edit/:id" element={<EditInvoice />} />  {/* ← ADD THIS ROUTE - MUST BE BEFORE "/invoices/new" */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="activity" element={<ActivityLog />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<SuperAdminRoute><CompanySettings /></SuperAdminRoute>} />
          <Route path="users" element={<SuperAdminRoute><UserManagement /></SuperAdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;