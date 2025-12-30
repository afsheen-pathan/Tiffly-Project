// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    getRecentSubscriptions,
    getSubscriptionFrequencyCounts
} from '../services/adminAnalyticsService';
import type { CuisineDistributionData, SubscriptionFrequencyData } from '../services/adminAnalyticsService';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { StatCard } from '../components/ui/StatCard';

interface RevenueChartDataPoint {
  date: string;
  revenue: number;
}

const PIE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#ff7300', '#AF19FF', '#FF4560', '#00E396', '#FEB019',
  '#775DD0', '#00D9E9', '#FF66C3', '#9D5C0D', '#F9A3A4',
  '#546E7A', '#D4526E', '#8D5B4C', '#F86624', '#A5978B'
];


const yAxisCurrencyFormatter = (tick: number) => `₹${tick}`;

export const DashboardPage = () => {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(null);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const [errorCustomers, setErrorCustomers] = useState<string | null>(null);
  const [errorProviders, setErrorProviders] = useState<string | null>(null);
  const [errorSubscriptions, setErrorSubscriptions] = useState<string | null>(null);

  const [lineChartData, setLineChartData] = useState<RevenueChartDataPoint[]>([]);
  const [cuisineData, setCuisineData] = useState<CuisineDistributionData[]>([]);
  const [barChartData, setBarChartData] = useState<SubscriptionFrequencyData[]>([]);

  const [loadingLineChart, setLoadingLineChart] = useState(true);
  const [loadingCuisineChart, setLoadingCuisineChart] = useState(true);
  const [loadingBarChart, setLoadingBarChart] = useState(true);

  const [errorChart, setErrorChart] = useState<string | null>(null);

  // ---------------- CUSTOMER COUNT ----------------
  useEffect(() => {
    setLoadingCustomers(true); setErrorCustomers(null);
    const q = query(collection(db, "users"), where("role", "==", "customer"));
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const c = await getCountFromServer(snap.query);
        setCustomerCount(c.data().count);
      } catch (err) {
        setErrorCustomers("Error");
        console.error(err);
      } finally {
        setLoadingCustomers(false);
      }
    });
    return unsub;
  }, []);

  // ---------------- PROVIDER COUNT ----------------
  useEffect(() => {
    setLoadingProviders(true); setErrorProviders(null);
    const q = query(collection(db, "providerProfiles"), where("status", "==", "approved"));
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const c = await getCountFromServer(snap.query);
        setProviderCount(c.data().count);
      } catch (err) {
        setErrorProviders("Error");
        console.error(err);
      } finally {
        setLoadingProviders(false);
      }
    });
    return unsub;
  }, []);

  // ---------------- SUBSCRIPTION COUNT ----------------
  useEffect(() => {
    setLoadingSubscriptions(true); setErrorSubscriptions(null);
    const q = query(collection(db, "subscriptions"), where("status", "==", "active"));
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const c = await getCountFromServer(snap.query);
        setSubscriptionCount(c.data().count);
      } catch (err) {
        setErrorSubscriptions("Error");
        console.error(err);
      } finally {
        setLoadingSubscriptions(false);
      }
    });
    return unsub;
  }, []);

  // ---------------- DAILY REVENUE CHART ----------------
  useEffect(() => {
    const fetchLineData = async () => {
      setLoadingLineChart(true);
      setErrorChart(null);

      const days = 30;
      const { data: recentSubs, error } = await getRecentSubscriptions(days);
      if (error) {
        setErrorChart(error);
        setLineChartData([]);
        setLoadingLineChart(false);
        return;
      }

      const revenueByDay: Record<string, number> = {};

      recentSubs.forEach(s => {
        if (s.createdAt && typeof (s.createdAt as Timestamp).toDate === 'function') {
          const dateStr = format((s.createdAt as Timestamp).toDate(), 'MMM d');
          const revenue = s.pricePaid || 0;
          revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + revenue;
        }
      });

      const end = startOfDay(new Date());
      const start = startOfDay(subDays(end, days - 1));
      let range: Date[] = [];

      try {
        range = eachDayOfInterval({ start, end });
      } catch {
        range = [start];
      }

      const processed: RevenueChartDataPoint[] = range.map(d => {
        const ds = format(d, 'MMM d');
        return { date: ds, revenue: parseFloat((revenueByDay[ds] || 0).toFixed(2)) };
      });

      setLineChartData(processed);
      setLoadingLineChart(false);
    };

    fetchLineData();
  }, []);

  // ---------------- CUISINE PIE CHART (UPDATED) ----------------
  useEffect(() => {
    setLoadingCuisineChart(true);
    setErrorChart(null);

    const q = query(collection(db, "providerProfiles"), where("status", "==", "approved"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        try {
          const counts: Record<string, number> = {};

          snap.forEach((doc) => {
            const data = doc.data();
            const cuisineField = data.cuisineType;

            if (!cuisineField) return;

            let cuisines: string[] = [];

            if (Array.isArray(cuisineField)) {
              cuisines = cuisineField.map((c: string) =>
                c.trim().replace(/\s+/g, " ")
              );
            } else if (typeof cuisineField === "string") {
              cuisines = cuisineField
                .split(",")
                .map((c) => c.trim().replace(/\s+/g, " "));
            }

            cuisines.forEach((cuisine) => {
              if (!cuisine) return;
              counts[cuisine] = (counts[cuisine] || 0) + 1;
            });
          });

          const distributionData = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
          }));

          setCuisineData(distributionData);
        } catch (err) {
          console.error(err);
          setErrorChart("Error loading cuisine data");
          setCuisineData([]);
        } finally {
          setLoadingCuisineChart(false);
        }
      },
      (err) => {
        console.error(err);
        setErrorChart("Error loading cuisine data");
        setCuisineData([]);
        setLoadingCuisineChart(false);
      }
    );

    return unsub;
  }, []);

  // ---------------- BAR CHART (FREQUENCY) ----------------
  useEffect(() => {
    const fetchBarData = async () => {
      setLoadingBarChart(true);
      const { data, error } = await getSubscriptionFrequencyCounts();

      if (error) {
        setErrorChart(error);
        setBarChartData([]);
      } else {
        setBarChartData(data);
      }

      setLoadingBarChart(false);
    };
    fetchBarData();
  }, []);

  const renderCardContent = (loading: boolean, error: string | null, count: number | null) => {
    if (loading) return <p className="animate-pulse text-gray-400">Loading...</p>;
    if (error) return <p className="text-red-500 text-xs break-words">{error}</p>;
    return <p className="text-3xl font-bold text-gray-900">{count ?? 0}</p>;
  };

  const renderChartPlaceholder = (loading: boolean, specificError: string | null, defaultText: string) => {
    const displayError = specificError || errorChart;

    if (loading) return <p className="animate-pulse text-gray-400">Loading chart...</p>;

    if (displayError?.includes('index')) {
      return (
        <div className="my-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-700">
          <p className="font-bold">Action Required:</p>
          <p className="break-words">{displayError}</p>
          <p className="mt-2">Create the Firestore index and refresh.</p>
        </div>
      );
    }

    if (displayError) return <p className="text-red-500">{displayError}</p>;

    return <p className="text-gray-500">{defaultText}</p>;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Admin Dashboard</h1>

     
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

  {/* Total Customers */}
  <Link
    to="/customers"
    className="block rounded-xl bg-indigo-50 border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-medium text-indigo-700">Total Customers</h2>
      <span className="text-xl">👥</span>
    </div>
    {renderCardContent(loadingCustomers, errorCustomers, customerCount)}
  </Link>

  {/* Approved Providers */}
  <Link
    to="/providers"
    className="block rounded-xl bg-emerald-50 border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-medium text-emerald-700">Approved Providers</h2>
      <span className="text-xl">👩‍🍳</span>
    </div>
    {renderCardContent(loadingProviders, errorProviders, providerCount)}
  </Link>

  {/* Active Subscriptions */}
  <Link
    to="/subscriptions"
    className="block rounded-xl bg-amber-50 border border-amber-100 p-6 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-medium text-amber-700">Active Subscriptions</h2>
      <span className="text-xl">📦</span>
    </div>
    {renderCardContent(
      loadingSubscriptions,
      errorSubscriptions,
      subscriptionCount
    )}
  </Link>

</div>

<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">

  {/* ⭐ LINE CHART — Indigo (Light Pastel) */}
  <div className="lg:col-span-2 rounded-xl bg-indigo-50 p-6 shadow-sm border border-indigo-100">
    <h2 className="mb-6 text-lg font-semibold text-indigo-700">
      Daily Revenue (Last 30 Days)
    </h2>

    {loadingLineChart || errorChart || lineChartData.length === 0 ? (
      renderChartPlaceholder(loadingLineChart, null, "No revenue data available.")
    ) : (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={lineChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcdcdc" />
          <XAxis dataKey="date" fontSize={12} tick={{ fill: "#4b5563" }} />
          <YAxis
            fontSize={12}
            tickFormatter={yAxisCurrencyFormatter}
            tick={{ fill: "#4b5563" }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366F1"  // soft indigo
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>

  {/* ⭐ PIE CHART — Emerald (Light Pastel) */}
  <div className="rounded-xl bg-emerald-50 p-6 shadow-sm border border-emerald-100">
    <h2 className="mb-6 text-lg font-semibold text-emerald-700">
      Providers by Cuisine
    </h2>

    {loadingCuisineChart || cuisineData.length === 0 ? (
      renderChartPlaceholder(loadingCuisineChart, null, "No provider cuisine data available.")
    ) : (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={cuisineData}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            label={(props: any) =>
              `${props.name} (${(props.percent * 100).toFixed(0)}%)`
            }
          >
            {cuisineData.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>

  {/* ⭐ BAR CHART — Amber (Light Pastel) */}
  <div className="rounded-xl bg-amber-50 p-6 shadow-sm border border-amber-100">
    <h2 className="mb-6 text-lg font-semibold text-amber-700">
      Subscriptions by Frequency
    </h2>

    {loadingBarChart || barChartData.length === 0 ? (
      renderChartPlaceholder(loadingBarChart, null, "No active subscription data.")
    ) : (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={barChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcdcdc" />
          <XAxis dataKey="name" fontSize={12} tick={{ fill: "#4b5563" }} />
          <YAxis fontSize={12} tick={{ fill: "#4b5563" }} />
          <Tooltip />
          <Bar
            dataKey="count"
            name="Active Subs"
            fill="#F59E0B"  // soft amber tone for bars
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>

</div>
    </div>
  );
} 
