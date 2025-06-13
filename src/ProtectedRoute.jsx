// ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();
  const userType = localStorage.getItem("userType");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const checkAuth = async () => {
      // Allow STAFF and ADMIN access to their routes if token exists
      if (token && (userType === "STAFF" || userType === "ADMIN")) {
        setIsAuthenticated(true);
        return;
      }

      // For customer routes (/table/:tableNumber), perform IP check
      if (location.pathname.startsWith("/table/")) {
        const tableNumber = location.pathname.split("/")[2];
        try {
          await axios.get(`/api/captive/check-ip?tableNumber=${tableNumber}`);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Lỗi khi kiểm tra IP:", error);
          setIsAuthenticated(false);
        }
      } else {
        // For non-customer routes, require a valid token
        setIsAuthenticated(!!token);
      }
    };

    checkAuth();
  }, [location, userType, token]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/captive-portal"
        state={{ from: location, tableNumber: location.pathname.split("/")[2] }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
