// src/pages/FoodReportPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  getFoodReportsByStatus,
  markFoodReportAsHandled,
} from "../services/adminFoodReportService";
import type { FoodReport } from "../services/adminFoodReportService";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export const FoodReportPage = () => {
  const [reports, setReports] = useState<FoodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch new reports */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { reports: data, error: fetchErr } = await getFoodReportsByStatus("new");

    if (fetchErr) setError(fetchErr);
    else setReports(data);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /** Mark report as handled */
  const handleMarkAsHandled = async (reportId: string) => {
    if (!window.confirm("Are you sure you have handled this food report?")) return;

    const { error: updateErr } = await markFoodReportAsHandled(reportId);

    if (updateErr) alert(`Failed: ${updateErr}`);
    else {
      alert("Report marked as handled.");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  /** Format timestamp */
  const formatDate = (ts: any) => {
    try {
      let date: Date;
      if (!ts) return "N/A";

      if (ts instanceof Timestamp) date = ts.toDate();
      else if (ts instanceof Date) date = ts;
      else date = new Date(String(ts));

      return isNaN(date.getTime())
        ? "Invalid Date"
        : format(date, "MMM d, yyyy h:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          New Food Waste Reports
        </h1>
        <p className="text-sm text-gray-500">
          Review active reports submitted by providers.
        </p>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600 text-sm">Loading reports...</p>}

      {/* Firestore Index Error */}
      {error?.includes("index") && (
        <div className="my-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-700 shadow-sm">
          <strong>Firestore Index Required:</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Other Errors */}
      {error && !error.includes("index") && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Reports Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">

            {/* TABLE HEADER */}
            <thead className="bg-gray-50/70">
              <tr>
                {[
                  "Kitchen Name",
                  "Contact / Address",
                  "Food Details",
                  "Quantity",
                  "Pickup By",
                  "Reported On",
                  "Action",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="bg-white divide-y divide-gray-100">
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No new food reports.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-all duration-150"
                  >
                    {/* Kitchen */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {report.kitchenName}
                    </td>

                    {/* Contact + Address */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-pre-line">
                      <p className="font-medium">{report.providerPhone}</p>
                      <p className="text-gray-500 text-xs">{report.providerAddress}</p>
                    </td>

                    {/* Food Details */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-pre-line">
                      {report.foodDescription}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {report.quantity}
                    </td>

                    {/* Pickup Deadline */}
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {report.pickupByTime}
                    </td>

                    {/* Reported On */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(report.createdAt)}
                    </td>

                    {/* ACTION BUTTON */}
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleMarkAsHandled(report.id)}
                        className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                      >
                        Mark as Handled
                      </button>
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
