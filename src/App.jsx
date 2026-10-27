import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider, PageLoader } from './components/ui';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import Vendors from './pages/vendors/Vendors';
import VendorDetail from './pages/vendors/VendorDetail';
import Requests from './pages/requests/Requests';
import RequestDetail from './pages/requests/RequestDetail';
import Quotations from './pages/quotations/Quotations';
import Jobs from './pages/jobs/Jobs';
import SosTickets from './pages/sos/SosTickets';
import PropertyListings from './pages/properties/PropertyListings';
import PropertyForm from './pages/properties/PropertyForm';
import Builders from './pages/properties/Builders';
import Projects from './pages/properties/Projects';
import Areas from './pages/properties/Areas';
import PropertyEnquiries from './pages/properties/PropertyEnquiries';
import Services from './pages/services/Services';
import Employees from './pages/hr/Employees';
import Attendance from './pages/hr/Attendance';
import Leaves from './pages/hr/Leaves';
import NotificationsAdmin from './pages/notifications/NotificationsAdmin';
import Reports from './pages/reports/Reports';
import Roles from './pages/roles/Roles';
import Staff from './pages/staff/Staff';
import Support from './pages/support/Support';
import AuditLog from './pages/audit/AuditLog';
import Settings from './pages/settings/Settings';
import Profile from './pages/settings/Profile';
import NotFound from './pages/errors/NotFound';

function Guard({ perm, children }) {
  const { user, loading, can } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (perm && !can(perm)) {
    return (
      <div className="py-24 text-center">
        <p className="text-4xl font-display font-extrabold text-slate-200">403</p>
        <p className="text-slate-500 mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<AdminLayout />}>
          <Route index element={<Guard perm="dashboard.view"><Dashboard /></Guard>} />
          <Route path="customers" element={<Guard perm="customers.view"><Customers /></Guard>} />
          <Route path="vendors" element={<Guard perm="vendors.view"><Vendors /></Guard>} />
          <Route path="vendors/:id" element={<Guard perm="vendors.view"><VendorDetail /></Guard>} />
          <Route path="requests" element={<Guard perm="requests.view"><Requests /></Guard>} />
          <Route path="requests/:id" element={<Guard perm="requests.view"><RequestDetail /></Guard>} />
          <Route path="quotations" element={<Guard perm="quotations.view"><Quotations /></Guard>} />
          <Route path="jobs" element={<Guard perm="jobs.view"><Jobs /></Guard>} />
          <Route path="sos" element={<Guard perm="sos.view"><SosTickets /></Guard>} />

          <Route path="properties" element={<Guard perm="properties.view"><PropertyListings /></Guard>} />
          <Route path="properties/new" element={<Guard perm="properties.manage"><PropertyForm /></Guard>} />
          <Route path="properties/:id/edit" element={<Guard perm="properties.manage"><PropertyForm /></Guard>} />
          <Route path="properties/builders" element={<Guard perm="properties.view"><Builders /></Guard>} />
          <Route path="properties/projects" element={<Guard perm="properties.view"><Projects /></Guard>} />
          <Route path="properties/areas" element={<Guard perm="properties.view"><Areas /></Guard>} />
          <Route path="properties/enquiries" element={<Guard perm="properties.enquiries"><PropertyEnquiries /></Guard>} />

          <Route path="services" element={<Guard perm="services.view"><Services /></Guard>} />

          <Route path="hr" element={<Guard perm="hr.view"><Employees /></Guard>} />
          <Route path="hr/attendance" element={<Guard perm="hr.view"><Attendance /></Guard>} />
          <Route path="hr/leaves" element={<Guard perm="hr.view"><Leaves /></Guard>} />

          <Route path="notifications" element={<Guard perm="notifications.manage"><NotificationsAdmin /></Guard>} />
          <Route path="reports" element={<Guard perm="reports.view"><Reports /></Guard>} />
          <Route path="roles" element={<Guard perm="roles.manage"><Roles /></Guard>} />
          <Route path="staff" element={<Guard perm="staff.manage"><Staff /></Guard>} />
          <Route path="support" element={<Guard perm="support.manage"><Support /></Guard>} />
          <Route path="audit" element={<Guard perm="audit.view"><AuditLog /></Guard>} />
          <Route path="settings" element={<Guard perm="settings.manage"><Settings /></Guard>} />
          <Route path="profile" element={<Guard><Profile /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
