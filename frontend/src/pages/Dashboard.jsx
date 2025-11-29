import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import SubscriptionList from '../components/SubscriptionList';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import ProfileDropdown from '../components/ProfileDropdown';
import '../common.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('6M');
  const [subscriptions, setSubscriptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState([
    { label: "Total Monthly Cost", value: "$0.00" },
    { label: "Active Subscriptions", value: "0" },
    { label: "Next Renewal", value: "N/A" }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [subscriptionsRes, statsRes, historyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/subscriptions`, { headers }),
        fetch(`${BACKEND_URL}/api/subscriptions/stats`, { headers }),
        fetch(`${BACKEND_URL}/api/subscriptions/history`, { headers })
      ]);

      if (!subscriptionsRes.ok || !statsRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const subscriptionsData = await subscriptionsRes.json();
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();

      // Transform subscriptions to match UI format
      const formattedSubscriptions = subscriptionsData.map(sub => ({
        id: sub.id,
        name: sub.name,
        status: sub.status,
        frequency: sub.frequency,
        custom_frequency_days: sub.custom_frequency_days,
        startDate: sub.start_date,
        renewalDate: new Date(sub.renewal_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        cost: `$${parseFloat(sub.cost).toFixed(2)}`,
        logo: sub.logo || sub.name.charAt(0).toUpperCase()
      }));

      // Transform stats to match UI format
      const formattedStats = [
        {
          label: "Total Monthly Cost",
          value: `$${statsData.totalMonthlyCost}`
        },
        {
          label: "Active Subscriptions",
          value: statsData.activeSubscriptions.toString()
        },
        {
          label: "Next Renewal",
          value: statsData.nextRenewal
            ? new Date(statsData.nextRenewal.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'N/A',
          subtext: statsData.nextRenewal ? statsData.nextRenewal.name : undefined
        }
      ];

      setSubscriptions(formattedSubscriptions);
      setStats(formattedStats);
      setChartData(historyData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getFilteredData = () => {
    const totalPoints = chartData.length;
    switch (timeRange) {
      case '1M': return chartData.slice(totalPoints - 1);
      case '3M': return chartData.slice(totalPoints - 3);
      case '6M': return chartData.slice(totalPoints - 6);
      case '1Y': return chartData.slice(totalPoints - 12);
      case 'MAX': return chartData;
      default: return chartData.slice(totalPoints - 6);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
          <p style={{ color: '#ef4444' }}>Error: {error}</p>
          <button className="btn-primary" onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* <aside className="sidebar">
        <div className="sidebar-logo">SubManager</div>
        <nav>
          <a href="#" className="nav-item active">
            <LayoutDashboard size={18} style={{ marginRight: 10 }} />
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <CreditCard size={18} style={{ marginRight: 10 }} />
            My Subscriptions
          </a>
          <a href="#" className="nav-item">
            <PieChart size={18} style={{ marginRight: 10 }} />
            Analytics
          </a>
          <a href="#" className="nav-item">
            <Settings size={18} style={{ marginRight: 10 }} />
            Settings
          </a>
        </nav>
      </aside> */}

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
          </div>

          <div className="header-right">
            {/* Button moved here */}
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + Add Subscription
            </button>
            <ProfileDropdown />
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </section>

        <section className="chart-section">
          <div className="chart-header">
            <h2 className="section-title">Historical Subscription Cost</h2>
            <div className="filter-buttons">
              {['1M', '3M', '6M', '1Y', 'MAX'].map((range) => (
                <button
                  key={range}
                  className={`filter-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getFilteredData()}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#717E8E', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#717E8E', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7FC' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="cost"
                  fill="#137FEC"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="section-title">Subscription History</h2>
          <SubscriptionList subscriptions={subscriptions} onDelete={fetchDashboardData} />
        </section>
      </main>

      <AddSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;