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

export default new PaymentService();
