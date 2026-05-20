import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isValidIp, setIsValidIp] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const location = useLocation();

  // Lấy tableNumber từ query parameter
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = queryParams.get("tableNumber") || "1";

  useEffect(() => {
    axios
      .get(`/api/captive/check-ip?tableNumber=${tableNumber}`)
      .then((response) => {
        setIsValidIp(response.data.redirect.startsWith("/table/"));
        setRedirectUrl(response.data.redirect);
      })
      .catch((error) => {
        console.error("Lỗi khi kiểm tra IP:", error);
        setIsValidIp(false);
        setRedirectUrl(`/captive-portal?tableNumber=${tableNumber}`);
      });
  }, [tableNumber]);

  if (isValidIp === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[30px] italic font-[Baskervville] text-black-200">
          Đang kiểm tra kết nối...
        </p>
      </div>
    );
  }

  return isValidIp ? children : <Navigate to={redirectUrl} replace />;
};

export default ProtectedRoute;