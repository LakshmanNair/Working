import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Cashier pages
import CreateTransactionPage from './pages/cashier/CreateTransactionPage';

// Manager pages
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import TransactionsListPage from './pages/manager/TransactionsListPage';
import PromotionsListPage from './pages/manager/PromotionsListPage';

// Placeholder for promotion pages (to be created)
const PromotionsPage = () => <div>Promotions Page (Regular View)</div>;
const PromotionCreateEditPage = () => <div>Create/Edit Promotion</div>;
const TransactionDetailPage = () => <div>Transaction Detail</div>;
const ProcessRedemptionPage = () => <div>Process Redemption</div>;

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
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
