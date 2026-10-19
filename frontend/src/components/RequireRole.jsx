import { Navigate, useLocation } from "react-router-dom";

// Client-side gate for staff/admin pages. The backend enforces the same roles on every API
// call; this only keeps people from landing on screens they cannot use.
const RequireRole = ({ roles, children }) => {
  const location = useLocation();
  const token = localStorage.getItem("accessToken");
  const userType = localStorage.getItem("userType");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!roles.includes(userType)) {
    // Logged in but wrong role: send each role to its own home page
    const home = userType === "ADMIN" ? "/table-management_admin" : userType === "STAFF" ? "/table-management_staff" : "/login";
    return <Navigate to={home} replace />;
  }
  return children;
};

export default RequireRole;
