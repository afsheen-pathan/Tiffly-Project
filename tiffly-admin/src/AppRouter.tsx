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
import { FoodReportPage } from './pages/FoodReportPage'; // 1. Import the new page

export const AppRouter = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          // If not logged in, only show the login route
          <>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          // If logged in, wrap routes in the AdminLayout
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pending-providers" element={<PendingProvidersPage />} />
            <Route path="providers" element={<ProviderListPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="subscriptions" element={<SubscriptionListPage />} />
            <Route path="transactions" element={<TransactionListPage />} />
            <Route path="food-reports" element={<FoodReportPage />} /> {/* 2. Add the new route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback */}
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
};