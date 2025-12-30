// src/pages/CustomerListPage.tsx

import { useState, useEffect } from "react";
import { getAllCustomers } from "../services/adminUserService";
import type { CustomerData } from "../services/adminUserService";
import { format } from "date-fns";

export const CustomerListPage = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { customers: list, error: fetchError } = await getAllCustomers();

      if (fetchError) setError(fetchError);
      else setCustomers(list);

      setLoading(false);
    };

    fetchData();
  }, []);

  /** Format Firestore Timestamp or JS Date */
  const formatDate = (timestamp: unknown): string => {
    try {
      if (!timestamp) return "N/A";
      let date: Date;

      if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        const tsWithToDate = timestamp as { toDate?: () => Date } | string | number;
        if (typeof tsWithToDate === "object" && typeof tsWithToDate?.toDate === "function") {
          date = tsWithToDate.toDate();
        } else {
          date = new Date(String(timestamp));
        }
      }

      return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Customers</h1>
        <p className="text-sm text-gray-500">
          View all registered customers on the Tiffly platform.
        </p>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600 text-sm">Loading customers...</p>}

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            
            {/* TABLE HEADER */}
            <thead className="bg-gray-50/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Email
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Joined On
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-all duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.email}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
};
