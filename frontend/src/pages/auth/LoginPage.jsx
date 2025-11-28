import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';

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
      // Wait a moment for user to be fetched, then redirect
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
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            UTORid:
            <input
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </label>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

