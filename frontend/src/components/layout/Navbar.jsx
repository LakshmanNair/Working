import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <nav style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
            CSSU Rewards
          </Link>
          <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>
            Login
          </Link>
        </div>
      </nav>
    );
  }

  const role = user?.role || 'regular';

  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
            CSSU Rewards
          </Link>
          
          {role === 'regular' && (
            <>
              <Link to="/me/transactions" style={{ textDecoration: 'none', color: '#333' }}>My Transactions</Link>
              <Link to="/me/transfer" style={{ textDecoration: 'none', color: '#333' }}>Transfer Points</Link>
              <Link to="/me/events" style={{ textDecoration: 'none', color: '#333' }}>Events</Link>
              <Link to="/organizer/events" style={{ textDecoration: 'none', color: '#333' }}>My Events</Link>
              <Link to="/me/redemption" style={{ textDecoration: 'none', color: '#333' }}>Redemption</Link>
              <Link to="/promotions" style={{ textDecoration: 'none', color: '#333' }}>Promotions</Link>
            </>
          )}
          
          {role === 'cashier' && (
            <>
                <Link to="/cashier/transactions/new" style={{ textDecoration: 'none', color: '#333' }}>New Purchase</Link>
                <Link to="/cashier/redemptions/process" style={{ textDecoration: 'none', color: '#333' }}>Process Redemption</Link>            
            </>
          )}
          
          {(role === 'manager' || role === 'superuser') && (
            <>
              <Link to="/manager/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
              <Link to="/manager/users" style={{ textDecoration: 'none', color: '#333' }}>Users</Link>
              <Link to="/manager/events" style={{ textDecoration: 'none', color: '#333' }}>Events</Link>
              <Link to="/manager/transactions" style={{ textDecoration: 'none', color: '#333' }}>Transactions</Link>
              <Link to="/me/redemption" style={{ textDecoration: 'none', color: '#333' }}>Redemption</Link>
              <Link to="/manager/promotions" style={{ textDecoration: 'none', color: '#333' }}>Promotions</Link>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>
            <Link to="/me/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
              {user?.utorid} ({user?.points || 0} pts)
            </Link>          
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

