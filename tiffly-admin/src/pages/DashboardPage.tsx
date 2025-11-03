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
    getProviderCuisineDistribution,
    getSubscriptionFrequencyCounts
} from '../services/adminAnalyticsService';
// Use type-only import
import type { SubscriptionChartData, CuisineDistributionData, SubscriptionFrequencyData } from '../services/adminAnalyticsService';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

// Type for processed line chart data point
interface RevenueChartDataPoint {
  date: string;
  revenue: number; // Changed from 'count'
}

// Define colors for the Pie Chart
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

// Helper function to format currency for Tooltip
const formatTooltipCurrency = (value: number | string) => {
    if (typeof value === 'number') {
        return `₹${value.toFixed(2)}`;
    }
    return value; // Return as is if not a number
};
// Helper to format Y-axis ticks
const yAxisCurrencyFormatter = (tick: number) => `₹${tick}`;


export const DashboardPage = () => {
  // --- State Variables ---
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [errorCustomers, setErrorCustomers] = useState<string | null>(null);
  const [errorProviders, setErrorProviders] = useState<string | null>(null);
  const [errorSubscriptions, setErrorSubscriptions] = useState<string | null>(null);
  
  // Chart States
  const [lineChartData, setLineChartData] = useState<RevenueChartDataPoint[]>([]); // This will hold revenue
  const [pieChartData, setPieChartData] = useState<CuisineDistributionData[]>([]);
  const [barChartData, setBarChartData] = useState<SubscriptionFrequencyData[]>([]);
  const [loadingLineChart, setLoadingLineChart] = useState(true);
  const [loadingPieChart, setLoadingPieChart] = useState(true);
  const [loadingBarChart, setLoadingBarChart] = useState(true);
  const [errorChart, setErrorChart] = useState<string | null>(null); // General chart error state

  // --- Listener for Customer Count ---
  useEffect(() => {
    setLoadingCustomers(true);
    setErrorCustomers(null);
    const customerQuery = query(collection(db, "users"), where("role", "==", "customer"));
    const unsubscribe = onSnapshot(customerQuery, async (snapshot) => {
        try {
          const countResult = await getCountFromServer(snapshot.query);
          setCustomerCount(countResult.data().count);
        } catch (err) { setErrorCustomers("Count error."); console.error(err); }
        finally { setLoadingCustomers(false); }
      }, (err) => { setErrorCustomers("Listener error."); setLoadingCustomers(false); console.error(err); }
    );
    return unsubscribe;
  }, []);

  // --- Listener for Approved Provider Count ---
  useEffect(() => {
    setLoadingProviders(true);
    setErrorProviders(null);
    const providerQuery = query( collection(db, "providerProfiles"), where("status", "==", "approved") );
    const unsubscribe = onSnapshot(providerQuery, async (snapshot) => {
        try {
          const countResult = await getCountFromServer(snapshot.query);
          setProviderCount(countResult.data().count);
        } catch (err) { setErrorProviders("Count error."); console.error(err); }
        finally { setLoadingProviders(false); }
      }, (err) => { setErrorProviders("Listener error."); setLoadingProviders(false); console.error(err); }
    );
    return unsubscribe;
  }, []);

  // --- Listener for Active Subscription Count ---
  useEffect(() => {
    setLoadingSubscriptions(true);
    setErrorSubscriptions(null);
    const subscriptionQuery = query( collection(db, "subscriptions"), where("status", "==", "active") );
    const unsubscribe = onSnapshot( subscriptionQuery, async (snapshot) => {
        try {
          const countResult = await getCountFromServer(snapshot.query);
          setSubscriptionCount(countResult.data().count);
        } catch (err: unknown) {
          console.error("Error getting subscription count:", err);
          let errorMessage = "Subscription count error.";
          if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'failed-precondition' && 'message' in err) {
             const indexUrlMatch = (err as { message: string }).message.match(/(https:\/\/[^\s]+)/);
             errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
          }
          setErrorSubscriptions(errorMessage);
        } finally { setLoadingSubscriptions(false); }
      }, (err) => { setErrorSubscriptions("Listener error."); setLoadingSubscriptions(false); console.error(err); }
    );
    return unsubscribe;
  }, []);

  // --- useEffect for Line Chart Data (Revenue) ---
  useEffect(() => {
    const fetchLineData = async () => {
        setLoadingLineChart(true);
        setErrorChart(null);
        const days = 30;
        const { data: recentSubs, error } = await getRecentSubscriptions(days);
        if (error) {
            console.error("Error fetching line chart data:", error);
            setErrorChart(prev => prev ? `${prev}\nLine: ${error}` : `Line: ${error}`);
            setLineChartData([]); setLoadingLineChart(false); return;
        }
        
        // Process data: Group REVENUE by day
        const revenueByDay: { [k: string]: number } = {};
        recentSubs.forEach(s => {
             if (s.createdAt && typeof (s.createdAt as Timestamp)?.toDate === 'function') {
                const dateStr = format((s.createdAt as Timestamp).toDate(), 'MMM d');
                const revenue = s.pricePaid || 0; // Use pricePaid (in Rupees)
                revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + revenue;
             }
        });
        
        const end = startOfDay(new Date()); const start = startOfDay(subDays(end, days - 1));
        let range: Date[] = []; try { range = eachDayOfInterval({ start, end }); } catch (e) { range = [start]; console.error("Date range error:", e); }
        
        const processed: RevenueChartDataPoint[] = range.map(d => {
            const ds = format(d, 'MMM d');
            return {
                date: ds,
                revenue: parseFloat((revenueByDay[ds] || 0).toFixed(2)) // Use revenue
            };
        });
        
        setLineChartData(processed);
        setLoadingLineChart(false);
    };
    fetchLineData();
  }, []);

  // --- useEffect for Pie Chart Data (Cuisine) ---
  useEffect(() => {
    const fetchPieData = async () => {
        setLoadingPieChart(true);
        console.log("Fetching data for cuisine pie chart...");
        const { data, error } = await getProviderCuisineDistribution();
        if (error) {
            console.error("Error fetching pie chart data:", error);
            setErrorChart(prev => prev ? `${prev}\nPie: ${error}` : `Pie: ${error}`);
            setPieChartData([]);
        } else {
            setPieChartData(data);
        }
        setLoadingPieChart(false);
    };
    fetchPieData();
  }, []);

  // --- useEffect for Bar Chart Data (Frequency) ---
  useEffect(() => {
    const fetchBarData = async () => {
        setLoadingBarChart(true);
        console.log("Fetching data for frequency bar chart...");
        const { data, error } = await getSubscriptionFrequencyCounts();
        if (error) {
            console.error("Error fetching bar chart data:", error);
            setErrorChart(prev => prev ? `${prev}\nBar: ${error}` : `Bar: ${error}`);
            setBarChartData([]);
        } else {
            setBarChartData(data);
        }
        setLoadingBarChart(false);
    };
    fetchBarData();
  }, []);
  
  // --- Helper Functions ---
  const renderCardContent = (loading: boolean, error: string | null, count: number | null) => {
      if (loading) return <p className="animate-pulse text-gray-400">Loading...</p>;
      if (error && !error.includes('index')) return <p className="text-red-500 text-xs break-words">{error}</p>;
      if (error?.includes('index')) return <p className="text-yellow-600 text-xs break-words">Index needed</p>;
      return <p className="text-3xl font-bold text-gray-900">{count ?? 0}</p>;
  };
  const renderChartPlaceholder = (loading: boolean, specificError: string | null, defaultText: string) => {
      // Use general error state if no specific one is provided
      const displayError = specificError || errorChart;
      if (loading) return <p className="animate-pulse text-gray-400">Loading chart...</p>;

      if (displayError?.includes('index')) {
        return ( <div className="my-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-700"> <p className="font-bold">Action Required:</p> <p className="break-words">{displayError}</p> <p className="mt-2">Create the Firestore index and refresh.</p> </div> );
      }
      if (displayError) return <p className="text-red-500">{displayError}</p>;
      return <p className="text-gray-500">{defaultText}</p>;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Admin Dashboard</h1>

      {/* --- Count Cards --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link to="/customers" className="block rounded-lg bg-white p-6 shadow transition hover:shadow-lg">
          <h2 className="mb-2 text-sm font-medium text-gray-500">Total Customers</h2>
          {renderCardContent(loadingCustomers, errorCustomers, customerCount)}
        </Link>
        <Link to="/providers" className="block rounded-lg bg-white p-6 shadow transition hover:shadow-lg">
          <h2 className="mb-2 text-sm font-medium text-gray-500">Approved Providers</h2>
          {renderCardContent(loadingProviders, errorProviders, providerCount)}
        </Link>
        <Link to="/subscriptions" className="block rounded-lg bg-white p-6 shadow transition hover:shadow-lg">
           <h2 className="mb-2 text-sm font-medium text-gray-500">Active Subscriptions</h2>
           {renderCardContent(loadingSubscriptions, errorSubscriptions, subscriptionCount)}
        </Link>
      </div>
      {/* --- End Count Cards --- */}

      {/* --- Charts Section --- */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Line Chart Card (Revenue) */}
        <div className="rounded-lg bg-white p-4 shadow lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Daily Revenue (Last 30 Days)</h2>
          {loadingLineChart || (errorChart && !pieChartData.length && !barChartData.length) || lineChartData.length === 0 ? (
            renderChartPlaceholder(loadingLineChart, errorChart?.includes('Line:') ? errorChart : null, "No revenue data available for the last 30 days.")
          ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" fontSize={12} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} fontSize={12} width={50} tickFormatter={yAxisCurrencyFormatter} />
                  <Tooltip formatter={(value: number) => [formatTooltipCurrency(value), "Revenue"]} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Total Revenue (₹)" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           )}
        </div>

        {/* Pie Chart Card (Cuisine) */}
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Providers by Cuisine</h2>
           {loadingPieChart || (errorChart && !lineChartData.length && !barChartData.length) || pieChartData.length === 0 ? (
            renderChartPlaceholder(loadingPieChart, errorChart?.includes('Pie:') ? errorChart : null, "No approved provider data found.")
           ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={pieChartData as any} // Use 'as any' to bypass Recharts type issue
                            cx="50%" cy="50%" labelLine={false}
                            outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name"
                            // Explicitly type the label props
                            label={(props: { name: string; percent: number }) => 
                                `${props.name} ${(props.percent * 100).toFixed(0)}%`
                            }
                        >
                            {/* Remove unused 'entry' parameter */}
                            {pieChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value} Providers`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
           )}
        </div>

        {/* Bar Chart Card (Frequency) */}
        <div className="rounded-lg bg-white p-4 shadow">
           <h2 className="mb-4 text-lg font-semibold text-gray-700">Subscriptions by Frequency</h2>
           {loadingBarChart || (errorChart && !lineChartData.length && !pieChartData.length) || barChartData.length === 0 || !barChartData.some(d => d.count > 0) ? (
            renderChartPlaceholder(loadingBarChart, errorChart?.includes('Bar:') ? errorChart : null, "No active subscription frequency data.")
           ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} width={40}/>
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" name="Active Subs"/>
                    </BarChart>
                </ResponsiveContainer>
           )}
        </div>

      </div>
      {/* --- End Charts Section --- */}
    </div>
  );
};