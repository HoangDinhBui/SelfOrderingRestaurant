import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Extract orderId from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId");

  // Base API URL to ensure consistency
  const API_BASE_URL = "http://localhost:8080";

  // Fetch order details on component mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch order payment details
        const response = await axios.get(
          `${API_BASE_URL}/api/orders/${orderId}/payment`
        );
        setOrderDetails(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again.");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handlePayment = async () => {
    if (!orderId) {
      setError("No order ID provided");
      return;
    }

    try {
      setProcessingPayment(true);

      // Process the payment
      await axios.post(`${API_BASE_URL}/api/payment/process`, {
        orderId: parseInt(orderId),
        paymentMethod: paymentMethod,
      });

      // Show confirmation modal
      setShowModal(true);
      setProcessingPayment(false);

      // Refresh order details to update payment status
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/${orderId}/payment`
      );
      setOrderDetails(response.data);
    } catch (err) {
      console.error("Error processing payment:", err);
      setError("Payment processing failed. Please try again.");
      setProcessingPayment(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading payment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-red-500 text-white py-2 px-4 rounded-lg"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white py-3 shadow-md fixed top-0 left-0 w-full z-10">
        <div className="flex items-center px-4 w-full">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-lg font-bold">Payment</div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto mt-16 p-4">
        {/* Order Bill */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h2 className="text-lg font-bold mb-4">ORDER BILL</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ORDER ID</span>
              <span>#{orderDetails?.orderId || orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TABLE NO.</span>
              <span>#{orderDetails?.tableId || "1"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ORDER DATE</span>
              <span>
                {formatDate(orderDetails?.orderDate) ||
                  new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT STATUS</span>
              <span
                className={
                  orderDetails?.paymentStatus === "PAID"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {orderDetails?.paymentStatus || "UNPAID"}
              </span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h2 className="text-lg font-bold mb-4">ITEMS LIST</h2>
          <div className="grid grid-cols-3 gap-4 text-gray-500 text-sm font-medium border-b pb-2">
            <span>ITEMS</span>
            <span className="text-center">DESCRIPTION</span>
            <span className="text-right">PRICE</span>
          </div>
          <div className="space-y-2 mt-2">
            {orderDetails?.items && orderDetails.items.length > 0 ? (
              orderDetails.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 items-center"
                >
                  <span className="font-bold">{item.dishName}</span>
                  <span className="text-center">
                    {item.description || "No description"}
                    <br />
                    Quantity: {item.quantity}
                  </span>
                  <span className="text-right text-red-500">
                    {parseFloat(item.price).toLocaleString()} VND
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-2">
                No items found
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
          <div className="space-y-4 mb-4">
            {orderDetails?.discount && orderDetails.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">DISCOUNT</span>
                <span className="text-red-500">
                  -{parseFloat(orderDetails.discount).toLocaleString()} VND
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT METHOD</span>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={orderDetails?.paymentStatus === "PAID"}
              >
                <option value="CASH">Cash</option>
                <option value="VNPAY">VNPay</option>
                <option value="CREDIT">Credit Card</option>
              </select>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>
                {parseFloat(orderDetails?.total || 0).toLocaleString()} VND
              </span>
            </div>
          </div>

          {/* Payment Button - only show if not paid yet */}
          {orderDetails?.paymentStatus !== "PAID" && (
            <button
              className={`w-full !bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition ${
                processingPayment ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? "PROCESSING..." : "PAYMENT"}
            </button>
          )}

          {/* If already paid, show complete button */}
          {orderDetails?.paymentStatus === "PAID" && (
            <button
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
              onClick={() => navigate("/evaluate")}
            >
              COMPLETE
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                navigate("/evaluate");
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal content */}
            <img
              src={`${API_BASE_URL}/api/images/logo.jpg`}
              alt="Restaurant Logo"
              className="mx-auto mb-4 w-24 h-24 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            <h3 className="text-xl font-bold text-center mb-2">
              Payment Successful!
            </h3>
            <p className="text-center text-gray-700 mb-6">
              Your payment has been successfully processed.
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                navigate("/evaluate");
              }}
              className="w-full !bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
