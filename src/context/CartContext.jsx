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
  cartItems: [],
  setCartItems: () => {},
  cartItemCount: 0,
  totalAmount: 0,
  loading: false,
  error: null,
  fetchCartData: () => {},
  addToCart: () => {},
  updateItemQuantity: () => {},
  removeItem: () => {},
  updateItemNotes: () => {},
  addToCartGraphQL: () => {},
  updateCartWithGraphQLData: () => {},
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useGraphQL, setUseGraphQL] = useState(false);

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

  // Fetch cart data using REST API
  const fetchCartDataREST = useCallback(async () => {
    try {
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
  }, []);

  // Fetch cart data using GraphQL
  const fetchCartDataGraphQL = useCallback(async () => {
    try {
      const graphqlQuery = {
        query: `
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
        `,
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
        throw new Error(result.errors[0].message || "Error fetching cart data");
      }

      const cartData = result.data.orderCart;
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

  // Main fetch cart function that tries REST first, then GraphQL if REST fails
  const fetchCartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // If we previously encountered issues with REST, use GraphQL directly
      if (useGraphQL) {
        return await fetchCartDataGraphQL();
      }

      // Otherwise try REST first, then fall back to GraphQL
      try {
        return await fetchCartDataREST();
      } catch (restErr) {
        console.log("REST API failed, falling back to GraphQL");
        setUseGraphQL(true);
        return await fetchCartDataGraphQL();
      }
    } catch (err) {
      console.error("All cart fetch methods failed:", err);

      // Try to use cached data as last resort
      const cachedData = loadCartFromLocalStorage();
      if (cachedData) {
        setError("Using cached cart data. Network error occurred.");
        return cachedData;
      }

      setError("Failed to load cart data");
      return { items: [] };
    } finally {
      setLoading(false);
    }
  }, [fetchCartDataREST, fetchCartDataGraphQL, useGraphQL]);

  // Initialize cart and set up refresh interval
  useEffect(() => {
    fetchCartData();

    const intervalId = setInterval(() => {
      fetchCartData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchCartData]);

  // Add item to cart - uses REST API by default, falls back to GraphQL
  const addToCart = useCallback(async (item) => {
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
  }, []);

  // Update item quantity - uses REST API by default, falls back to GraphQL
  const updateItemQuantity = useCallback(
    async (dishId, quantity) => {
      try {
        setLoading(true);
        setError(null);

        // If we're in GraphQL mode
        if (useGraphQL) {
          const graphqlQuery = {
            query: `
            mutation UpdateItemQuantity($dishId: ID!, $quantity: Int!) {
              updateItemQuantity(dishId: $dishId, quantity: $quantity) {
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
              dishId: dishId.toString(),
              quantity: quantity,
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
              result.errors[0].message || "Error updating item quantity"
            );
          }

          const updatedCart = result.data.updateItemQuantity;
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);

          return updatedCart;
        } else {
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
        }
      } catch (err) {
        console.error("Error updating quantity:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for update quantity");
          setUseGraphQL(true);
          return await updateItemQuantity(dishId, quantity);
        }

        setError("Failed to update quantity");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [useGraphQL]
  );

  // Remove item from cart - uses REST API by default, falls back to GraphQL
  const removeItem = useCallback(
    async (dishId) => {
      try {
        setLoading(true);
        setError(null);

        // If we're in GraphQL mode
        if (useGraphQL) {
          const graphqlQuery = {
            query: `
            mutation RemoveItemFromCart($dishId: ID!) {
              removeItemFromCart(dishId: $dishId) {
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
              dishId: dishId.toString(),
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
              result.errors[0].message || "Error removing item from cart"
            );
          }

          const updatedCart = result.data.removeItemFromCart;
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);

          return updatedCart;
        } else {
          // REST API approach
          const response = await API.delete(`/api/orders/cart/items/${dishId}`);

          const updatedCart = response.data;
          if (updatedCart && updatedCart.items) {
            setCartItems(updatedCart.items);
            updateCartMetrics(updatedCart.items);
            saveCartToLocalStorage(updatedCart);
          }

          return updatedCart;
        }
      } catch (err) {
        console.error("Error removing item:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for remove item");
          setUseGraphQL(true);
          return await removeItem(dishId);
        }

        setError("Failed to remove item");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [useGraphQL]
  );

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
          const graphqlQuery = {
            query: `
            mutation UpdateItemNotes($dishId: ID!, $input: UpdateItemNotesInput!) {
              updateItemNotes(dishId: $dishId, input: $input) {
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
              dishId: dishId.toString(),
              input: {
                notes: notes,
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
              result.errors[0].message || "Error updating item notes"
            );
          }

          const updatedCart = result.data.updateItemNotes;
          setCartItems(updatedCart.items);
          updateCartMetrics(updatedCart.items);
          saveCartToLocalStorage(updatedCart);

          return updatedCart;
        } else {
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
        }
      } catch (err) {
        console.error("Error updating item notes:", err);

        // If REST fails and we weren't already using GraphQL, try GraphQL
        if (!useGraphQL) {
          console.log("Falling back to GraphQL for update notes");
          setUseGraphQL(true);
          return await updateItemNotes(dishId, notes);
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
    [cartItems, useGraphQL]
  );

  // Add to cart using GraphQL
  const addToCartGraphQL = useCallback(async (item) => {
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
  }, []);

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

  // Store context value in a ref to avoid unnecessary re-renders
  const contextValueRef = useRef(null);

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

    // Make context available globally for debugging
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
