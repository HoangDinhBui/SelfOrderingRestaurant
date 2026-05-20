import axios from "axios";

// Get API base URL from environment variable or use default
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to attach authentication to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class PaymentService {
  // Other methods remain unchanged

  /**
   * Generate a receipt PDF
   * @param {Object} tableData - Table data containing table ID and order information
   * @returns {Promise<Blob>} - Promise that resolves with the PDF blob
   */
  async generateReceipt(tableData) {
    try {
      if (!tableData || !tableData.id) {
        throw new Error("Invalid table data");
      }

      // Get all unique order IDs for this table
      const orderIds = tableData.dishes
        .map((dish) => dish.orderId)
        .filter((value, index, self) => self.indexOf(value) === index);

      if (orderIds.length === 0) {
        throw new Error("No orders found for this table");
      }

      // For simplicity, we'll use the first order ID
      // A more complex implementation could handle multiple orders per table
      const orderId = orderIds[0];

      // Call backend API to generate receipt
      const response = await api.get(`/api/receipts/generate/${orderId}`, {
        responseType: "blob",
      });

      return response.data;
    } catch (error) {
      console.error("Error generating receipt:", error);
      throw error;
    }
  }

  /**
   * Download the receipt PDF
   * @param {Blob} pdfBlob - PDF blob data
   * @param {string} tableId - Table ID for the filename
   */
  downloadReceipt(pdfBlob, tableId) {
    const url = window.URL.createObjectURL(new Blob([pdfBlob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `table-${tableId}-receipt.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

// src/services/paymentService.js

/**
 * Confirms a payment for an order
 * @param {number} orderId - The ID of the order to confirm payment for
 * @returns {Promise<Object>} - Response with success status and message
 */
export const confirmPayment = async (orderId) => {
  try {
    const response = await fetch("/api/payment/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to confirm payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw error;
  }
};

/**
 * Processes a new payment for an order
 * @param {Object} paymentData - Payment data including orderId and payment method
 * @returns {Promise<Object>} - Response with transaction details
 */
export const processPayment = async (paymentData) => {
  try {
    const response = await fetch("/api/payment/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to process payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

/**
 * Gets details of a payment by order ID
 * @param {number} orderId - The order ID to get payment details for
 * @returns {Promise<Object>} - Payment details
 */
export const getPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`/api/payment/payment/status/${orderId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to get payment status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting payment status:", error);
    throw error;
  }
};

/**
 * Process cash payment for an order
 * @param {number} orderId - The order ID to process cash payment for
 * @returns {Promise<string>} - Success message
 */
export const processCashPayment = async (orderId) => {
  try {
    const response = await fetch(`/api/payment/payment/cash/${orderId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to process cash payment");
    }

    return await response.text();
  } catch (error) {
    console.error("Error processing cash payment:", error);
    throw error;
  }
};

export default new PaymentService();
