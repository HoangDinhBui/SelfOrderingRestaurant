import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";

import { BACKEND_URL, authHeaders } from "../config";
// Create a base API instance with consistent configuration
const API = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 5000, // Add timeout to prevent long-hanging requests
});

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Create and export the CartContext
export const CartContext = createContext({
  // Cart state
  cartItems: [],
  setCartItems: () => {},
  cartItemCount: 0,
  totalAmount: 0,
  loading: false,
  error: null,

  // Cart operations
  fetchCartData: () => {},
  addToCart: () => {},
  updateItemQuantity: () => {},
  removeItem: () => {},
  updateItemNotes: () => {},
  addToCartGraphQL: () => {},
  updateCartWithGraphQLData: () => {},

  // Order operations
  orders: [],
  currentOrder: null,
  orderLoading: false,
  orderError: null,
  fetchOrders: () => {},
  fetchOrderById: () => {},
  fetchOrdersByTableId: () => {},
  updateOrderStatus: () => {},
});

export const CartProvider = ({ children }) => {
  // Cart state
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Order state
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Update cart metrics (count and total) when items change
  const updateCartMetrics = (items) => {
    if (!items || !Array.isArray(items)) {
      console.warn("Invalid items provided to updateCartMetrics:", items);
      return;
    }

    const count = items.reduce((total, item) => total + item.quantity, 0);
    const amount = items.reduce(
      (total, item) => total + parseFloat(item.price || 0) * item.quantity,
      0
    );

    setCartItemCount(count);
    setTotalAmount(amount);
  };

  // Save cart data to localStorage
  const saveCartToLocalStorage = (cartData) => {
    try {
      localStorage.setItem("cartData", JSON.stringify(cartData));
      localStorage.setItem("cartLastUpdated", new Date().toISOString());
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  };

  // Load cart data from localStorage
  const loadCartFromLocalStorage = () => {
    try {
      const cached = localStorage.getItem("cartData");
      if (cached) {
        const parsedData = JSON.parse(cached);
        if (parsedData && parsedData.items) {
          setCartItems(parsedData.items);
          updateCartMetrics(parsedData.items);
          return parsedData;
        }
      }
    } catch (e) {
      console.error("Error parsing cached cart data:", e);
    }
    return null;
  };

  // Execute GraphQL query/mutation with better error handling
  const executeGraphQL = async (query, variables = {}) => {
    try {
      const response = await fetch(`${API.defaults.baseURL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", ...authHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`GraphQL HTTP error: ${response.status}`);
      }

      if (result.errors && result.errors.length > 0) {
        throw new Error(
          result.errors[0].message || "Đã có lỗi xảy ra"
        );
      }

      return result.data;
    } catch (err) {
      console.error("GraphQL execution error:", err);
      throw err;
    }
  };

  // ================ CART (client-side) ================
  // The cart lives in localStorage instead of the backend's @SessionScope cart. That cart is keyed
  // by the JSESSIONID cookie, which browsers do not send cross-site (vercel.app -> onrender.com,
  // SameSite=Lax by default; Safari/in-app browsers block third-party cookies outright), so every
  // request got a fresh, empty session and the cart emptied on reload. Orders are created from
  // the items sent by the client (submitCustomerOrder), so no server-side cart is needed.

  const commitCart = (items) => {
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.price || 0) * item.quantity,
      0
    );
    const cartData = { items, totalAmount };
    setCartItems(items);
    updateCartMetrics(items);
    saveCartToLocalStorage(cartData);
    return cartData;
  };

  const readCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem("cartData") || "null");
      return parsed && Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      return [];
    }
  };

  // Callers may pass only a dishId (detail page, voice order); look the dish up when needed
  const resolveDish = async (item) => {
    if (item.dishName && item.price != null) return item;
    const { data } = await API.get(`/api/dishes/${item.dishId}`);
    return {
      ...item,
      dishName: data.dishName || data.name,
      price: data.price,
      dishImage: data.imageUrl || null,
    };
  };

  const fetchCartData = useCallback(async () => {
    const data = loadCartFromLocalStorage();
    if (!data) {
      setCartItems([]);
      updateCartMetrics([]);
    }
    return data || { items: [], totalAmount: 0 };
  }, []);

  const addToCartGraphQL = useCallback(async (item) => {
    setLoading(true);
    setError(null);
    try {
      const dish = await resolveDish(item);
      const dishId = Number(dish.dishId);
      const quantity = Number(dish.quantity) || 1;
      const items = readCart();
      const existing = items.find((i) => Number(i.dishId) === dishId);
      const next = existing
        ? items.map((i) =>
            Number(i.dishId) === dishId
              ? { ...i, quantity: i.quantity + quantity, notes: dish.notes || i.notes }
              : i
          )
        : [
            ...items,
            {
              dishId,
              dishName: dish.dishName,
              dishImage: dish.dishImage || dish.imageUrl || null,
              price: Number(dish.price) || 0,
              quantity,
              notes: dish.notes || "",
            },
          ];
      return commitCart(next);
    } catch (err) {
      setError("Không thêm được món vào giỏ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = addToCartGraphQL;

  const updateItemQuantity = useCallback(async (dishId, quantity) => {
    const items = readCart();
    if (!items.some((i) => Number(i.dishId) === Number(dishId))) {
      throw new Error("Món không có trong giỏ");
    }
    const next =
      quantity <= 0
        ? items.filter((i) => Number(i.dishId) !== Number(dishId))
        : items.map((i) => (Number(i.dishId) === Number(dishId) ? { ...i, quantity } : i));
    return commitCart(next);
  }, []);

  const removeItem = useCallback(async (dishId) => {
    return commitCart(readCart().filter((i) => Number(i.dishId) !== Number(dishId)));
  }, []);

  const updateItemNotes = useCallback(async (dishId, notes) => {
    const items = readCart();
    if (!items.some((i) => Number(i.dishId) === Number(dishId))) {
      throw new Error("Món không có trong giỏ");
    }
    return commitCart(
      items.map((i) => (Number(i.dishId) === Number(dishId) ? { ...i, notes } : i))
    );
  }, []);

  const updateCartWithGraphQLData = useCallback((cartData) => {
    if (!cartData || !Array.isArray(cartData.items)) return;
    return commitCart(cartData.items);
  }, []);

  // Keep every open tab/page in sync, and restore the cart on first load
  useEffect(() => {
    loadCartFromLocalStorage();
    const onStorage = (e) => e.key === "cartData" && loadCartFromLocalStorage();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  // ================ NEW ORDER FUNCTIONS ================

  // Fetch all orders using GraphQL
  const fetchOrdersGraphQL = useCallback(async () => {
    try {
      const query = `
        query GetAllOrders {
          orders {
            orderId
            customerName
            tableNumber
            status
            totalAmount
            paymentStatus
            items {
              dishId
              dishName
              quantity
              price
              notes
            }
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (!result || !result.orders) {
        throw new Error("Invalid GraphQL response structure");
      }

      return result.orders;
    } catch (err) {
      console.error("Error fetching orders via GraphQL:", err);
      throw err;
    }
  }, []);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    setOrderLoading(true);
    setOrderError(null);

    try {
      // Try GraphQL first
      const ordersData = await fetchOrdersGraphQL();
      setOrders(ordersData);
      return ordersData;
    } catch (err) {
      console.error("GraphQL orders fetch failed:", err);

      try {
        // Fall back to REST API
        const response = await API.get("/api/orders");
        setOrders(response.data);
        return response.data;
      } catch (restErr) {
        console.error("REST orders fetch also failed:", restErr);
        setOrderError("Không tải được dữ liệu đơn hàng");
        return [];
      }
    } finally {
      setOrderLoading(false);
    }
  }, [fetchOrdersGraphQL]);

  // Fetch order by ID using GraphQL
  const fetchOrderByIdGraphQL = useCallback(async (orderId) => {
    try {
      const query = `
        query GetOrder($orderId: ID!) {
          order(orderId: $orderId) {
            orderId
            customerName
            tableNumber
            status
            totalAmount
            paymentStatus
            items {
              dishId
              dishName
              quantity
              price
              notes
            }
          }
        }
      `;

      const variables = {
        orderId: orderId.toString(),
      };

      const result = await executeGraphQL(query, variables);

      if (!result || !result.order) {
        throw new Error("Invalid GraphQL response structure");
      }

      return result.order;
    } catch (err) {
      console.error(`Error fetching order ${orderId} via GraphQL:`, err);
      throw err;
    }
  }, []);

  // Fetch order by ID
  const fetchOrderById = useCallback(
    async (orderId) => {
      if (!orderId) {
        console.error("Cannot fetch order without orderId");
        setOrderError("Mã đơn hàng không hợp lệ");
        return null;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        // Try GraphQL first
        const orderData = await fetchOrderByIdGraphQL(orderId);
        setCurrentOrder(orderData);
        return orderData;
      } catch (err) {
        console.error("GraphQL order fetch failed:", err);

        try {
          // Fall back to REST API
          const response = await API.get(`/api/orders/${orderId}`);
          setCurrentOrder(response.data);
          return response.data;
        } catch (restErr) {
          console.error("REST order fetch also failed:", restErr);
          setOrderError(`Không tải được đơn #${orderId}`);
          return null;
        }
      } finally {
        setOrderLoading(false);
      }
    },
    [fetchOrderByIdGraphQL]
  );

  // Fetch orders by table ID
  const fetchOrdersByTableId = useCallback(async (tableId) => {
    if (!tableId) {
      console.error("Cannot fetch orders without tableId");
      setOrderError("Mã bàn không hợp lệ");
      return [];
    }

    setOrderLoading(true);
    setOrderError(null);

    try {
      // For now, there's no GraphQL endpoint for this specific operation,
      // so we'll use REST directly
      const response = await API.get(`/api/staff/tables/${tableId}/orders`);
      return response.data || [];
    } catch (err) {
      console.error(`Error fetching orders for table ${tableId}:`, err);
      setOrderError(`Không tải được đơn của bàn #${tableId}`);
      return [];
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // Update order status using GraphQL
  const updateOrderStatusGraphQL = useCallback(async (orderId, status) => {
    try {
      const mutation = `
        mutation UpdateOrderStatus($orderId: ID!, $input: UpdateOrderStatusInput!) {
          updateOrderStatus(orderId: $orderId, input: $input)
        }
      `;

      const variables = {
        orderId: orderId.toString(),
        input: {
          status: status,
        },
      };

      const result = await executeGraphQL(mutation, variables);
      return result.updateOrderStatus;
    } catch (err) {
      console.error("Error updating order status with GraphQL:", err);
      throw err;
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      if (!orderId || !status) {
        console.error("Cannot update order status without orderId and status");
        setOrderError("Mã đơn hoặc trạng thái không hợp lệ");
        return false;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        // Try GraphQL first
        await updateOrderStatusGraphQL(orderId, status);

        // Refresh current order if it's the one being updated
        if (currentOrder && currentOrder.orderId === orderId) {
          await fetchOrderById(orderId);
        }

        return true;
      } catch (err) {
        console.error("GraphQL update status failed:", err);

        try {
          // Fall back to REST API
          await API.put(`/api/orders/${orderId}/status`, { status });

          // Refresh current order if it's the one being updated
          if (currentOrder && currentOrder.orderId === orderId) {
            await fetchOrderById(orderId);
          }

          return true;
        } catch (restErr) {
          console.error("REST update status failed:", restErr);
          setOrderError(`Không cập nhật được trạng thái đơn`);
          return false;
        }
      } finally {
        setOrderLoading(false);
      }
    },
    [currentOrder, fetchOrderById, updateOrderStatusGraphQL]
  );

  // Store context value in a ref to avoid unnecessary re-renders
  const contextValueRef = useRef(null);

  useEffect(() => {
    const contextValue = {
      // Cart state and operations
      cartItems,
      setCartItems,
      cartItemCount,
      totalAmount,
      loading,
      error,
      fetchCartData,
      addToCart,
      updateItemQuantity,
      removeItem,
      updateItemNotes,
      addToCartGraphQL,
      updateCartWithGraphQLData,

      // Order state and operations
      orders,
      currentOrder,
      orderLoading,
      orderError,
      fetchOrders,
      fetchOrderById,
      fetchOrdersByTableId,
      updateOrderStatus,
    };

    contextValueRef.current = contextValue;

    // Make context available globally for debugging
    window.cartContextRef = contextValueRef;

    return () => {
      if (window.cartContextRef === contextValueRef) {
        delete window.cartContextRef;
      }
    };
  }, [
    // Cart dependencies
    cartItems,
    cartItemCount,
    totalAmount,
    loading,
    error,
    fetchCartData,
    addToCart,
    updateItemQuantity,
    removeItem,
    updateItemNotes,
    addToCartGraphQL,
    updateCartWithGraphQLData,

    // Order dependencies
    orders,
    currentOrder,
    orderLoading,
    orderError,
    fetchOrders,
    fetchOrderById,
    fetchOrdersByTableId,
    updateOrderStatus,
  ]);

  return (
    <CartContext.Provider
      value={{
        // Cart state and operations
        cartItems,
        setCartItems,
        cartItemCount,
        totalAmount,
        loading,
        error,
        fetchCartData,
        addToCart,
        updateItemQuantity,
        removeItem,
        updateItemNotes,
        addToCartGraphQL,
        updateCartWithGraphQLData,

        // Order state and operations
        orders,
        currentOrder,
        orderLoading,
        orderError,
        fetchOrders,
        fetchOrderById,
        fetchOrdersByTableId,
        updateOrderStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
