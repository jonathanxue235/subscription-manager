import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import SubscriptionList from '../components/SubscriptionList';
import { stats, chartData, subscriptions } from '../data/mockData';
import '../common.css';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('6M');

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
            <button className="btn-primary">+ Add Subscription</button>
            <div className="profile-pic" title="User Profile"></div>
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
          <SubscriptionList subscriptions={subscriptions} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;