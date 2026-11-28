import { useEffect, useState } from "react";
import { pollPaymentStatus } from "../services/paymentStatusPoller";

function PaymentStatus() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Retrieve access token from localStorage
    const token = localStorage.getItem("accessToken");

    // Check if token exists
    if (!token) {
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập.");
      return;
    }

    // Start polling with the order ID and token
    pollPaymentStatus(189, token).catch((err) => {
      setError(`Không kiểm tra được trạng thái thanh toán: ${err.message}`);
    });
  }, []);

  return (
    <div>
      <h2>Trạng thái thanh toán</h2>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p id="payment-status">Đang kiểm tra trạng thái thanh toán...</p>
      )}
    </div>
  );
}

export default PaymentStatus;
