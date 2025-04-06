import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// Create a base API instance with consistent configuration
const API = axios.create({
  baseURL: "http://localhost:8080", // Make sure this matches your backend URL
  withCredentials: true, // Important for session-based cart
});

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate actual item count and total
  const updateCartMetrics = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const amount = items.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
    setCartItemCount(count);
    setTotalAmount(amount);
  };

  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get("/api/orders/cart");
      console.log("Cart data fetched:", response.data);

      const items =
        response.data && response.data.items ? response.data.items : [];
      setCartItems(items);
      updateCartMetrics(items);

      // Store in localStorage as backup
      localStorage.setItem("cartData", JSON.stringify(response.data));

      return response.data;
    } catch (err) {
      console.error("Error fetching cart:", err);

      // Try to recover from localStorage
      try {
        const cached = localStorage.getItem("cartData");
        if (cached) {
          const parsedData = JSON.parse(cached);
          if (parsedData && parsedData.items) {
            setCartItems(parsedData.items);
            updateCartMetrics(parsedData.items);
            setError("Using cached cart data. Network error occurred.");
            return parsedData;
          }
        }
      } catch (e) {
        console.error("Error parsing cached data:", e);
      }

      setError("Failed to load cart data");
      return { items: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCartData();

    // Set up polling to keep cart in sync
    const intervalId = setInterval(() => {
      fetchCartData();
    }, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchCartData]);

  const addToCart = async (item) => {
    try {
      setLoading(true);
      setError(null);

      const orderItemData = {
        dishId: item.dishId,
        quantity: item.quantity || 1,
        notes: item.notes || "",
      };

      console.log("Adding to cart:", orderItemData);
      const response = await API.post("/api/orders/cart/add", orderItemData);

      // Important: immediately update the local state with the new data
      const updatedCart = response.data;
      if (updatedCart && updatedCart.items) {
        setCartItems(updatedCart.items);
        updateCartMetrics(updatedCart.items);
        localStorage.setItem("cartData", JSON.stringify(updatedCart));
      }

      return updatedCart;
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (dishId, quantity) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.put(
        `/api/orders/cart/items/${dishId}?quantity=${quantity}`
      );

      // Update local state
      const updatedCart = response.data;
      if (updatedCart && updatedCart.items) {
        setCartItems(updatedCart.items);
        updateCartMetrics(updatedCart.items);
        localStorage.setItem("cartData", JSON.stringify(updatedCart));
      }

      return updatedCart;
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Failed to update quantity");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (dishId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.delete(`/api/orders/cart/items/${dishId}`);

      // Update local state
      const updatedCart = response.data;
      if (updatedCart && updatedCart.items) {
        setCartItems(updatedCart.items);
        updateCartMetrics(updatedCart.items);
        localStorage.setItem("cartData", JSON.stringify(updatedCart));
      }

      return updatedCart;
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Failed to remove item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // New function for updating notes
  const updateItemNotes = async (dishId, notes) => {
    try {
      // Always store locally as a backup
      localStorage.setItem(`note-${dishId}`, notes);

      // Check if the item exists in the cart
      const existingItem = cartItems.find((item) => item.dishId === dishId);
      if (!existingItem) {
        console.warn(`Item with ID ${dishId} not found in cart`);
        throw new Error("Item not found in cart");
      }

      // Call API to update notes - USE THE API INSTANCE!
      const response = await API.put(`/api/orders/cart/items/${dishId}/notes`, {
        notes,
      });

      // Update local state
      const updatedItems = cartItems.map((item) =>
        item.dishId === dishId ? { ...item, notes } : item
      );
      setCartItems(updatedItems);

      // Update localStorage backup
      const cartData = {
        items: updatedItems,
        totalAmount: updatedItems.reduce(
          (total, item) => total + parseFloat(item.price) * item.quantity,
          0
        ),
      };
      localStorage.setItem("cartData", JSON.stringify(cartData));

      return response.data;
    } catch (error) {
      console.error("Error updating item notes:", error);
      // Error was already thrown about missing item or API error
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
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
        updateItemNotes, // Add the new function
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
