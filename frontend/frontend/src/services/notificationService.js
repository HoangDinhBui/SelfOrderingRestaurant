import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Create axios instance for notification API calls
const notificationAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Add authorization header to requests
notificationAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Error handling function
const handleApiError = (error) => {
  if (error.response) {
    console.error("API Error Response:", error.response.data);
    return error.response.data;
  } else if (error.request) {
    console.error("API Request Error:", error.request);
    return { error: "No response received from server" };
  } else {
    console.error("API Error:", error.message);
    return { error: error.message };
  }
};

// Get all notifications for current shift (for staff)
export const getCurrentShiftNotifications = async () => {
  try {
    const response = await notificationAPI.get("/notifications/shift/current");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    // Check if notificationId is valid before making the request
    if (!notificationId && notificationId !== 0) {
      console.error("Invalid notification ID:", notificationId);
      return { error: "Invalid notification ID" };
    }

    const response = await notificationAPI.put(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    // Check if notificationId is valid before making the request
    if (!notificationId && notificationId !== 0) {
      console.error("Invalid notification ID:", notificationId);
      return { error: "Invalid notification ID" };
    }

    const response = await notificationAPI.delete(
      `/notifications/${notificationId}`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get notifications by table
export const getNotificationsByTable = async (tableId) => {
  try {
    if (!tableId && tableId !== 0) {
      console.error("Invalid table ID:", tableId);
      return { error: "Invalid table ID" };
    }

    const response = await notificationAPI.get(
      `/notifications/table/${tableId}`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getCurrentShiftNotifications,
  markNotificationAsRead,
  deleteNotification,
  getNotificationsByTable,
};
