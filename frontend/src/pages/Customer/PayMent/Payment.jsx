import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { authAPI, publicAPI } from "../../../services/api";
import { confirmPayment, getPaymentStatus } from "../../../services/paymentAPI";

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
  const API_BASE_URL = "http://localhost:8080";

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getPaymentStatus(orderId);
        if (response.error) {
          throw new Error(response.message || "Failed to load order details");
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
        setError("Failed to load order details. Please try again.");
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
          response.message || "Failed to check transaction status"
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
        setError("Transaction has been cancelled or failed. Please try again.");
      } else {
        setError("Transaction is still pending. Please try again later.");
      }
    } catch (err) {
      console.error("Error checking transaction status:", err);
      setError("Failed to check transaction status. Please try again.");
    }
  };

  const resetPayment = async () => {
    try {
      const response = await authAPI.post(`/payment/reset/${orderId}`);
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
        throw new Error(response.data.message || "Failed to reset payment status");
      }
    } catch (err) {
      console.error("Error resetting payment status:", err);
      setError(
        err.response?.data?.message ||
        "Failed to reset payment status. Please try again."
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
        "A payment transaction is pending. Please wait for it to complete or check its status."
      );
      setShowModal(true);
      return;
    }

    if (!orderId) {
      setError("Order ID is not provided. Please check your order.");
      return;
    }

    const orderTotal = parseFloat(getOrderTotal());
    if (orderTotal <= 0) {
      setError("Total amount is not valid. Please check your order.");
      return;
    }

    try {
      setProcessingPayment(true);

      const paymentStatusCheck = await getPaymentStatus(orderId);
      if (paymentStatusCheck.error) {
        throw new Error(
          paymentStatusCheck.message || "Failed to check payment status"
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
          "A payment transaction is pending. Please wait for it to complete or check its status."
        );
        setShowModal(true);
        setProcessingPayment(false);
        return;
      }

      switch (paymentMethod) {
        case "VNPAY":
          const vnpayResponse = await authAPI.post(`/payment/vnpay`, {
            orderId: parseInt(orderId),
            total: Math.round(orderTotal),
            orderInfo: `Payment for Order: ${orderId}`,
            returnUrl: `${window.location.origin}/payment_cus?orderId=${orderId}`,
          });

          if (vnpayResponse.data?.paymentUrl) {
            window.location.href = vnpayResponse.data.paymentUrl;
            return;
          } else {
            throw new Error("Cannot get payment URL from VNPay.");
          }

        case "MOMO":
          await authAPI.post(`/payment/process`, {
            orderId: parseInt(orderId),
            paymentMethod: "MOMO",
            confirmPayment: false,
          });
          setShowModal(true);
          break;

        case "CASH":
        case "CREDIT":
          await authAPI.post(`/payment/process`, {
            orderId: parseInt(orderId),
            paymentMethod: paymentMethod,
            confirmPayment: false,
          });
          setShowModal(true);
          break;

        default:
          throw new Error("Unsupported payment method");
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
              "A payment transaction is pending. Please wait for it to complete or check its status."
            );
          } else {
            setError(
              "This order has already been paid. Please see the payment details."
            );
          }
          setShowModal(true);
        } catch (detailsErr) {
          console.error("Error fetching payment details:", detailsErr);
          setError(
            "Failed to verify existing payment. Please contact support."
          );
        }
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to process payment. Please try again."
        );
      }
      setProcessingPayment(false);
    }
  };

  const confirmPayment = async () => {
    if (existingPaymentDetected) {
      localStorage.removeItem("latestOrderInfo");
      sessionStorage.removeItem("latestOrderInfo");
      setShowModal(false);
      setTimeout(() => {
        navigate("/evaluate_cus");
      }, 1000);
      return;
    }

    if (transactionStatus === "PENDING") {
      setError("Transaction is still pending. Please check its status.");
      setShowModal(true);
      return;
    }

    try {
      setProcessingPayment(true);

      const statusResponse = await getPaymentStatus(orderId);
      if (statusResponse.error) {
        throw new Error(
          statusResponse.message || "Failed to check payment status"
        );
      }
      console.log("Payment status before confirmation:", statusResponse);

      if (statusResponse.paymentStatus === "PAID") {
        setExistingPaymentDetected(true);
        setExistingPaymentDetails({
          method: statusResponse.paymentMethod || paymentMethod,
          date: statusResponse.paymentDate || new Date().toISOString(),
          amount: statusResponse.totalAmount || orderTotal,
        });
        setOrderDetails(statusResponse);
        setShowModal(true);
        return;
      }

      if (statusResponse.paymentStatus === "PENDING") {
        setTransactionStatus("PENDING");
        setError(
          "A pending payment transaction exists. Please wait for it to complete or try again later."
        );
        setShowModal(true);
        return;
      }

      const response = await authAPI.post(`/payment/confirm`, {
        orderId: parseInt(orderId),
      });
      if (response.data.success) {
        try {
          const customerInfo = JSON.parse(
            localStorage.getItem("customerInfo")
          ) || {
            id: 1,
            fullname: "Guest Customer",
          };
          const tableNumberNumeric = orderDetails?.tableId || 1;
          const paymentMethodText = getPaymentMethodDisplayText(paymentMethod);
          const notificationMessage = `Customer has completed payment using ${paymentMethodText}`;

          if (!customerInfo.id || !tableNumberNumeric || !orderId) {
            console.error("Invalid notification data:", {
              customerId: customerInfo.id,
              tableNumber: tableNumberNumeric,
              orderId,
            });
            throw new Error("Invalid notification data");
          }

          await authAPI.post(`/notifications`, {
            customerId: customerInfo.id,
            tableNumber: tableNumberNumeric,
            type: "PAYMENT_REQUEST",
            orderId: parseInt(orderId),
            additionalMessage: notificationMessage,
          });
        } catch (notifError) {
          console.error(
            "Error sending notification after payment:",
            notifError
          );
          setError(
            "Payment confirmed, but failed to send notification. Please contact support."
          );
        }

        localStorage.removeItem("latestOrderInfo");
        sessionStorage.removeItem("latestOrderInfo");
        setShowModal(false);

        const refreshResponse = await getPaymentStatus(orderId);
        if (refreshResponse.error) {
          throw new Error(
            refreshResponse.message || "Failed to refresh payment status"
          );
        }
        setOrderDetails(refreshResponse);
        setExistingPaymentDetected(true);
        setExistingPaymentDetails({
          method: refreshResponse.paymentMethod || paymentMethod,
          date: refreshResponse.paymentDate || new Date().toISOString(),
          amount: refreshResponse.totalAmount || orderTotal,
        });

        setTimeout(() => {
          navigate("/evaluate_cus");
        }, 1000);
      } else {
        setError("Failed to confirm payment: " + response.data.message);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      if (
        err.response?.status === 400 &&
        err.response?.data?.message.includes("No pending payment found")
      ) {
        setError(
          `No pending payment found for order ${orderId}. Please initiate a payment first.`
        );
        setShowModal(true);
      } else if (
        err.response?.status === 400 &&
        err.response?.data?.message.includes("Payment is still PENDING")
      ) {
        setTransactionStatus("PENDING");
        setError(
          "Payment is still pending. Please wait for it to complete or try again later."
        );
        setShowModal(true);
      } else if (err.response?.status === 409) {
        setExistingPaymentDetected(true);
        try {
          const refreshResponse = await getPaymentStatus(orderId);
          if (refreshResponse.error) {
            throw new Error(
              refreshResponse.message || "Failed to refresh payment status"
            );
          }
          setOrderDetails(refreshResponse);
          setExistingPaymentDetails({
            method: refreshResponse.paymentMethod || paymentMethod,
            date: refreshResponse.paymentDate || new Date().toISOString(),
            amount: refreshResponse.totalAmount || orderTotal,
          });
          if (refreshResponse.transactionStatus === "PENDING") {
            setTransactionStatus("PENDING");
            setError("Transaction is still pending. Please check its status.");
          } else {
            setError("This order has already been paid. No need to confirm.");
          }
          setShowModal(true);
        } catch (refreshErr) {
          console.error("Error refreshing order data:", refreshErr);
          setError(
            "Failed to verify existing payment. Please contact support."
          );
        }
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to confirm payment. Please try again!"
        );
        setShowModal(true);
      }
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
        return "Online Payment";
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
                orderResponse.message || "Failed to fetch payment status"
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
              "VNPay payment failed: " + verifyResponse.data.message
            );
          }
          navigate(`/payment_cus?orderId=${orderId}`, { replace: true });
        } catch (err) {
          console.error("Error verifying VNPay payment:", err);
          if (err.response?.status === 401) {
            setError(
              "Unauthorized access. Check token or API configuration."
            );
          } else if (err.response?.status === 400) {
            setError(
              "Invalid payment data: " + err.response.data.message
            );
          } else {
            setError(
              "Unable to verify payment: " +
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            onClick={() => navigate("/menu_cus")}
            className="!bg-red-500 text-white py-2 px-4 rounded-lg"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const orderTotal = getOrderTotal();
  const momoQrUrl = `https://nhantien.momo.vn/${momoPhoneNumber}`;

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <div className="max-w-lg mx-auto w-full bg-white py-2 shadow-md z-10">
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

      <div className="flex-1 overflow-y-auto mt-6 p-4">
        {(existingPaymentDetected || transactionStatus === "PENDING") && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                {existingPaymentDetected ? (
                  <p className="text-sm text-green-700">
                    This order has already been paid using{" "}
                    {getPaymentMethodDisplayText(
                      existingPaymentDetails?.method || "Unknown"
                    )}
                    .
                  </p>
                ) : (
                  <p className="text-sm text-yellow-700">
                    A payment transaction is pending. Please wait for it to
                    complete or check its status.
                  </p>
                )}
                {existingPaymentDetails && (
                  <p className="text-xs text-green-600 mt-1">
                    Transaction date: {formatDate(existingPaymentDetails.date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
              <span>{formatDate(orderDetails?.orderDate) || "N/A"}</span>
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
            <div className="flex justify-between">
              <span className="text-gray-500">TRANSACTION STATUS</span>
              <span
                className={
                  orderDetails?.transactionStatus === "PENDING"
                    ? "text-yellow-500"
                    : orderDetails?.transactionStatus === "PAID"
                    ? "text-green-500"
                    : "text-gray-500"
                }
              >
                {orderDetails?.transactionStatus || "N/A"}
              </span>
            </div>
            {orderDetails?.paymentStatus === "PAID" &&
              orderDetails?.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-500">PAYMENT METHOD</span>
                  <span className="text-green-500">
                    {getPaymentMethodDisplayText(orderDetails.paymentMethod)}
                  </span>
                </div>
              )}
            {orderDetails?.paymentStatus === "PAID" &&
              orderDetails?.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">PAYMENT DATE</span>
                  <span>{formatDate(orderDetails.paymentDate)}</span>
                </div>
              )}
          </div>
        </div>

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
                  <span className="font-bold">
                    {item.dishName || "Unknown Dish"}
                  </span>
                  <span className="text-center">
                    {item.notes || "No description"}
                    <br />
                    Quantity: {parseInt(item.quantity, 10) || 1}
                  </span>
                  <span className="text-right text-red-500">
                    {(parseFloat(item.price) || 0).toLocaleString()} VND
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

        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
          <div className="space-y-4 mb-4">
            {orderDetails?.discount && orderDetails.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">DISCOUNT</span>
                <span className="text-red-500">
                  -{(parseFloat(orderDetails.discount) || 0).toLocaleString()}{" "}
                  VND
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT METHOD</span>
              {orderDetails?.paymentStatus === "PAID" ? (
                <span className="font-medium">
                  {getPaymentMethodDisplayText(
                    orderDetails?.paymentMethod || "Unknown"
                  )}
                </span>
              ) : (
                <select
                  className="border border-gray-300 rounded-lg px-2 py-1"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={
                    orderDetails?.paymentStatus === "PAID" ||
                    existingPaymentDetected ||
                    transactionStatus === "PENDING"
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="CREDIT">Credit Card</option>
                  <option value="MOMO">Momo</option>
                </select>
              )}
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>{orderTotal.toLocaleString()} VND</span>
            </div>
          </div>

          {orderDetails?.paymentStatus !== "PAID" &&
            !existingPaymentDetected &&
            transactionStatus !== "PENDING" && (
              <button
                className="w-full !bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
                onClick={handlePayment}
                disabled={processingPayment || orderTotal <= 0}
              >
                {processingPayment ? "PROCESSING..." : "PAYMENT"}
              </button>
            )}

          {(orderDetails?.paymentStatus === "PAID" ||
            existingPaymentDetected) && (
            <button
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
              onClick={() => navigate("/evaluate_cus")}
            >
              COMPLETE
            </button>
          )}

          {transactionStatus === "PENDING" && (
            <button
              className="w-full !bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
              onClick={checkTransactionStatus}
            >
              CHECK TRANSACTION STATUS
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            <button
              onClick={() => {
                if (paymentMethod === "MOMO") {
                  resetPayment();
                }
                setShowModal(false);
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

            {existingPaymentDetected ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <svg
                    className="h-12 w-12 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">
                  Payment Already Completed
                </h3>
                <p className="text-center text-gray-700 mb-6">
                  This order has already been paid using{" "}
                  {getPaymentMethodDisplayText(
                    existingPaymentDetails?.method || "Unknown"
                  )}
                  .
                  <br />
                  <span className="text-sm text-gray-500">
                    {formatDate(existingPaymentDetails?.date)}
                  </span>
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate("/evaluate_cus");
                    }}
                    className="w-1/2 !bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Continue to Evaluation
                  </button>
                </div>
              </>
            ) : transactionStatus === "PENDING" ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <svg
                    className="h-12 w-12 text-yellow-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">
                  Transaction Pending
                </h3>
                <p className="text-center text-gray-700 mb-6">
                  A payment transaction is pending for order #{orderId}. Please
                  wait for it to complete or check the status.
                  <br />
                  <span className="text-sm text-gray-500">
                    {formatDate(existingPaymentDetails?.date)}
                  </span>
                </p>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-1/2 bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={checkTransactionStatus}
                    className="w-1/2 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Check Status
                  </button>
                </div>
              </>
            ) : paymentMethod === "MOMO" ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <h3 className="text-xl font-bold text-pink-500">
                    Momo Payment
                  </h3>
                </div>
                <div className="flex justify-center mb-4">
                  <img
                    src={`${API_BASE_URL}/api/images/qrCode.png`}
                    alt="Momo QR Code"
                    className="w-48 h-48 border"
                    onError={() => console.error("Failed to load Momo QR code")}
                  />
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => {
                      resetPayment();
                      setShowModal(false);
                    }}
                    className="w-1/2 !bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="w-1/2 !bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
                  >
                    Paid
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={`${API_BASE_URL}/api/images/logo.png`}
                  alt="Restaurant Logo"
                  className="mx-auto mb-4 w-24 h-24 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <h3 className="text-xl font-bold text-center mb-2">
                  Payment Confirmation
                </h3>
                <p className="text-center text-gray-700 mb-6">
                  Are you sure to proceed with the payment?{" "}
                  <strong>{orderTotal.toLocaleString()}đ</strong> for order #
                  {orderId}?
                </p>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-1/2 !bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="w-1/2 !bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;