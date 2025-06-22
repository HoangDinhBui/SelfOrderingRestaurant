import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Banner from "../../../components/ui/Banner";
import { CartContext } from "../../../context/CartContext";
import { gql, useLazyQuery } from "@apollo/client";

// GraphQL Query for Table Validation
const VALIDATE_TABLE_NUMBER = gql`
  query ValidateTableNumber($orderId: ID!, $tableNumber: Int!) {
    validateTableNumber(orderId: $orderId, tableNumber: $tableNumber) {
      isValid
      correctTableNumber
      error
    }
  }
`;

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
    return savedTableNumber &&
      !isNaN(savedTableNumber) &&
      parseInt(savedTableNumber) > 0
      ? savedTableNumber
      : "1";
  });
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const API_BASE_URL = "http://localhost:8080";

  // Apollo Lazy Query for Table Validation
  const [
    validateTableNumberQuery,
    { loading: validationLoading, error: validationQueryError },
  ] = useLazyQuery(VALIDATE_TABLE_NUMBER);

  // Validate tableNumber against orderId
  const validateTableNumber = async (orderId, tableNumberToValidate) => {
    try {
      const { data } = await validateTableNumberQuery({
        variables: {
          orderId: orderId.toString(),
          tableNumber: parseInt(tableNumberToValidate),
        },
      });

      const response = data.validateTableNumber;
      return {
        isValid: response.isValid,
        correctTableNumber: response.correctTableNumber
          ? response.correctTableNumber.toString()
          : null,
        error: response.error,
      };
    } catch (error) {
      console.error("Error validating table number:", error);
      return {
        isValid: false,
        error: error.message || "Failed to validate table number",
      };
    }
  };

  // WebSocket connection (unchanged)
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 3000;

    const connectWebSocket = () => {
      if (!isMounted || reconnectAttempts >= maxReconnectAttempts) {
        console.log("Max reconnect attempts reached or component unmounted");
        return;
      }

      console.log(
        `Attempting WebSocket connection (Attempt ${reconnectAttempts + 1})`
      );
      ws = new WebSocket(
        `ws://localhost:8080/ws/notifications?userType=CUSTOMER&tableNumber=${tableNumber}`
      );

      ws.onopen = () => {
        console.log("WebSocket connected successfully for customer");
        setSocket(ws);
        setSocketError(null);
        reconnectAttempts = 0;
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            throw new Error("Received non-string WebSocket message");
          }
          if (event.data === "PONG") {
            console.log("Received PONG from server");
            return;
          }
          const message = JSON.parse(event.data);
          console.log(
            "Received WebSocket message:",
            JSON.stringify(message, null, 2)
          );

          if (
            message.type === "TABLE_TRANSFERRED" &&
            message.sourceTableId &&
            message.destinationTableId
          ) {
            console.log(
              `Received TABLE_TRANSFERRED: from Table ${message.sourceTableId} to Table ${message.destinationTableId}`
            );
            if (parseInt(message.sourceTableId) === parseInt(tableNumber)) {
              const newTableNumber = message.destinationTableId.toString();
              setTableNumber(newTableNumber);
              localStorage.setItem("tableNumber", newTableNumber);
              navigate(`/table/${newTableNumber}`, { replace: true });
              console.log(
                `Updated table number to ${newTableNumber} in state, localStorage, and URL`
              );
              alert(`Your table has been changed to Table ${newTableNumber}`);
            }
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
          setSocketError(
            "Failed to process notification. Please check your connection."
          );
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setSocketError("Failed to connect to notifications server");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setSocket(null);
        if (isMounted && reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          reconnectAttempts++;
          console.log(
            `Scheduling reconnect in ${delay}ms (Attempt ${reconnectAttempts})`
          );
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      const pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log("Sending PING");
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 30000);

      return () => {
        isMounted = false;
        clearTimeout(reconnectTimeout);
        clearInterval(pingInterval);
        if (ws) {
          console.log("Closing WebSocket during cleanup");
          ws.close();
        }
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) {
        console.log("Closing WebSocket during cleanup");
        ws.close();
      }
    };
  }, [tableNumber, navigate]);

  // Main useEffect for initialization and validation
  useEffect(() => {
    const initialize = async () => {
      let savedTableNumber = localStorage.getItem("tableNumber");
      let orderInfo =
        localStorage.getItem("latestOrderInfo") ||
        sessionStorage.getItem("latestOrderInfo");

      // Parse orderInfo
      if (orderInfo) {
        try {
          const parsedOrderInfo = JSON.parse(orderInfo);
          setLastOrderInfo(parsedOrderInfo);
          if (!localStorage.getItem("latestOrderInfo")) {
            localStorage.setItem("latestOrderInfo", orderInfo);
          }

          // Validate tableNumber against orderId
          if (parsedOrderInfo.orderId) {
            const validationResult = await validateTableNumber(
              parsedOrderInfo.orderId,
              tableNumberFromUrl || savedTableNumber || "1"
            );
            if (!validationResult.isValid) {
              if (validationResult.correctTableNumber) {
                setTableNumber(validationResult.correctTableNumber);
                localStorage.setItem(
                  "tableNumber",
                  validationResult.correctTableNumber
                );
                navigate(`/table/${validationResult.correctTableNumber}`, {
                  replace: true,
                });
                console.log(
                  `Redirected to correct table number: ${validationResult.correctTableNumber}`
                );
                return;
              } else {
                setValidationError(
                  validationResult.error || "Invalid order or table number"
                );
                localStorage.removeItem("latestOrderInfo");
                sessionStorage.removeItem("latestOrderInfo");
                setLastOrderInfo(null);
                savedTableNumber = null; // Force fallback
              }
            }
          }
        } catch (e) {
          console.error("Error parsing order info:", e);
          setValidationError("Failed to load order information");
        }
      }

      // Handle tableNumber initialization if no valid order
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

      // Fetch cart data
      if (typeof fetchCartData === "function") {
        fetchCartData();
      }
    };

    initialize();
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

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationRequest),
      });

      if (response.ok) {
        setNotificationSuccess(true);
        return true;
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotificationError(
        error.message || "Failed to notify staff. Please try again."
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

      let orderInfo =
        localStorage.getItem("latestOrderInfo") ||
        sessionStorage.getItem("latestOrderInfo");
      if (!orderInfo) {
        setPaymentError("No active order found. Please place an order first.");
        setProcessingPayment(false);
        return;
      }

      const parsedOrderInfo = JSON.parse(orderInfo);
      const orderId = parsedOrderInfo.orderId;

      // Validate tableNumber before navigating to payment
      const validationResult = await validateTableNumber(orderId, tableNumber);
      if (!validationResult.isValid) {
        if (validationResult.correctTableNumber) {
          setTableNumber(validationResult.correctTableNumber);
          localStorage.setItem(
            "tableNumber",
            validationResult.correctTableNumber
          );
          navigate(`/table/${validationResult.correctTableNumber}`, {
            replace: true,
          });
          setPaymentError("Table number updated. Please try payment again.");
          setProcessingPayment(false);
          return;
        } else {
          setPaymentError(
            validationResult.error || "Invalid order or table number"
          );
          localStorage.removeItem("latestOrderInfo");
          sessionStorage.removeItem("latestOrderInfo");
          setLastOrderInfo(null);
          setProcessingPayment(false);
          return;
        }
      }

      navigate(`/payment_cus?orderId=${orderId}`);
    } catch (err) {
      console.error("Error in payment flow:", err);
      setPaymentError(
        err.message || "Cannot process payment. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewMenu = () => {
    navigate(`/menu_cus?tableNumber=${tableNumber}`);
  };

  const specialStaff = [
    {
      name: "Lemon Macarons",
      price: "109,000",
      image: "/src/assets/img/TodaySpeacial1.jpg",
      type: "Cake",
    },
    {
      name: "Beef-steak",
      price: "109,000",
      image: "/src/assets/img/TodaySpecial2.jpg",
      type: "Meat",
    },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md px-4">
        <Header />
        <Banner />

        {validationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{validationError}</p>
          </div>
        )}

        {socketError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{socketError}</p>
          </div>
        )}

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
                <p className="text-sm font-bold text-gray-800">
                  {dish.price} VND
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
