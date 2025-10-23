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
import ManagerDashboard from './pages/ManagerDashboard';
import TeamManagementPage from './pages/TeamManagementPage';
// New manager-specific pages
import ManagerOverview from './pages/ManagerOverview';
import IncomingTickets from './pages/IncomingTickets';
import OutgoingTickets from './pages/OutgoingTickets';
import TeamPerformance from './pages/TeamPerformance';
// New team member pages
import MyWork from './pages/MyWork';
import MyEscalations from './pages/MyEscalations';
import AssignedToMe from './pages/AssignedToMe';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  // Check if user needs to change password
  const mustChangePassword = user?.must_change_password;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
              {/* Conditional routing based on user role */}
              {user?.role === 'admin' ? (
                // Admin routes
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/tickets" element={<TicketsListPage />} />
                  <Route path="/tickets/new" element={<CreateTicketPage />} />
                  <Route path="/tickets/:ticketNumber" element={<TicketDetailPage />} />
                  <Route path="/users" element={<UsersManagementPage />} />
                  <Route path="/admin/settings" element={<SystemSettingsPage />} />
                  <Route path="/deletion-requests" element={<DeletionRequestsPage />} />
                  <Route path="/profile" element={<UserProfilePage />} />
                </>
              ) : user?.is_manager ? (
                // Manager routes
                <>
                  <Route path="/" element={<ManagerOverview />} />
                  <Route path="/incoming" element={<IncomingTickets />} />
                  <Route path="/outgoing" element={<OutgoingTickets />} />
                  <Route path="/my-team" element={<TeamManagementPage />} />
                  <Route path="/team-performance" element={<TeamPerformance />} />
                  <Route path="/tickets/new" element={<CreateTicketPage />} />
                  <Route path="/tickets/:ticketNumber" element={<TicketDetailPage />} />
                  <Route path="/deletion-requests" element={<DeletionRequestsPage />} />
                  {/* Legacy routes for backward compatibility */}
                  <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                  <Route path="/team-management" element={<TeamManagementPage />} />
                </>
              ) : (
                // Team member routes
                <>
                  <Route path="/" element={<MyWork />} />
                  <Route path="/assigned-to-me" element={<AssignedToMe />} />
                  <Route path="/my-escalations" element={<MyEscalations />} />
                  <Route path="/tickets/new" element={<CreateTicketPage />} />
                  <Route path="/tickets/:ticketNumber" element={<TicketDetailPage />} />
                  <Route path="/deletion-requests" element={<DeletionRequestsPage />} />
                </>
              )}
              
              {/* Common routes for all users */}
              <Route path="/profile" element={<UserProfilePage />} />
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
