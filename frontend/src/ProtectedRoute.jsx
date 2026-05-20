import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// List of STAFF routes that should redirect to /login on auth failure
const staffRoutes = [
  "/attendance",
  "/dish-management_staff",
  "/notification-management",
  "/staff-information_staff",
  "/table-management_staff",
  "/order-history",
  "/table-management_admin",
  "/evaluate_admin",
  "/menu-management_admin",
  "/revenue-management_admin",
  "/staff-management_admin",
  "/inventory-management_admin",
  "/dish-management",
  "/check-out", // This route is added to allow access without a valid token
];

// Routes that should always render, even without a valid token
const bypassRoutes = ["/check-out"];

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("ProtectedRoute checkAuth:", {
        pathname: location.pathname,
        isBypass: bypassRoutes.includes(location.pathname),
      });

      // Allow access to bypass routes (e.g., /check-out)
      if (bypassRoutes.includes(location.pathname)) {
        console.log(
          "Bypass route detected, allowing access to",
          location.pathname
        );
        setIsAuthenticated(true);
        return;
      }

      const token = localStorage.getItem("accessToken");
      const userType = localStorage.getItem("userType");

      console.log("Auth check:", { token: !!token, userType });

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
  }, [location.pathname]);

  if (isAuthenticated === null) {
    console.log("ProtectedRoute: Loading state for", location.pathname);
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log(
      `ProtectedRoute: Redirecting from ${location.pathname} to /login`
    );
    if (staffRoutes.includes(location.pathname)) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    console.log(
      `ProtectedRoute: Redirecting from ${location.pathname} to /captive-portal`
    );
    return (
      <Navigate
        to="/captive-portal"
        state={{ from: location, tableNumber: location.pathname.split("/")[2] }}
        replace
      />
    );
  }

  console.log("ProtectedRoute: Allowing access to", location.pathname);

  return children;
};

export default ProtectedRoute;
