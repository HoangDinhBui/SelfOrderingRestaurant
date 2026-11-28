import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Banner from "../../../components/ui/Banner";
import { CartContext } from "../../../context/CartContext";
import { gql, useLazyQuery } from "@apollo/client";
import { toast } from "react-toastify";

import { BACKEND_URL, BACKEND_WS_URL } from "../../../config";
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
  const [lastOrderInfo, setLastOrderInfo] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [tableNumber, setTableNumber] = useState(() => {
    const savedTableNumber = localStorage.getItem("tableNumber");
    return savedTableNumber &&
      !isNaN(savedTableNumber) &&
      parseInt(savedTableNumber) > 0
      ? savedTableNumber
      : "1";
  });
  const [socket, setSocket] = useState(null);

  // Feedback is shown as toasts: the old inline banners rendered at the top of the page,
  // out of view of the button the guest had just tapped, so it looked like nothing happened.
  const setSocketError = (msg) => msg && toast.warn(msg, { toastId: "home-socket" });
  const setValidationError = (msg) => msg && toast.error(msg, { toastId: "home-validation" });
  const setPaymentError = (msg) => msg && toast.error(msg, { toastId: "home-payment", autoClose: 6000 });

  const API_BASE_URL = BACKEND_URL;

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
        error: error.message || "Không kiểm tra được số bàn",
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
        `${BACKEND_WS_URL}/ws/notifications?userType=CUSTOMER&tableNumber=${tableNumber}`
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
              toast.info(`Bạn đã được chuyển sang bàn ${newTableNumber}`);
            }
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
          setSocketError("Không xử lý được thông báo. Vui lòng kiểm tra kết nối.");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Silent: the socket retries on its own; a toast on every retry only alarms guests
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
                  validationResult.error || "Đơn hàng hoặc số bàn không hợp lệ"
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
          setValidationError("Không tải được thông tin đơn hàng");
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
      toast.error("Vui lòng nhập số bàn hợp lệ");
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

    try {
      // Guests have no account; the backend falls back to the order's customer / the table
      const customerInfo = JSON.parse(localStorage.getItem("customerInfo") || "null");
      const orderId = lastOrderInfo?.orderId || null;

      const notificationRequest = {
        tableNumber: parseInt(tableNumber) || 1,
        customerId: customerInfo?.id ?? null,
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
        return true;
      } else {
        throw new Error("Không gửi được thông báo");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Không gửi được yêu cầu tới nhân viên. Vui lòng thử lại.", {
        toastId: "home-notify",
      });
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
      toast.success("Đã báo nhân viên. Nhân viên sẽ đến bàn bạn ngay!");
    }
  };

  const handleCallPayment = async () => {
    try {
      setProcessingPayment(true);

      let orderInfo =
        localStorage.getItem("latestOrderInfo") ||
        sessionStorage.getItem("latestOrderInfo");
      if (!orderInfo) {
        setPaymentError("Bạn chưa có đơn nào. Vui lòng gọi món trước khi thanh toán.");
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
          setPaymentError("Số bàn vừa được cập nhật. Vui lòng bấm thanh toán lại.");
          setProcessingPayment(false);
          return;
        } else {
          setPaymentError(
            validationResult.error || "Đơn hàng hoặc số bàn không hợp lệ"
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
        err.message || "Không thể thanh toán lúc này. Vui lòng thử lại."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewMenu = () => {
    navigate(`/menu_cus?tableNumber=${tableNumber}`);
  };

  // Today's Special shows real, orderable dishes from the menu (was a hardcoded mock)
  const [specialStaff, setSpecialStaff] = useState([]);
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/dishes`)
      .then((res) => (res.ok ? res.json() : []))
      .then((dishes) =>
        setSpecialStaff(
          dishes
            .filter((d) => d.status === "AVAILABLE")
            .slice(0, 2)
            .map((d) => ({
              id: d.dishId,
              name: d.dishName,
              price: Number(d.price || 0).toLocaleString("vi-VN"),
              image: d.imageUrl || "/img/TodaySpeacial1.jpg",
              type: d.categoryName || "",
            }))
        )
      )
      .catch(() => setSpecialStaff([]));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <div className="flex justify-center min-h-screen bg-cream">
      <div className="w-full max-w-md px-4 pb-8 page-enter">
        <Header />
        <Banner />

        <section className="rounded-2xl bg-card border border-line p-4 shadow-sm">
          <p className="text-base text-ink">
            {greeting}, <span className="font-semibold text-brand">quý khách!</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">Món ăn sẽ được phục vụ tận bàn của bạn</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-1.5">
            <span className="text-sm text-ink-muted">Bàn số</span>
            <span className="text-lg font-bold text-brand">{tableNumber}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCallStaff}
              disabled={sendingNotification}
              aria-busy={sendingNotification}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-sm transition hover:border-brand/40 hover:shadow active:scale-[0.98] disabled:opacity-60"
            >
              <img src="/img/callstaff.png" alt="" width="231" height="384" className="h-12 w-auto shrink-0" />
              <span className="text-sm font-semibold text-ink leading-tight">
                {sendingNotification ? "Đang gọi..." : "Gọi nhân viên"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCallPayment}
              disabled={processingPayment || sendingNotification}
              aria-busy={processingPayment}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-sm transition hover:border-brand/40 hover:shadow active:scale-[0.98] disabled:opacity-60"
            >
              <img src="/img/callpayment.png" alt="" width="384" height="384" className="h-12 w-12 shrink-0 object-contain" />
              <span className="text-sm font-semibold text-ink leading-tight">
                {processingPayment ? "Đang xử lý..." : "Thanh toán"}
              </span>
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={handleViewMenu}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-brand px-5 py-4 text-white shadow-md shadow-brand/25 transition hover:bg-brand-hover active:scale-[0.99]"
        >
          <span className="text-left">
            <span className="block text-lg font-bold">Xem thực đơn & gọi món</span>
            <span className="block text-xs text-white/80">
              {cartItemCount > 0 ? `${cartItemCount} món trong giỏ` : "Chọn món yêu thích của bạn"}
            </span>
          </span>
          <img src="/img/viewmenu.png" alt="" width="384" height="384" className="h-12 w-12 shrink-0 object-contain" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/reservation")}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-white py-3.5 text-base font-semibold text-brand shadow-sm transition hover:bg-brand-soft active:scale-[0.99]"
        >
          <i className="fa-regular fa-calendar" aria-hidden="true" />
          Đặt bàn trước
        </button>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-ink">Món đặc biệt hôm nay</h2>
            <button
              type="button"
              className="flex min-h-[44px] items-center gap-1 px-1 text-sm font-semibold text-brand"
              onClick={handleViewMenu}
            >
              Xem tất cả
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {specialStaff.length === 0
              ? // Skeletons hold the space until dishes arrive, so the page does not jump
                [0, 1].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-[150px] rounded-xl bg-line/70 mb-2" />
                    <div className="h-3 w-1/2 rounded bg-line/70 mb-2" />
                    <div className="h-4 w-3/4 rounded bg-line/70 mb-2" />
                    <div className="h-3 w-1/3 rounded bg-line/70" />
                  </div>
                ))
              : specialStaff.map((dish) => (
                  <button
                    type="button"
                    key={dish.id}
                    className="flex flex-col items-start text-left rounded-xl transition active:scale-[0.98]"
                    onClick={() => navigate(`/viewitem/${dish.id}`)}
                  >
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      className="w-full h-[150px] object-cover rounded-xl mb-2 bg-line"
                    />
                    <p className="text-xs text-ink-muted">{dish.type}</p>
                    <p className="text-base font-semibold text-ink">{dish.name}</p>
                    <p className="text-sm font-bold text-brand">{dish.price}đ</p>
                  </button>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
