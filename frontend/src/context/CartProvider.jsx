import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { CartContext } from "./CartContext"; // Import from separate file

// Create a base API instance with consistent configuration
const API = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      localStorage.setItem("cartData", JSON.stringify(response.data));

      return response.data;
    } catch (err) {
      console.error("Error fetching cart:", err);

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

  useEffect(() => {
    fetchCartData();

    const intervalId = setInterval(() => {
      fetchCartData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchCartData]);

  const addToCart = useCallback(async (item) => {
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
  }, []);

  const updateItemQuantity = useCallback(async (dishId, quantity) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.put(
        `/api/orders/cart/items/${dishId}?quantity=${quantity}`
      );

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
  }, []);

  const removeItem = useCallback(async (dishId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.delete(`/api/orders/cart/items/${dishId}`);

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
  }, []);

  const updateItemNotes = useCallback(
    async (dishId, notes) => {
      try {
        localStorage.setItem(`note-${dishId}`, notes);

        const existingItem = cartItems.find((item) => item.dishId === dishId);
        if (!existingItem) {
          console.warn(`Item with ID ${dishId} not found in cart`);
          throw new Error("Item not found in cart");
        }

        const response = await API.put(
          `/api/orders/cart/items/${dishId}/notes`,
          {
            notes,
          }
        );

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
        localStorage.setItem("cartData", JSON.stringify(cartData));

        return response.data;
      } catch (error) {
        console.error("Error updating item notes:", error);
        throw error;
      }
    },
    [cartItems]
  );

  const contextValueRef = useRef(null);

  const updateCartWithGraphQLData = useCallback((graphQLCartData) => {
    if (!graphQLCartData || !graphQLCartData.items) {
      console.warn("Invalid GraphQL cart data received", graphQLCartData);
      return;
    }

    setCartItems(graphQLCartData.items);
    updateCartMetrics(graphQLCartData.items);

    localStorage.setItem("cartData", JSON.stringify(graphQLCartData));

    return graphQLCartData;
  }, []);

  const addToCartGraphQL = useCallback(
    async (item) => {
      try {
        setLoading(true);
        setError(null);

        const graphqlQuery = {
          query: `
            mutation AddDishToCart($input: OrderItemInput!) {
              addDishToOrderCart(input: $input) {
                items {
                  dishId
                  dishName
                  quantity
                  price
                  notes
                }
                totalAmount
              }
            }
          `,
          variables: {
            input: {
              dishId: item.dishId.toString(),
              quantity: item.quantity || 1,
              notes: item.notes || "",
            },
          },
        };

        const response = await fetch(`${API.defaults.baseURL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(graphqlQuery),
        });

        const result = await response.json();

        if (result.errors) {
          throw new Error(
            result.errors[0].message || "Error adding dish to cart"
          );
        }

        const updatedCart = result.data.addDishToOrderCart;
        updateCartWithGraphQLData(updatedCart);

        return updatedCart;
      } catch (err) {
        console.error("Error adding to cart using GraphQL:", err);
        setError("Failed to add item to cart");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateCartWithGraphQLData]
  );

  useEffect(() => {
    const contextValue = {
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
    };

    contextValueRef.current = contextValue;

    window.cartContextRef = contextValueRef;

    return () => {
      if (window.cartContextRef === contextValueRef) {
        delete window.cartContextRef;
      }
    };
  }, [
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
  ]);

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
        updateItemNotes,
        addToCartGraphQL,
        updateCartWithGraphQLData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
