
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Comprobando sesión...</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
