import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import Banner from "../../../components/ui/Banner";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const Home = () => {
  const { cartItemCount, loading, fetchCartData } = useContext(CartContext);
  const navigate = useNavigate();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [tableNumber, setTableNumber] = useState("1"); // Default table number

  // Base API URL to ensure consistency
  const API_BASE_URL = "http://localhost:8080";

  const specialDishes = [
    {
      name: "Lemon Macarons",
      price: "10.99",
      image: "/src/assets/img/TodaySpeacial1.jpg",
      type: "Cake",
    },
    {
      name: "Beef-steak",
      price: "10.99",
      image: "/src/assets/img/TodaySpecial2.jpg",
      type: "Meat",
    },
  ];

  useEffect(() => {
    // Try to load from localStorage first
    const cachedCartData = localStorage.getItem("cartData");
    if (cachedCartData) {
      try {
        const parsedData = JSON.parse(cachedCartData);
        // Note: We don't need to set cart item count here as it's managed by the context
      } catch (e) {
        console.error("Error parsing cached cart data", e);
      }
    }

    // Load last order info if available
    let orderInfo = localStorage.getItem("latestOrderInfo");

    // Nếu không tìm thấy trong localStorage, thử tìm trong sessionStorage
    if (!orderInfo) {
      orderInfo = sessionStorage.getItem("latestOrderInfo");
      // Nếu tìm thấy trong sessionStorage, khôi phục vào localStorage
      if (orderInfo) {
        localStorage.setItem("latestOrderInfo", orderInfo);
      }
    }

    if (orderInfo) {
      try {
        const parsedOrderInfo = JSON.parse(orderInfo);
        setLastOrderInfo(parsedOrderInfo);
      } catch (e) {
        console.error("Error parsing order info:", e);
      }
    }

    // Try to get table number from localStorage
    const savedTableNumber = localStorage.getItem("tableNumber");
    if (savedTableNumber) {
      setTableNumber(savedTableNumber);
    }

    // Then fetch fresh data from the server
    fetchCartData();
  }, [fetchCartData]);

  // Handler for Order Now button
  const handleOrderNow = async () => {
    try {
      // Refresh cart data before navigating
      await fetchCartData();
      // Navigate to Order page
      navigate("/order");
    } catch (err) {
      console.error("Error navigating to order page:", err);
    }
  };

  const sendNotification = async (type, additionalMessage = "") => {
    setSendingNotification(true);
    setNotificationError(null);
    setNotificationSuccess(false);

    try {
      // Get current customer info
      const customerInfo = JSON.parse(localStorage.getItem("customerInfo")) || {
        id: 1, // Guest customer ID
        fullname: "Guest Customer",
      };

      // Get orderId if available
      const orderId = lastOrderInfo?.orderId || null;

      // Prepare notification request - match exactly what your DTO expects
      const notificationRequest = {
        customerId: customerInfo.id,
        tableNumber: parseInt(tableNumber.replace(/\D/g, "")) || 1,
        type: type,
        orderId: orderId,
        content:
          additionalMessage || `${type} request from table ${tableNumber}`,
      };

      console.log("Sending notification request:", notificationRequest);

      // Send notification request to API
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications`,
        notificationRequest
      );

      console.log("Notification API response:", response);

      if (response.status >= 200 && response.status < 300) {
        setNotificationSuccess(true);
        return true;
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      console.error("Error details:", error.response?.data);
      setNotificationError(
        error.response?.data?.error ||
          "Failed to notify staff. Please try again."
      );
      return false;
    } finally {
      setSendingNotification(false);
    }
  };

  const handleCallStaff = async () => {
    const success = await sendNotification(
      "CALL_STAFF",
      "Customer needs assistance"
    );
    if (success) {
      // You can optionally show a success message or toast
      alert("Staff has been notified and will assist you shortly.");
    }
  };

  const handleCallPayment = async () => {
    try {
      setProcessingPayment(true);
      setPaymentError(null);
      setPaymentSuccess(false);

      // No notification sent here - we'll only send it after confirmation in the Payment component

      // Check for existing order information
      let orderInfo = localStorage.getItem("latestOrderInfo");
      if (!orderInfo) {
        orderInfo = sessionStorage.getItem("latestOrderInfo");
        if (orderInfo) {
          localStorage.setItem("latestOrderInfo", JSON.stringify(orderInfo));
        }
      }

      let orderData;
      if (orderInfo) {
        try {
          orderData = JSON.parse(orderInfo);
        } catch (e) {
          console.error("Error parsing order info:", e);
        }
      }

      // If we have valid order data in storage
      if (orderData && orderData.orderId) {
        try {
          const orderCheckResponse = await axios.get(
            `${API_BASE_URL}/api/orders/${orderData.orderId}`
          );

          if (
            orderCheckResponse.data &&
            orderCheckResponse.data.status !== "PAID"
          ) {
            // Skip payment processing here and just navigate
            navigate(`/payment?orderId=${orderData.orderId}`);
            setProcessingPayment(false);
            return;
          }
        } catch (error) {
          console.log(
            "Order check failed, will try to get recent order:",
            error
          );
        }
      }

      // If no valid order in storage, get recent unpaid order
      try {
        const ordersResponse = await axios.get(
          `${API_BASE_URL}/api/orders/recent?status=PENDING`
        );

        if (!ordersResponse.data || !ordersResponse.data.orderId) {
          setPaymentError("No unpaid orders found");
          setProcessingPayment(false);
          return;
        }

        const orderId = ordersResponse.data.orderId;
        const amount = ordersResponse.data.amount || 0;
        const customerId = ordersResponse.data.customerId || "Guest";

        // Save order info to storage
        const paymentInfo = {
          orderId: orderId,
          amount: amount,
          customerId: customerId,
          createdAt: new Date().toISOString(),
          isPaid: false,
        };
        localStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));
        sessionStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));
        setLastOrderInfo(paymentInfo);

        // Navigate to payment page without processing payment
        navigate(`/payment?orderId=${orderId}`);
      } catch (error) {
        console.error("Error fetching recent order:", error);
        setPaymentError("Unpaid order not found. Please try again.");
      } finally {
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error("Error in payment flow:", err);
      setPaymentError(
        err.response?.data?.message ||
          "Cannot process payment. Please try again."
      );
      setProcessingPayment(false);
    }
  };

  const processPayment = async (orderId, amount, customerId) => {
    try {
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payment/process`,
        {
          orderId: orderId,
          paymentMethod: "CASH", // hoặc "MOMO_QR", "VNPAY", v.v.
          amount: amount,
          customerId: customerId,
          updateStatus: false, // QUAN TRỌNG: Không cập nhật trạng thái thành PAID
        }
      );

      if (paymentResponse.data && paymentResponse.data.success) {
        setPaymentSuccess(true);

        // KHÔNG xóa thông tin đơn hàng, chỉ chuyển đến trang thanh toán
        navigate(`/payment?orderId=${orderId}`);
      } else {
        setPaymentError(
          paymentResponse.data?.message || "Failed to process payment"
        );
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentError("Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="px-2 py-4">
      <Header />
      <Banner />

      {/* Payment error message if any */}
      {paymentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{paymentError}</p>
        </div>
      )}

      {/* Notification error message if any */}
      {notificationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{notificationError}</p>
        </div>
      )}

      {/* 2-column layout */}
      <section className="mt-4 grid grid-cols-2 gap-4">
        {/* Left column */}
        <div>
          {/* Customer information */}
          <div className="text-center mb-4">
            <p className="text-lg">
              Good Morning{" "}
              <span className="text-blue-500 font-semibold">Customer!</span>
            </p>
            <p className="text-gray-600">
              We will deliver your food to your table:{" "}
              <strong>{tableNumber}</strong>
            </p>
          </div>

          {/* Login button */}
          <div className="relative">
            <img
              src="/src/assets/img/homelogin.jpg"
              alt="Login"
              className="w-full h-[100px] object-cover rounded-lg"
            />
            <a
              href="/login"
              className="absolute inset-0 flex items-center justify-center bg-black/20 font-bold rounded-lg"
            ></a>
          </div>
        </div>

        {/* Right column */}
        <div className="grid grid-cols-2 gap-4">
          {/* Call Staff button */}
          <div className="relative">
            <button
              onClick={handleCallStaff}
              disabled={sendingNotification}
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/callstaff.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {sendingNotification ? "Calling..." : "Call Staff"}
            </button>
          </div>

          {/* Call Payment button */}
          <div className="relative">
            <button
              onClick={handleCallPayment}
              disabled={processingPayment || sendingNotification}
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/callpayment.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {processingPayment || sendingNotification
                ? "Processing..."
                : "Call Payment"}
            </button>
          </div>

          {/* View Menu - Order button */}
          <div className="relative col-span-2">
            <button
              onClick={() => navigate("/menu")}
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/viewmenu.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              View menu - Order
            </button>
          </div>
        </div>
      </section>

      {/* Order Now button with cart info */}
      <section className="mt-6">
        <button
          onClick={handleOrderNow}
          className="w-full !bg-red-500 text-white py-3 rounded-lg font-bold flex items-center justify-center relative"
          disabled={loading}
        >
          {loading ? (
            <span>Loading...</span>
          ) : (
            <>
              Order Now
              {cartItemCount > 0 && (
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-red-500 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                  {cartItemCount}
                </span>
              )}
            </>
          )}
        </button>
      </section>

      {/* Today's special dishes */}
      <section className="mt-6">
        {/* Title and arrow button */}
        <div className="flex items-center space-x-2 mb-3">
          <h2 className="text-xl font-bold">Today's Special</h2>
          <button className="text-black text-sm font-semibold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 ml-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Dish list */}
        <div className="grid grid-cols-2 gap-4">
          {specialDishes.map((dish, index) => (
            <div key={index} className="flex flex-col items-start">
              {/* Dish image */}
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-[150px] object-cover rounded-lg mb-2"
              />
              {/* Dish type */}
              <p className="text-sm text-gray-500">{dish.type}</p>
              {/* Dish name */}
              <p className="text-lg font-semibold">{dish.name}</p>
              {/* Dish price */}
              <p className="text-sm font-bold text-gray-800">${dish.price}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
