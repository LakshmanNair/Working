import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../App.css'; // Ensure CSS is imported

const LoginPage = () => {
  const [utorid, setUtorid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(utorid, password);
    
    if (result.success) {
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const role = user?.role || 'regular';
        
        if (role === 'cashier') {
          navigate('/cashier/transactions/new');
        } else if (role === 'manager' || role === 'superuser') {
          navigate('/manager/dashboard');
        } else {
          navigate('/me/transactions');
        }
      }, 100);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>True Blue Rewards</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="login-error-wrapper">
            <ErrorMessage message={error} onDismiss={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="utorid">UTORid</label>
            <input
              id="utorid"
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              placeholder="e.g. shkvore2"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;