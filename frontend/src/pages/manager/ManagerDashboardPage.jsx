import { useState, useEffect } from 'react';
import { getSummary, getTransactionsPerDay, getPromotionUsage } from '../../api/analyticsApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManagerDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [promotionUsage, setPromotionUsage] = useState([]);
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
      const [summaryData, chartDataResponse, promotionUsageData] = await Promise.all([
        getSummary(),
        getTransactionsPerDay(days),
        getPromotionUsage(),
      ]);
      setSummary(summaryData);
      setChartData(chartDataResponse);
      setPromotionUsage(promotionUsageData);
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

      {/* Promotion Usage Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Promotion Usage Statistics</h2>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '1rem', 
          borderRadius: '8px',
          overflowX: 'auto'
        }}>
          {promotionUsage.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No promotions found
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f9f9f9' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Promotion Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>Total Redemptions</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>Total Uses</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>Unique Users</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Date Range</th>
                </tr>
              </thead>
              <tbody>
                {promotionUsage.map((promo) => (
                  <tr 
                    key={promo.id} 
                    style={{ 
                      borderBottom: '1px solid #eee'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem' }}>{promo.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: promo.type === 'automatic' ? '#e7f3ff' : '#fff7e7',
                        color: promo.type === 'automatic' ? '#0066cc' : '#cc6600'
                      }}>
                        {promo.type === 'automatic' ? 'Automatic' : 'One-Time'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {promo.totalRedemptions}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                      {promo.totalUses}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                      {promo.uniqueUsers}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: promo.isActive ? '#e7ffe7' : '#ffe7e7',
                        color: promo.isActive ? '#006600' : '#cc0000',
                        fontWeight: 'bold'
                      }}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                      {new Date(promo.startTime).toLocaleDateString()} - {new Date(promo.endTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Promotion Usage Chart */}
      {promotionUsage.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>Promotion Usage Comparison</h2>
          <div style={{ width: '100%', height: '400px', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
            <ResponsiveContainer>
              <BarChart data={promotionUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalUses" fill="#8884d8" name="Total Uses" />
                <Bar dataKey="uniqueUsers" fill="#82ca9d" name="Unique Users" />
                <Bar dataKey="totalRedemptions" fill="#ffc658" name="Total Redemptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboardPage;

