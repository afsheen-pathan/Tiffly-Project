import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// ICON IMAGES (you will replace paths)
import dashboardIcon from "../../assets/icons/dashboard.png";
import pendingIcon from "../../assets/icons/pending.png";
import providersIcon from "../../assets/icons/providers.png";
import customersIcon from "../../assets/icons/customers.png";
import transactionsIcon from "../../assets/icons/transactions.png";
import foodReportsIcon from "../../assets/icons/foodreports.png";
import logoutIcon from "../../assets/icons/logout.png";

const SidebarIcon = ({ src }: { src: string }) => (
  <img
    src={src}
    alt="icon"
    className="w-5 h-5 group-hover:opacity-100 transition"
  />
);

export const AdminLayout = () => {
  const { signOut } = useAuth();

  // MODERN pastel theme (NO blue)
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
     ${
       isActive
         ? "bg-indigo-100 text-indigo-700 shadow-sm" // pastel purple
         : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
     }`;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-white shadow-md border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-2xl font-bold text-indigo-600 tracking-wide">
            Tiffly Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={dashboardIcon} />
              <span>Dashboard</span>
            </div>
          </NavLink>

          <NavLink to="/pending-providers" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={pendingIcon} />
              <span>Pending Providers</span>
            </div>
          </NavLink>

          <NavLink to="/providers" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={providersIcon} />
              <span>All Providers</span>
            </div>
          </NavLink>

          <NavLink to="/customers" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={customersIcon} />
              <span>All Customers</span>
            </div>
          </NavLink>

          <NavLink to="/transactions" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={transactionsIcon} />
              <span>All Transactions</span>
            </div>
          </NavLink>

          <NavLink to="/food-reports" className={getNavLinkClass}>
            <div className="group flex items-center gap-3">
              <SidebarIcon src={foodReportsIcon} />
              <span>Food Waste Reports</span>
            </div>
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="border-t px-4 py-3">
          <button
            onClick={signOut}
            className="group flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition"
          >
            <SidebarIcon src={logoutIcon} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
