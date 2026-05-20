import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";

// Create a base API instance with consistent configuration
const API = axios.create({
  baseURL: "http://localhost:8080",
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
  const [useGraphQL, setUseGraphQL] = useState(false);

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
          "Content-Type": "application/json",
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
          result.errors[0].message || "Unknown GraphQL error occurred"
        );
      }

      return result.data;
    } catch (err) {
      console.error("GraphQL execution error:", err);
      throw err;
    }
  };

  // Fetch cart data using REST API
  const fetchCartDataREST = useCallback(async () => {
    try {
      // Adding a check to prevent error cascade
      if (useGraphQL) {
        throw new Error("Skipping REST API due to previous failures");
      }

      const response = await API.get("/api/orders/cart");
      console.log("Cart data fetched via REST:", response.data);

      const items =
        response.data && response.data.items ? response.data.items : [];
      setCartItems(items);
      updateCartMetrics(items);
      saveCartToLocalStorage(response.data);

      return response.data;
    } catch (err) {
      console.error("Error fetching cart via REST:", err);
      throw err;
    }
  }, [useGraphQL]);

  // Fetch cart data using GraphQL
  const fetchCartDataGraphQL = useCallback(async () => {
    try {
      const query = `
        query GetOrderCart {
          orderCart {
            items {
              dishId
              dishName
              dishImage
              quantity
              price
              notes
            }
            totalAmount
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (!result || !result.orderCart) {
        throw new Error("Invalid GraphQL response structure");
      }

      const cartData = result.orderCart;
      console.log("Cart data fetched via GraphQL:", cartData);

      if (cartData && cartData.items) {
        setCartItems(cartData.items);
        updateCartMetrics(cartData.items);
        saveCartToLocalStorage(cartData);
      }

      return cartData;
    } catch (err) {
      console.error("Error fetching cart via GraphQL:", err);
      throw err;
    }
  }, []);

  // Main fetch cart function that tries GraphQL first, then REST if GraphQL fails
  const fetchCartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use GraphQL as primary method
      return await fetchCartDataGraphQL();
    } catch (err) {
      console.error("GraphQL fetch failed:", err);

      try {
        // Fall back to REST API
        return await fetchCartDataREST();
      } catch (restErr) {
        console.error("REST fetch also failed:", restErr);

        // Try to use cached data as last resort
        const cachedData = loadCartFromLocalStorage();
        if (cachedData) {
          setError("Using cached cart data. Network error occurred.");
          return cachedData;
        }

        // Initialize with empty cart if nothing else works
        const emptyCart = { items: [] };
        setCartItems(emptyCart.items);
        updateCartMetrics(emptyCart.items);
        setError("Failed to load cart data - using empty cart");
        return emptyCart;
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCartDataGraphQL, fetchCartDataREST]);

  // Initialize cart and set up refresh interval with error handling
  useEffect(() => {
    let intervalId;

    const initializeCart = async () => {
      try {
        await fetchCartData();

        // Only set up interval if initial fetch succeeded
        intervalId = setInterval(() => {
          fetchCartData().catch((err) => {
            console.error("Error in cart refresh interval:", err);
            // Don't clear interval, just log the error
          });
        }, 30000);
      } catch (err) {
        console.error("Failed to initialize cart:", err);
        // Try again in 10 seconds if initial fetch failed
        setTimeout(initializeCart, 10000);
      }
    };

    initializeCart();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchCartData]);

  // Add item to cart with GraphQL
  const addToCartGraphQL = useCallback(async (item) => {
    try {
      setLoading(true);
      setError(null);

      const mutation = `
        mutation AddDishToCart($input: OrderItemInput!) {
          addDishToOrderCart(input: $input) {
            items {
              dishId
              dishName
              quantity
              price
              notes
              dishImage
            }
            totalAmount
          }
        }
      `;

      const variables = {
        input: {
          dishId: item.dishId.toString(),
          quantity: item.quantity || 1,
          notes: item.notes || "",
        },
      };

      const result = await executeGraphQL(mutation, variables);

      if (!result || !result.addDishToOrderCart) {
        throw new Error("Invalid GraphQL response structure");
      }

      const updatedCart = result.addDishToOrderCart;
      updateCartWithGraphQLData(updatedCart);

      return updatedCart;
    } catch (err) {
      console.error("Error adding to cart using GraphQL:", err);
      setError("Failed to add item to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart - uses REST API by default, falls back to GraphQL
  const addToCart = useCallback(
    async (item) => {
      try {
        setLoading(true);
        setError(null);

        // If we're using GraphQL mode, use GraphQL endpoint
        if (useGraphQL) {
          return await addToCartGraphQL(item);
        }

        const orderItemData = {
          dishId: item.dishId,
          quantity: item.quantity || 1,
          notes: item.notes || "",
        };

        console.log("Adding to cart via REST:", orderItemData);
        const response = await API.post("/api/orders/cart/add", orderItemData);

        const updatedCart = response.data;
        if (updatedCart && updatedCart.items) {
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);
        }

        return updatedCart;
      } catch (err) {
        console.error("Error adding to cart:", err);

        // If REST fails, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for add to cart");
          setUseGraphQL(true);
          return await addToCartGraphQL(item);
        }

        setError("Failed to add item to cart");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addToCartGraphQL, useGraphQL]
  );

  // Update item quantity with GraphQL
  const updateItemQuantityGraphQL = useCallback(async (dishId, quantity) => {
    try {
      const mutation = `
        mutation UpdateItemQuantity($dishId: ID!, $quantity: Int!) {
          updateItemQuantity(dishId: $dishId, quantity: $quantity) {
            items {
              dishId
              dishName
              quantity
              price
              notes
              dishImage
            }
            totalAmount
          }
        }
      `;

      const variables = {
        dishId: dishId.toString(),
        quantity: quantity,
      };

      const result = await executeGraphQL(mutation, variables);

      if (!result || !result.updateItemQuantity) {
        throw new Error("Invalid GraphQL response structure");
      }

      const updatedCart = result.updateItemQuantity;
      setCartItems(updatedCart.items);
      updateCartMetrics(updatedCart.items);
      saveCartToLocalStorage(updatedCart);

      return updatedCart;
    } catch (err) {
      console.error("Error updating quantity with GraphQL:", err);
      throw err;
    }
  }, []);

  // Update item quantity - uses REST API by default, falls back to GraphQL
  const updateItemQuantity = useCallback(
    async (dishId, quantity) => {
      try {
        setLoading(true);
        setError(null);

        // If we're in GraphQL mode
        if (useGraphQL) {
          return await updateItemQuantityGraphQL(dishId, quantity);
        }

        // REST API approach
        const response = await API.put(
          `/api/orders/cart/items/${dishId}?quantity=${quantity}`
        );

        const updatedCart = response.data;
        if (updatedCart && updatedCart.items) {
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);
        }

        return updatedCart;
      } catch (err) {
        console.error("Error updating quantity:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for update quantity");
          setUseGraphQL(true);
          return await updateItemQuantityGraphQL(dishId, quantity);
        }

        setError("Failed to update quantity");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateItemQuantityGraphQL, useGraphQL]
  );

  // Remove item from cart with GraphQL
  const removeItemGraphQL = useCallback(async (dishId) => {
    try {
      const mutation = `
        mutation RemoveItemFromCart($dishId: ID!) {
          removeItemFromCart(dishId: $dishId) {
            items {
              dishId
              dishName
              quantity
              price
              notes
              dishImage
            }
            totalAmount
          }
        }
      `;

      const variables = {
        dishId: dishId.toString(),
      };

      const result = await executeGraphQL(mutation, variables);

      if (!result || !result.removeItemFromCart) {
        throw new Error("Invalid GraphQL response structure");
      }

      const updatedCart = result.removeItemFromCart;
      setCartItems(updatedCart.items);
      updateCartMetrics(updatedCart.items);
      saveCartToLocalStorage(updatedCart);

      return updatedCart;
    } catch (err) {
      console.error("Error removing item with GraphQL:", err);
      throw err;
    }
  }, []);

  // Remove item from cart - uses REST API by default, falls back to GraphQL
  const removeItem = useCallback(
    async (dishId) => {
      try {
        setLoading(true);
        setError(null);

        // If we're in GraphQL mode
        if (useGraphQL) {
          return await removeItemGraphQL(dishId);
        }

        // REST API approach
        const response = await API.delete(`/api/orders/cart/items/${dishId}`);

        const updatedCart = response.data;
        if (updatedCart && updatedCart.items) {
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);
        }

        return updatedCart;
      } catch (err) {
        console.error("Error removing item:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for remove item");
          setUseGraphQL(true);
          return await removeItemGraphQL(dishId);
        }

        setError("Failed to remove item");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeItemGraphQL, useGraphQL]
  );

  // Update item notes with GraphQL
  const updateItemNotesGraphQL = useCallback(async (dishId, notes) => {
    try {
      const mutation = `
        mutation UpdateItemNotes($dishId: ID!, $input: UpdateItemNotesInput!) {
          updateItemNotes(dishId: $dishId, input: $input) {
            items {
              dishId
              dishName
              quantity
              price
              notes
              dishImage
            }
            totalAmount
          }
        }
      `;

      const variables = {
        dishId: dishId.toString(),
        input: {
          notes: notes,
        },
      };

      const result = await executeGraphQL(mutation, variables);

      if (!result || !result.updateItemNotes) {
        throw new Error("Invalid GraphQL response structure");
      }

      const updatedCart = result.updateItemNotes;
      setCartItems(updatedCart.items);
      updateCartMetrics(updatedCart.items);
      saveCartToLocalStorage(updatedCart);

      return updatedCart;
    } catch (err) {
      console.error("Error updating item notes with GraphQL:", err);
      throw err;
    }
  }, []);

  // Update item notes - uses REST API by default, falls back to GraphQL
  const updateItemNotes = useCallback(
    async (dishId, notes) => {
      try {
        setLoading(true);
        setError(null);

        // Store notes locally as a backup
        localStorage.setItem(`note-${dishId}`, notes);

        // If we're in GraphQL mode
        if (useGraphQL) {
          return await updateItemNotesGraphQL(dishId, notes);
        }

        // REST API approach
        const existingItem = cartItems.find((item) => item.dishId === dishId);
        if (!existingItem) {
          console.warn(`Item with ID ${dishId} not found in cart`);
          throw new Error("Item not found in cart");
        }

        const response = await API.put(
          `/api/orders/cart/items/${dishId}/notes`,
          { notes }
        );

        // Update local state first for better UX
        const updatedItems = cartItems.map((item) =>
          item.dishId === dishId ? { ...item, notes } : item
        );
        setCartItems(updatedItems);

        const cartData = {
          items: updatedItems,
          totalAmount: updatedItems.reduce(
            (total, item) => total + parseFloat(item.price) * item.quantity,
            0
          ),
        };
        saveCartToLocalStorage(cartData);

        return response.data;
      } catch (err) {
        console.error("Error updating item notes:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for update notes");
          setUseGraphQL(true);
          return await updateItemNotesGraphQL(dishId, notes);
        }

        // If even GraphQL fails, just update the UI locally
        const updatedItems = cartItems.map((item) =>
          item.dishId === dishId ? { ...item, notes } : item
        );
        setCartItems(updatedItems);

        setError("Server error, notes updated locally only");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cartItems, updateItemNotesGraphQL, useGraphQL]
  );

  // Update cart with data from GraphQL response
  const updateCartWithGraphQLData = useCallback((graphQLCartData) => {
    if (!graphQLCartData || !graphQLCartData.items) {
      console.warn("Invalid GraphQL cart data received", graphQLCartData);
      return;
    }

    setCartItems(graphQLCartData.items);
    updateCartMetrics(graphQLCartData.items);
    saveCartToLocalStorage(graphQLCartData);

    return graphQLCartData;
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
        setOrderError("Failed to load orders data");
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
        setOrderError("Invalid order ID");
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
          setOrderError(`Failed to load order #${orderId}`);
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
      setOrderError("Invalid table ID");
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
      setOrderError(`Failed to load orders for table #${tableId}`);
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
        setOrderError("Invalid order ID or status");
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
          setOrderError(`Failed to update order status`);
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
