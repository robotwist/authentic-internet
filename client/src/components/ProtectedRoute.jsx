import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Simulate a brief authentication check delay
    const token = localStorage.getItem("token");
    setTimeout(() => {
      setIsAuthenticated(!!token); // Convert token existence to boolean
    }, 500);
  }, []);

  if (isAuthenticated === null) {
    return <p style={{ textAlign: "center", color: "#fff" }}>🔍 Checking authentication...</p>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
