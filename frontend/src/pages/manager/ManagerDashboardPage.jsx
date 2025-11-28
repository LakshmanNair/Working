import { useState, useEffect } from 'react';
import { getSummary, getTransactionsPerDay } from '../../api/analyticsApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManagerDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, chartDataResponse] = await Promise.all([
        getSummary(),
        getTransactionsPerDay(days),
      ]);
      setSummary(summaryData);
      setChartData(chartDataResponse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;
  if (!summary) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Manager Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Points Given</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.transactions.totalPointsGiven.toLocaleString()}
          </p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#ffe7e7', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Points Redeemed</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.transactions.totalPointsRedeemed.toLocaleString()}
          </p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#e7ffe7', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Transactions</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.transactions.totalTransactions.toLocaleString()}
          </p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: '#fff7e7', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Users</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {summary.users.total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction Type Breakdown */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Transaction Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <strong>Purchases:</strong> {summary.transactions.numPurchases}
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <strong>Redemptions:</strong> {summary.transactions.numRedemptions}
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <strong>Transfers:</strong> {summary.transactions.numTransfers}
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <strong>Adjustments:</strong> {summary.transactions.numAdjustments}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Transactions Over Time</h2>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ padding: '0.5rem' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        
        <div style={{ width: '100%', height: '400px', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Transaction Count" />
              <Line type="monotone" dataKey="purchases" stroke="#82ca9d" name="Purchases" />
              <Line type="monotone" dataKey="redemptions" stroke="#ffc658" name="Redemptions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;

