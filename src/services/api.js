import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_KEY; // URL backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===================== Staff ===================== //
export const getStaff = async () => {
  const response = await api.get("/Staff");
  return response.data;
};

export const getDishById = async (id) => {
  const response = await api.get(`/Staff/${id}`);
  return response.data;
};

export const createDish = async (StaffData) => {
  const response = await api.post("/Staff", StaffData);
  return response.data;
};

export const updateDish = async (id, StaffData) => {
  const response = await api.put(`/Staff/${id}`, StaffData);
  return response.data;
};

export const deleteDish = async (id) => {
  const response = await api.delete(`/Staff/${id}`);
  return response.data;
};

// ===================== Customers ===================== //
export const getCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

// ===================== Tables ===================== //
export const getTables = async () => {
  const response = await api.get("/tables");
  return response.data;
};

export const updateTableStatus = async (tableId, status) => {
  const response = await api.put(`/tables/${tableId}`, { status });
  return response.data;
};

// ===================== Orders ===================== //
export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/staff/orders/${orderId}/status`, { status });
  return response.data;
};

export default api;
