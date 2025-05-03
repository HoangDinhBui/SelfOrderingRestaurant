import { useEffect, useState } from "react";
import { pollPaymentStatus } from "../services/paymentStatusPoller";

function PaymentStatus() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Retrieve access token from localStorage
    const token = localStorage.getItem("accessToken");

    // Check if token exists
    if (!token) {
      setError("No access token found. Please log in.");
      return;
    }

    // Start polling with the order ID and token
    pollPaymentStatus(189, token).catch((err) => {
      setError(`Failed to poll payment status: ${err.message}`);
    });
  }, []);

  return (
    <div>
      <h2>Payment Status</h2>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p id="payment-status">Checking payment status...</p>
      )}
    </div>
  );
}

export default PaymentStatus;
