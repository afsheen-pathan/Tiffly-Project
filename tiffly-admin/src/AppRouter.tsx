// src/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AdminLogin } from './pages/AdminLogin';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PendingProvidersPage } from './pages/PendingProvidersPage';
import { ProviderListPage } from './pages/ProviderListPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { SubscriptionListPage } from './pages/SubscriptionListPage';
import { TransactionListPage } from './pages/TransactionListPage';
import { FoodReportPage } from './pages/FoodReportPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage'; // 1. Import the new page

export const AppRouter = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* --- 2. ADDED Public Routes --- */}
        {/* This route is public, no login required */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        
        {/* --- Login Route --- */}
        {!user && (
          <>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* --- 3. Protected Admin Routes --- */}
        {user && (
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pending-providers" element={<PendingProvidersPage />} />
            <Route path="providers" element={<ProviderListPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="subscriptions" element={<SubscriptionListPage />} />
            <Route path="transactions" element={<TransactionListPage />} />
            <Route path="food-reports" element={<FoodReportPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
};