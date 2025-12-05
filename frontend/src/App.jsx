import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import RequireAuth from './components/common/RequireAuth';
import Loader from './components/common/Loader';

// Auth pages
import LoginPage from './pages/auth/LoginPage';

// Regular user pages
import MyTransactionsPage from './pages/regular/MyTransactionsPage';
import TransferPointsPage from './pages/regular/TransferPointsPage';
import RedemptionRequestPage from './pages/regular/RedemptionRequestPage';
import RedemptionQRCodePage from './pages/regular/RedemptionQRCodePage';
import PromotionsPage from './pages/regular/PromotionsPage'; // Public view

// Cashier pages
import CreateTransactionPage from './pages/cashier/CreateTransactionPage';
import ProcessRedemptionPage from './pages/cashier/ProcessRedemptionPage'; // Fixed import

// Manager pages
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import TransactionsListPage from './pages/manager/TransactionsListPage';
import TransactionDetailPage from './pages/manager/TransactionDetailPage'; // Fixed import
import PromotionsListPage from './pages/manager/PromotionsListPage';
import PromotionCreateEditPage from './pages/manager/PromotionCreateEditPage';
import UsersListPage from './pages/manager/UsersListPage';
import UserDetailPage from './pages/manager/UserDetailPage';
import ManagerEventsListPage from './pages/manager/ManagerEventsListPage';
import ManagerEventDetailPage from './pages/manager/ManagerEventDetailPage';

// Profile pages
import ProfilePage from './pages/profile/ProfilePage';

// Event pages
import EventsListPage from './pages/events/EventsListPage';
import EventDetailPage from './pages/events/EventDetailPage';

// Organizer pages
import MyEventsPage from './pages/organizer/MyEventsPage';
import EventAwardPointsPage from './pages/organizer/EventAwardPointsPage';

// Layout Component to handle Navbar visibility
const Layout = ({ children }) => {
  const location = useLocation();
  // Hide Navbar only on the login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: showNavbar ? '#f5f5f5' : '#242424' }}>
      {showNavbar && <Navbar />}
      {children}
    </div>
  );
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Regular user routes */}
      <Route
        path="/me/transactions"
        element={
          <RequireAuth>
            <MyTransactionsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/transfer"
        element={
          <RequireAuth>
            <TransferPointsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/redemption"
        element={
          <RequireAuth>
            <RedemptionRequestPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/redemption/:transactionId/qr"
        element={
          <RequireAuth>
            <RedemptionQRCodePage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/events"
        element={
          <RequireAuth>
            <EventsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/myevents"
        element={
          <RequireAuth>
            <MyEventsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/organizer/events/:eventId"
        element={
          <RequireAuth>
            <EventAwardPointsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/events/:eventId"
        element={
          <RequireAuth>
            <EventDetailPage />
          </RequireAuth>
        }
      />

      {/* Cashier routes */}
      <Route
        path="/cashier/transactions/new"
        element={
          <RequireAuth requiredRole="cashier">
            <CreateTransactionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/cashier/redemptions/process"
        element={
          <RequireAuth requiredRole="cashier">
            <ProcessRedemptionPage />
          </RequireAuth>
        }
      />
      
      {/* Manager routes */}
      <Route
        path="/manager/dashboard"
        element={
          <RequireAuth requiredRole="manager">
            <ManagerDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/transactions"
        element={
          <RequireAuth requiredRole="manager">
            <TransactionsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/transactions/:id"
        element={
          <RequireAuth requiredRole="manager">
            <TransactionDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/promotions"
        element={
          <RequireAuth requiredRole="manager">
            <PromotionsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/promotions/new"
        element={
          <RequireAuth requiredRole="manager">
            <PromotionCreateEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/promotions/:id/edit"
        element={
          <RequireAuth requiredRole="manager">
            <PromotionCreateEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/users"
        element={
          <RequireAuth requiredRole="manager">
            <UsersListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/users/:userId"
        element={
          <RequireAuth requiredRole="manager">
            <UserDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/events"
        element={
          <RequireAuth requiredRole="manager">
            <ManagerEventsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/manager/events/:eventId"
        element={
          <RequireAuth>
            <ManagerEventDetailPage />
          </RequireAuth>
        }
      />

      {/* Organizer routes */}
      <Route
        path="/organizer/events"
        element={
          <RequireAuth>
            <MyEventsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/organizer/events/:eventId"
        element={
          <RequireAuth>
            <EventAwardPointsPage/>
          </RequireAuth>
        }
      />
      
      {/* Public promotions page */}
      <Route
        path="/promotions"
        element={
          <RequireAuth>
            <PromotionsPage />
          </RequireAuth>
        }
      />
      
      {/* Default redirect */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Navigate to="/me/transactions" replace />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;