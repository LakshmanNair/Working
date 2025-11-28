import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const RequireAuth = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'superuser') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;

