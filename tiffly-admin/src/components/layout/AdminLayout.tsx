// src/components/layout/AdminLayout.tsx
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Placeholder icons
const DashboardIcon = () => <span>📊</span>;
const PendingIcon = () => <span>⏳</span>;
const ProvidersIcon = () => <span>👩‍🍳</span>;
const CustomerIcon = () => <span>👥</span>;
const TransactionsIcon = () => <span>💰</span>;
const FoodReportIcon = () => <span>💚</span>; // 1. Add new icon
const LogoutIcon = () => <span>🚪</span>;
// Removed unused icons

export const AdminLayout = () => {
  const { signOut } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex w-64 flex-col bg-white shadow-md">
        <div className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <span className="text-xl font-semibold text-blue-600">Tiffly Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <DashboardIcon /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/pending-providers" className={getNavLinkClass}>
            <PendingIcon /> <span>Pending Providers</span>
          </NavLink>
          <NavLink to="/providers" className={getNavLinkClass}>
            <ProvidersIcon /> <span>All Providers</span>
          </NavLink>
          <NavLink to="/customers" className={getNavLinkClass}>
            <CustomerIcon /> <span>All Customers</span>
          </NavLink>
          <NavLink to="/transactions" className={getNavLinkClass}>
            <TransactionsIcon /> <span>All Transactions</span>
          </NavLink>
          {/* --- 2. Add new NavLink for Food Reports --- */}
          <NavLink to="/food-reports" className={getNavLinkClass}>
            <FoodReportIcon /> <span>Food Waste Reports</span>
          </NavLink>
          {/* ------------------------------------------- */}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={signOut}
            className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogoutIcon /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};