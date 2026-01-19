import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Higher-order component to protect routes based on authentication and permissions.
 */
export const ProtectedRoute = ({ children, permission }) => {
    const { user, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />; // Redirect to dashboard if unauthorized
    }

    return children;
};

/**
 * Component to conditionally render UI elements based on permissions.
 */
export const PermissionGate = ({ children, permission, fallback = null }) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
        return fallback;
    }

    return children;
};
