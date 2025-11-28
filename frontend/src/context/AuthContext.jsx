import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (utorid, password) => {
    try {
      const { token } = await loginApi(utorid, password);
      localStorage.setItem('authToken', token);
      await fetchUser();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

