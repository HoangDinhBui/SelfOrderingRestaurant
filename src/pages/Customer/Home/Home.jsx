import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Banner from "../../../components/ui/Banner";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const Home = () => {
  const { cartItemCount, loading, fetchCartData } = useContext(CartContext);
  const navigate = useNavigate();
  const { tableNumber: tableNumberFromUrl } = useParams();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [tableNumber, setTableNumber] = useState(() => {
    const savedTableNumber = localStorage.getItem("tableNumber");
    return savedTableNumber && !isNaN(savedTableNumber) && parseInt(savedTableNumber) > 0
      ? savedTableNumber
      : "1";
  });

  const API_BASE_URL = "http://localhost:8080";

  const specialStaff = [
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
    const savedTableNumber = localStorage.getItem("tableNumber");

    if (tableNumberFromUrl) {
      if (!isNaN(tableNumberFromUrl) && parseInt(tableNumberFromUrl) > 0) {
        setTableNumber(tableNumberFromUrl);
        localStorage.setItem("tableNumber", tableNumberFromUrl);
      } else {
        const fallbackTableNumber = savedTableNumber || "1";
        setTableNumber(fallbackTableNumber);
        localStorage.setItem("tableNumber", fallbackTableNumber);
        navigate(`/table/${fallbackTableNumber}`, { replace: true });
      }
    } else {
      if (
        savedTableNumber &&
        !isNaN(savedTableNumber) &&
        parseInt(savedTableNumber) > 0
      ) {
        setTableNumber(savedTableNumber);
        navigate(`/table/${savedTableNumber}`, { replace: true });
      } else {
        localStorage.setItem("tableNumber", "1");
        setTableNumber("1");
        navigate(`/table/1`, { replace: true });
      }
    }

    const cachedCartData = localStorage.getItem("cartData");
    if (cachedCartData) {
      try {
        const parsedData = JSON.parse(cachedCartData);
      } catch (e) {
        console.error("Error parsing cached cart data", e);
      }
    }

    let orderInfo = localStorage.getItem("latestOrderInfo");
    if (!orderInfo) {
      orderInfo = sessionStorage.getItem("latestOrderInfo");
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

    if (typeof fetchCartData === "function") {
      fetchCartData();
    }
  }, [fetchCartData, navigate, tableNumberFromUrl]);

  const handleTableNumberChange = (newTableNumber) => {
    if (
      !newTableNumber ||
      isNaN(newTableNumber) ||
      parseInt(newTableNumber) <= 0
    ) {
      alert("Please enter a valid table number");
      return;
    }
    setTableNumber(newTableNumber);
    localStorage.setItem("tableNumber", newTableNumber);
    navigate(`/table/${newTableNumber}`, { replace: true });
  };

  const handleOrderNow = async () => {
    try {
      if (typeof fetchCartData === "function") {
        await fetchCartData();
      }
      navigate("/order_cus", { state: { tableNumber } });
    } catch (err) {
      console.error("Error navigating to order page:", err);
    }
  };

  const sendNotification = async (type, additionalMessage = "") => {
    setSendingNotification(true);
    setNotificationError(null);
    setNotificationSuccess(false);

    try {
      const customerInfo = JSON.parse(localStorage.getItem("customerInfo")) || {
        id: 1,
        fullname: "Guest Customer",
      };
      const orderId = lastOrderInfo?.orderId || null;

      const notificationRequest = {
        tableNumber: parseInt(tableNumber) || 1,
        customerId: customerInfo.id,
        orderId: orderId,
        type: type,
        additionalMessage:
          additionalMessage || `${type} request from table ${tableNumber}`,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/notifications`,
        notificationRequest
      );

      if (response.status >= 200 && response.status < 300) {
        setNotificationSuccess(true);
        return true;
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotificationError(
        error.response?.data?.message ||
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
      alert("Staff has been notified and will assist you shortly.");
    }
  };

  const handleCallPayment = async () => {
    try {
      setProcessingPayment(true);
      setPaymentError(null);

      let orderInfo = localStorage.getItem("latestOrderInfo");
      if (!orderInfo) {
        orderInfo = sessionStorage.getItem("latestOrderInfo");
        if (orderInfo) {
          localStorage.setItem("latestOrderInfo", orderInfo);
        }
      }

      let orderId = null;
      if (orderInfo) {
        const parsedOrderInfo = JSON.parse(orderInfo);
        orderId = parsedOrderInfo.orderId;
      }

      if (!orderId) {
        setPaymentError("No active order found. Please place an order first.");
        setProcessingPayment(false);
        return;
      }

      navigate(`/payment_cus?orderId=${orderId}`);
    } catch (err) {
      console.error("Error in payment flow:", err);
      setPaymentError(
        err.response?.data?.message ||
          "Cannot process payment. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewMenu = () => {
    navigate(`/menu_cus?tableNumber=${tableNumber}`);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md px-4">
        <Header />
        <Banner />

        {paymentError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{paymentError}</p>
          </div>
        )}

        {notificationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{notificationError}</p>
          </div>
        )}

        {notificationSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Notification sent successfully!</p>
          </div>
        )}

        <section className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-center mb-4">
              <p className="text-lg">
                Good Morning{" "}
                <span className="text-blue-500 font-semibold">Customer!</span>
              </p>
              <p className="text-gray-600">
                We will deliver your food to your table:{" "}
                <strong>{tableNumber}</strong>
              </p>
              <input
                type="text"
                value={tableNumber}
                disabled
                onChange={(e) => handleTableNumberChange(e.target.value)}
                className="mt-2 border rounded p-1 w-24 text-center"
                placeholder="Table number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleCallStaff}
                disabled={sendingNotification}
                className="w-20 h-20 flex items-center justify-center text-black font-bold rounded-lg"
                style={{
                  backgroundImage: "url('/src/assets/img/callstaff.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              ></button>
              <span
                className="text-sm font-medium"
                style={{ color: "#747474" }}
              >
                {sendingNotification ? "Calling..." : "Call Staff"}
              </span>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleCallPayment}
                disabled={processingPayment || sendingNotification}
                className="w-20 h-20 flex items-center justify-center font-bold rounded-lg"
                style={{
                  backgroundImage: "url('/src/assets/img/callpayment.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              ></button>
              <span
                className="text-sm font-semibold"
                style={{ color: "#747474" }}
              >
                {processingPayment || sendingNotification
                  ? "Processing..."
                  : "Call Payment"}
              </span>
            </div>
          </div>
        </section>

        <div className="w-full h-20 mt-1 relative col-span-2">
          <button
            onClick={handleViewMenu}
            className="absolute inset-0 flex items-center justify-center gap-2 text-black font-bold rounded-lg overflow-hidden"
            style={{
              backgroundImage: "url('/src/assets/img/viewmenu.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-[#D9D9D9] opacity-20 z-0" />
            <span
              className="text-xl relative z-10 flex items-center gap-2"
              style={{ color: "#747474" }}
            >
              View menu - Order
              <img
                src="/src/assets/img/viewmenu.png"
                alt="Menu icon"
                className="w-15 h-15"
              />
            </span>
          </button>
        </div>

        <section className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <h2 className="text-xl font-bold">Today's Special</h2>
            <button
              className="text-black text-sm font-semibold flex items-center"
              onClick={() => navigate("/specials")}
            >
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

          <div className="grid grid-cols-2 gap-4">
            {specialStaff.map((dish, index) => (
              <div
                key={index}
                className="flex flex-col items-start cursor-pointer"
                onClick={() => {
                  navigate(
                    `/menu/item/${dish.name.toLowerCase().replace(/\s+/g, "-")}`
                  );
                  sendNotification(
                    "VIEW_SPECIAL",
                    `Customer at table ${tableNumber} is viewing ${dish.name}`
                  );
                }}
              >
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-[150px] object-cover rounded-lg mb-2"
                />
                <p className="text-sm text-gray-500">{dish.type}</p>
                <p className="text-lg font-semibold">{dish.name}</p>
                <p className="text-sm font-bold text-gray-800">${dish.price}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;