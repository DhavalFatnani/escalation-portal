import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import TicketsListPage from './pages/TicketsListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage';
import UsersManagementPage from './pages/UsersManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import DeletionRequestsPage from './pages/DeletionRequestsPage';
import UserProfilePage from './pages/UserProfilePage';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  // Check if user needs to change password
  const mustChangePassword = user?.must_change_password;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Password change route (accessible when authenticated) */}
        {isAuthenticated && (
          <Route path="/change-password" element={<ChangePasswordPage />} />
        )}
        
        {isAuthenticated ? (
          mustChangePassword ? (
            // Force password change if required
            <>
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="*" element={<Navigate to="/change-password" replace />} />
            </>
          ) : (
            // Normal authenticated routes
            <Route element={<Layout />}>
              <Route path="/" element={user?.role === 'admin' ? <AdminDashboard /> : <DashboardPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersManagementPage />} />
              <Route path="/admin/settings" element={<SystemSettingsPage />} />
              <Route path="/users" element={<UsersManagementPage />} />
              <Route path="/tickets" element={<TicketsListPage />} />
              <Route path="/tickets/new" element={<CreateTicketPage />} />
              <Route path="/tickets/:ticketNumber" element={<TicketDetailPage />} />
              <Route path="/deletion-requests" element={<DeletionRequestsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
