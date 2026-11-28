import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { authAPI, publicAPI } from "../../../services/api";
import { getPaymentStatus } from "../../../services/paymentAPI";

import { BACKEND_URL } from "../../../config";
const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [existingPaymentDetected, setExistingPaymentDetected] = useState(false);
  const [existingPaymentDetails, setExistingPaymentDetails] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);

  const momoPhoneNumber = "0329914143";
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId");
  const API_BASE_URL = BACKEND_URL;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Không tìm thấy mã đơn hàng");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getPaymentStatus(orderId);
        if (response.error) {
          throw new Error(response.message || "Không tải được chi tiết đơn");
        }
        const orderData = response;
        console.log("Order details response:", orderData);

        if (orderData.paymentStatus === "PAID") {
          setExistingPaymentDetected(true);
          setExistingPaymentDetails({
            method: orderData.paymentMethod || "Unknown",
            date: orderData.paymentDate || new Date().toISOString(),
            amount: orderData.totalAmount || 0,
          });
          setOrderDetails(orderData);
          setLoading(false);
          setShowModal(true);
          return;
        }

        if (orderData.transactionStatus === "PENDING") {
          setTransactionStatus("PENDING");
          setExistingPaymentDetails({
            method: orderData.paymentMethod || "Unknown",
            date: orderData.paymentDate || new Date().toISOString(),
            amount: orderData.totalAmount || 0,
          });
        }

        if (
          orderData &&
          (orderData.totalAmount === null ||
            orderData.totalAmount === undefined)
        ) {
          if (orderData.items && orderData.items.length > 0) {
            let calculatedTotal = 0;
            orderData.items.forEach((item) => {
              const itemPrice = parseFloat(item.price) || 0;
              const quantity = parseInt(item.quantity, 10) || 1;
              calculatedTotal += itemPrice * quantity;
            });

            if (orderData.discount) {
              calculatedTotal -= parseFloat(orderData.discount) || 0;
            }

            orderData.totalAmount = calculatedTotal > 0 ? calculatedTotal : 0;
            console.log("Calculated total:", orderData.totalAmount);
          }
        }

        setOrderDetails(orderData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Không tải được chi tiết đơn. Vui lòng thử lại.");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const checkTransactionStatus = async () => {
    try {
      const response = await getPaymentStatus(orderId);
      if (response.error) {
        throw new Error(
          response.message || "Không kiểm tra được giao dịch"
        );
      }
      const orderData = response;
      setOrderDetails(orderData);

      if (orderData.paymentStatus === "PAID") {
        setExistingPaymentDetected(true);
        setExistingPaymentDetails({
          method: orderData.paymentMethod || "Unknown",
          date: orderData.paymentDate || new Date().toISOString(),
          amount: orderData.totalAmount || 0,
        });
        setTransactionStatus(null);
        setShowModal(true);
      } else if (orderData.transactionStatus !== "PENDING") {
        setTransactionStatus(null);
        setError("Giao dịch đã bị hủy hoặc thất bại. Vui lòng thử lại.");
      } else {
        setError("Giao dịch vẫn đang chờ xử lý. Vui lòng thử lại sau.");
      }
    } catch (err) {
      console.error("Error checking transaction status:", err);
      setError("Không kiểm tra được giao dịch. Vui lòng thử lại.");
    }
  };

  const resetPayment = async () => {
    try {
      const response = await authAPI.post(`/api/payment/reset/${orderId}`);
      if (response.data.success) {
        setTransactionStatus(null);
        setExistingPaymentDetails(null);
        setError(null);
        console.log("Reset payment status successfully for order:", orderId);
        const refreshResponse = await getPaymentStatus(orderId);
        if (!refreshResponse.error) {
          setOrderDetails(refreshResponse);
        }
      } else {
        throw new Error(response.data.message || "Không đặt lại được trạng thái thanh toán");
      }
    } catch (err) {
      console.error("Error resetting payment status:", err);
      setError(
        err.response?.data?.message ||
        "Không đặt lại được trạng thái thanh toán. Vui lòng thử lại."
      );
    }
  };

  const handlePayment = async () => {
    if (existingPaymentDetected) {
      setShowModal(true);
      return;
    }

    if (transactionStatus === "PENDING") {
      setError(
        "Có một giao dịch đang chờ xử lý. Vui lòng đợi hoặc kiểm tra trạng thái giao dịch."
      );
      setShowModal(true);
      return;
    }

    if (!orderId) {
      setError("Thiếu mã đơn hàng. Vui lòng kiểm tra lại đơn.");
      return;
    }

    const orderTotal = parseFloat(getOrderTotal());
    if (orderTotal <= 0) {
      setError("Tổng tiền không hợp lệ. Vui lòng kiểm tra lại đơn.");
      return;
    }

    try {
      setProcessingPayment(true);

      const paymentStatusCheck = await getPaymentStatus(orderId);
      if (paymentStatusCheck.error) {
        throw new Error(
          paymentStatusCheck.message || "Không kiểm tra được trạng thái thanh toán"
        );
      }
      if (paymentStatusCheck.paymentStatus === "PAID") {
        setExistingPaymentDetected(true);
        setExistingPaymentDetails({
          method: paymentStatusCheck.paymentMethod || "Unknown",
          date: paymentStatusCheck.paymentDate || new Date().toISOString(),
          amount: paymentStatusCheck.totalAmount || 0,
        });
        setOrderDetails(paymentStatusCheck);
        setShowModal(true);
        setProcessingPayment(false);
        return;
      }

      if (paymentStatusCheck.transactionStatus === "PENDING") {
        setTransactionStatus("PENDING");
        setExistingPaymentDetails({
          method: paymentStatusCheck.paymentMethod || "Unknown",
          date: paymentStatusCheck.paymentDate || new Date().toISOString(),
          amount: paymentStatusCheck.totalAmount || 0,
        });
        setOrderDetails(paymentStatusCheck);
        setError(
          "Có một giao dịch đang chờ xử lý. Vui lòng đợi hoặc kiểm tra trạng thái giao dịch."
        );
        setShowModal(true);
        setProcessingPayment(false);
        return;
      }

      switch (paymentMethod) {
        case "VNPAY":
          const vnpayResponse = await authAPI.post(`/api/payment/vnpay`, {
            orderId: parseInt(orderId),
            total: Math.round(orderTotal),
            orderInfo: `Thanh toán đơn: ${orderId}`,
            returnUrl: `${window.location.origin}/payment_cus?orderId=${orderId}`,
          });

          if (vnpayResponse.data?.paymentUrl) {
            window.location.href = vnpayResponse.data.paymentUrl;
            return;
          } else {
            throw new Error("Không lấy được liên kết thanh toán VNPay.");
          }

        case "MOMO":
          await authAPI.post(`/api/payment/process`, {
            orderId: parseInt(orderId),
            paymentMethod: "MOMO",
            confirmPayment: false,
          });
          setShowModal(true);
          break;

        case "CASH":
        case "CREDIT":
          await authAPI.post(`/api/payment/process`, {
            orderId: parseInt(orderId),
            paymentMethod: paymentMethod,
            confirmPayment: false,
          });
          setShowModal(true);
          break;

        default:
          throw new Error("Phương thức thanh toán chưa được hỗ trợ");
      }

      setProcessingPayment(false);
    } catch (err) {
      console.error("Error processing payment:", err);
      if (err.response?.status === 409) {
        setExistingPaymentDetected(true);
        try {
          const paymentStatusCheck = await getPaymentStatus(orderId);
          setOrderDetails(paymentStatusCheck);
          setExistingPaymentDetails({
            method: paymentStatusCheck.paymentMethod || "Unknown",
            date: paymentStatusCheck.paymentDate || new Date().toISOString(),
            amount: paymentStatusCheck.totalAmount || 0,
          });
          if (paymentStatusCheck.transactionStatus === "PENDING") {
            setTransactionStatus("PENDING");
            setError(
              "Có một giao dịch đang chờ xử lý. Vui lòng đợi hoặc kiểm tra trạng thái giao dịch."
            );
          } else {
            setError(
              "Đơn này đã được thanh toán. Vui lòng xem chi tiết thanh toán."
            );
          }
          setShowModal(true);
        } catch (detailsErr) {
          console.error("Error fetching payment details:", detailsErr);
          setError(
            "Không xác minh được thanh toán. Vui lòng liên hệ nhân viên."
          );
        }
      } else {
        setError(
          err.response?.data?.message ||
            "Không xử lý được thanh toán. Vui lòng thử lại."
        );
      }
      setProcessingPayment(false);
    }
  };

  // A guest cannot settle a bill: we notify the staff (PAYMENT_REQUEST) and wait until they
  // confirm it; the backend refuses /payment/confirm from guests.
  const [awaitingStaff, setAwaitingStaff] = useState(false);

  useEffect(() => {
    if (!awaitingStaff) return undefined;
    const timer = setInterval(async () => {
      const status = await getPaymentStatus(orderId);
      if (!status.error && status.paymentStatus === "PAID") {
        clearInterval(timer);
        setAwaitingStaff(false);
        localStorage.removeItem("latestOrderInfo");
        sessionStorage.removeItem("latestOrderInfo");
        setShowModal(false);
        navigate(`/evaluate_cus?orderId=${orderId}`);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [awaitingStaff, orderId, navigate]);

  const confirmPayment = async () => {
    if (existingPaymentDetected) {
      localStorage.removeItem("latestOrderInfo");
      sessionStorage.removeItem("latestOrderInfo");
      setShowModal(false);
      setTimeout(() => {
        navigate(`/evaluate_cus?orderId=${orderId}`);
      }, 1000);
      return;
    }

    if (transactionStatus === "PENDING") {
      setError("Giao dịch đang được xử lý, vui lòng kiểm tra lại trạng thái.");
      setShowModal(true);
      return;
    }

    try {
      setProcessingPayment(true);

      const statusResponse = await getPaymentStatus(orderId);
      if (statusResponse.error) {
        throw new Error(statusResponse.message || "Không kiểm tra được trạng thái thanh toán");
      }

      if (statusResponse.paymentStatus === "PAID") {
        setExistingPaymentDetected(true);
        setExistingPaymentDetails({
          method: statusResponse.paymentMethod || paymentMethod,
          date: statusResponse.paymentDate || new Date().toISOString(),
          amount: statusResponse.totalAmount || 0,
        });
        setOrderDetails(statusResponse);
        setShowModal(true);
        return;
      }

      const customerInfo = JSON.parse(localStorage.getItem("customerInfo") || "null");
      await authAPI.post(`/api/notifications`, {
        ...(customerInfo?.id ? { customerId: customerInfo.id } : {}),
        tableNumber: orderDetails?.tableId,
        type: "PAYMENT_REQUEST",
        orderId: parseInt(orderId),
        additionalMessage: `Khách yêu cầu thanh toán bằng ${getPaymentMethodDisplayText(paymentMethod)}`,
      });

      setError(null);
      setAwaitingStaff(true);
      setShowModal(false);
    } catch (err) {
      console.error("Error requesting payment:", err);
      setError(
        err.response?.data?.message ||
          "Không gửi được yêu cầu thanh toán, vui lòng gọi nhân viên."
      );
      setShowModal(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPaymentMethodDisplayText = (method) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "VNPAY":
        return "VNPay";
      case "CREDIT":
        return "Credit Card";
      case "MOMO":
        return "Momo";
      case "ONLINE":
        return "Thanh toán trực tuyến";
      default:
        return method;
    }
  };

  useEffect(() => {
    const checkVnPayReturn = async () => {
      if (location.search.includes("vnp_ResponseCode")) {
        const params = new URLSearchParams(location.search);
        const validParams = new URLSearchParams();
        const validKeys = [
          "vnp_Amount",
          "vnp_BankCode",
          "vnp_BankTranNo",
          "vnp_CardType",
          "vnp_OrderInfo",
          "vnp_PayDate",
          "vnp_ResponseCode",
          "vnp_TmnCode",
          "vnp_TransactionNo",
          "vnp_TransactionStatus",
          "vnp_TxnRef",
          "vnp_SecureHash",
        ];
        for (const key of validKeys) {
          if (params.has(key)) {
            validParams.set(key, params.get(key));
          }
        }
        const vnpQueryString = `?${validParams.toString()}`;
        console.log("Filtered vnpQueryString:", vnpQueryString);
        try {
          const verifyResponse = await publicAPI.get(
            `/payment/vnpay_payment${vnpQueryString}`
          );
          if (verifyResponse.data?.transactionStatus === "SUCCESS") {
            const orderResponse = await getPaymentStatus(orderId);
            if (orderResponse.error) {
              throw new Error(
                orderResponse.message || "Không lấy được trạng thái thanh toán"
              );
            }
            setOrderDetails(orderResponse);
            if (orderResponse.paymentStatus === "PAID") {
              setExistingPaymentDetected(true);
              setExistingPaymentDetails({
                method: orderResponse.paymentMethod || "VNPAY",
                date: orderResponse.paymentDate || new Date().toISOString(),
                amount: orderResponse.totalAmount || 0,
              });
            }
            setShowModal(true);
          } else {
            setError(
              "Thanh toán VNPay thất bại: " + verifyResponse.data.message
            );
          }
          navigate(`/payment_cus?orderId=${orderId}`, { replace: true });
        } catch (err) {
          console.error("Error verifying VNPay payment:", err);
          if (err.response?.status === 401) {
            setError(
              "Không có quyền truy cập. Vui lòng đăng nhập lại."
            );
          } else if (err.response?.status === 400) {
            setError(
              "Dữ liệu thanh toán không hợp lệ: " + err.response.data.message
            );
          } else {
            setError(
              "Không xác minh được thanh toán: " +
                (err.response?.data?.message || err.message)
            );
          }
          navigate(`/payment_cus?orderId=${orderId}`, { replace: true });
        }
      }
    };

    if (!loading && orderId) {
      checkVnPayReturn();
    }
  }, [location.search, loading, orderId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const PAYMENT_STATUS_LABEL = { PAID: "Đã thanh toán", UNPAID: "Chưa thanh toán" };
  const TRANSACTION_STATUS_LABEL = { PENDING: "Đang chờ", PAID: "Thành công", FAILED: "Thất bại", CANCELLED: "Đã hủy" };

  const getOrderTotal = () => {
    if (orderDetails?.totalAmount) {
      return parseFloat(orderDetails.totalAmount);
    }

    if (orderDetails?.items && orderDetails.items.length > 0) {
      let total = 0;
      orderDetails.items.forEach((item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 1;
        total += price * quantity;
      });

      if (orderDetails?.discount) {
        total -= parseFloat(orderDetails.discount) || 0;
      }

      return total > 0 ? total : 0;
    }

    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-4 pt-20 space-y-3 animate-pulse">
          <div className="h-40 rounded-2xl bg-card border border-line" />
          <div className="h-48 rounded-2xl bg-card border border-line" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div role="alert" className="bg-card border border-line p-6 rounded-2xl text-center max-w-sm w-full shadow-sm">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fa-solid fa-triangle-exclamation text-red-700" aria-hidden="true" />
          </div>
          <p className="text-ink mb-5">{error}</p>
          <button
            onClick={() => navigate("/menu_cus")}
            className="w-full min-h-[44px] rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );
  }

  const orderTotal = getOrderTotal();
  const momoQrUrl = `https://nhantien.momo.vn/${momoPhoneNumber}`;
  const isPaid = orderDetails?.paymentStatus === "PAID";
  const paidMethodText = getPaymentMethodDisplayText(existingPaymentDetails?.method || "Unknown");
  const Row = ({ label, children }) => (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{children}</span>
    </div>
  );
  const PAYMENT_OPTIONS = [
    { value: "CASH", label: "Tiền mặt", icon: "fa-money-bill-wave" },
    { value: "VNPAY", label: "VNPay", icon: "fa-qrcode" },
    { value: "CREDIT", label: "Thẻ tín dụng", icon: "fa-credit-card" },
    { value: "MOMO", label: "Momo", icon: "fa-wallet" },
  ];
  const selectLocked = isPaid || existingPaymentDetected || transactionStatus === "PENDING";

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col">
      <header className="bg-card/95 backdrop-blur border-b border-line sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center px-2 h-14">
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-ink pr-11">Thanh toán</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-8 space-y-4 page-enter">
        {(existingPaymentDetected || transactionStatus === "PENDING") && (
          <div
            role="status"
            className={`rounded-2xl border p-4 flex gap-3 ${
              existingPaymentDetected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
            }`}
          >
            <i
              className={`fa-solid ${existingPaymentDetected ? "fa-circle-check text-green-700" : "fa-clock text-amber-700"} mt-0.5`}
              aria-hidden="true"
            />
            <div className="text-sm">
              {existingPaymentDetected ? (
                <p className="text-green-900">Đơn này đã được thanh toán bằng {paidMethodText}.</p>
              ) : (
                <p className="text-amber-900">
                  Có một giao dịch đang chờ xử lý. Vui lòng đợi hoặc kiểm tra trạng thái giao dịch.
                </p>
              )}
              {existingPaymentDetails && (
                <p className="text-xs text-ink-muted mt-1">Thời gian: {formatDate(existingPaymentDetails.date)}</p>
              )}
            </div>
          </div>
        )}

        <section className="bg-card border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-ink">Hóa đơn #{orderDetails?.orderId || orderId}</h2>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isPaid ? "bg-green-100 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {PAYMENT_STATUS_LABEL[orderDetails?.paymentStatus] || "Chưa thanh toán"}
            </span>
          </div>
          <Row label="Bàn">{orderDetails?.tableId || "1"}</Row>
          <Row label="Ngày đặt">{formatDate(orderDetails?.orderDate)}</Row>
          {orderDetails?.transactionStatus && (
            <Row label="Giao dịch">
              {TRANSACTION_STATUS_LABEL[orderDetails.transactionStatus] || orderDetails.transactionStatus}
            </Row>
          )}
          {isPaid && orderDetails?.paymentMethod && (
            <Row label="Phương thức">{getPaymentMethodDisplayText(orderDetails.paymentMethod)}</Row>
          )}
          {isPaid && orderDetails?.paymentDate && <Row label="Ngày thanh toán">{formatDate(orderDetails.paymentDate)}</Row>}
        </section>

        <section className="bg-card border border-line rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-ink mb-2">Danh sách món</h2>
          <ul className="divide-y divide-line">
            {orderDetails?.items && orderDetails.items.length > 0 ? (
              orderDetails.items.map((item, index) => {
                const qty = parseInt(item.quantity, 10) || 1;
                return (
                  <li key={index} className="py-2.5 flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        <span className="text-ink-muted">{qty}×</span> {item.dishName || "Món ăn"}
                      </p>
                      {item.notes && <p className="text-xs text-ink-muted mt-0.5">{item.notes}</p>}
                    </div>
                    <span className="shrink-0 font-semibold text-ink">
                      {((parseFloat(item.price) || 0) * qty).toLocaleString("vi-VN")}đ
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="text-center text-ink-muted py-3 text-sm">Không có món nào</li>
            )}
          </ul>

          <div className="mt-2 pt-3 border-t border-line space-y-1.5">
            {orderDetails?.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Giảm giá</span>
                <span className="text-green-800 font-medium">
                  -{(parseFloat(orderDetails.discount) || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-ink">Tổng cộng</span>
              <span className="text-xl font-bold text-brand">{orderTotal.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </section>

        {!isPaid && (
          <section className="bg-card border border-line rounded-2xl p-4 shadow-sm">
            <h2 className="text-base font-bold text-ink mb-3">Phương thức thanh toán</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Phương thức thanh toán">
              {PAYMENT_OPTIONS.map((opt) => {
                const active = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={selectLocked}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`min-h-[52px] px-3 rounded-xl border flex items-center gap-2.5 text-sm font-medium transition disabled:opacity-60 ${
                      active ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink hover:border-brand/40"
                    }`}
                  >
                    <i className={`fa-solid ${opt.icon} w-4`} aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="space-y-3">
          {!isPaid && !existingPaymentDetected && transactionStatus !== "PENDING" && (
            <button
              className="w-full h-12 rounded-xl bg-brand text-white font-semibold shadow-md shadow-brand/25 hover:bg-brand-hover active:scale-[0.99] transition disabled:opacity-60"
              onClick={handlePayment}
              disabled={processingPayment || orderTotal <= 0}
            >
              {processingPayment ? "Đang xử lý..." : `Thanh toán ${orderTotal.toLocaleString("vi-VN")}đ`}
            </button>
          )}

          {(isPaid || existingPaymentDetected) && (
            <button
              className="w-full h-12 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition"
              onClick={() => navigate(`/evaluate_cus?orderId=${orderId}`)}
            >
              Hoàn tất & đánh giá
            </button>
          )}

          {transactionStatus === "PENDING" && (
            <button
              className="w-full h-12 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition"
              onClick={checkTransactionStatus}
            >
              Kiểm tra giao dịch
            </button>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl page-enter">
            <button
              onClick={() => {
                if (paymentMethod === "MOMO") {
                  resetPayment();
                }
                setShowModal(false);
              }}
              aria-label="Đóng"
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:bg-brand-soft transition"
            >
              <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
            </button>

            {existingPaymentDetected ? (
              <div className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fa-solid fa-check text-2xl text-green-700" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-1">Đơn đã được thanh toán</h3>
                <p className="text-sm text-ink-muted mb-6">
                  Thanh toán bằng {paidMethodText} · {formatDate(existingPaymentDetails?.date)}
                </p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate(`/evaluate_cus?orderId=${orderId}`);
                  }}
                  className="w-full h-12 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition"
                >
                  Tiếp tục đánh giá
                </button>
              </div>
            ) : transactionStatus === "PENDING" ? (
              <div className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <i className="fa-solid fa-clock text-2xl text-amber-700" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-1">Giao dịch đang chờ</h3>
                <p className="text-sm text-ink-muted mb-6">
                  Giao dịch của đơn #{orderId} đang chờ xử lý. Vui lòng đợi hoặc kiểm tra lại trạng thái.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={checkTransactionStatus}
                    className="h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
                  >
                    Kiểm tra
                  </button>
                </div>
              </div>
            ) : paymentMethod === "MOMO" ? (
              <div className="text-center">
                <h3 className="text-xl font-bold text-ink mb-1">Thanh toán Momo</h3>
                <p className="text-sm text-ink-muted mb-4">Quét mã bằng ứng dụng Momo để thanh toán</p>
                <img
                  src={`${API_BASE_URL}/api/images/qrCode.png`}
                  alt="Mã QR Momo"
                  className="mx-auto w-52 h-52 rounded-xl border border-line bg-white"
                  onError={() => console.error("Failed to load Momo QR code")}
                />
                <p className="mt-3 text-lg font-bold text-brand">{orderTotal.toLocaleString("vi-VN")}đ</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      resetPayment();
                      setShowModal(false);
                    }}
                    className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
                  >
                    Tôi đã thanh toán
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-xl font-bold text-ink mb-1">Xác nhận thanh toán</h3>
                <p className="text-sm text-ink-muted mb-6">
                  Thanh toán <strong className="text-ink">{orderTotal.toLocaleString("vi-VN")}đ</strong> cho đơn #{orderId}?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
