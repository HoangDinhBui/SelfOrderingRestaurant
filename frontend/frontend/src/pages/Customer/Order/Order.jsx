import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const Order = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState(1); // Default table ID
  const [processingOrder, setProcessingOrder] = useState(false);
  const {
    cartItems,
    setCartItems,
    fetchCartData,
    updateItemQuantity,
    removeItem,
  } = useContext(CartContext);

  // Base API URL to ensure consistency
  const API_BASE_URL = "http://localhost:8080";

  // Function to get image URL using the new API endpoint
  const getImageUrl = (imageName) => {
    if (!imageName) return "/src/assets/img/placeholder.jpg";
    return `${API_BASE_URL}/api/images/${imageName}`;
  };

  // Fetch cart items with better error handling and localStorage fallback
  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);

      // Try to load from localStorage first as a fallback
      const cachedCartData = localStorage.getItem("cartData");
      let localItems = [];

      if (cachedCartData) {
        try {
          const parsedData = JSON.parse(cachedCartData);
          if (parsedData && Array.isArray(parsedData.items)) {
            localItems = parsedData.items;
            // Use cached data immediately to avoid empty state flash
            setCartItems(localItems);
          }
        } catch (e) {
          console.error("Error parsing cached cart data", e);
        }
      }

      // Then fetch fresh data from the server
      const response = await axios.get(`${API_BASE_URL}/api/orders/cart`);

      if (response.data && Array.isArray(response.data.items)) {
        setCartItems(response.data.items);
        // Update localStorage with fresh data
        localStorage.setItem("cartData", JSON.stringify(response.data));
      } else if (localItems.length > 0) {
        // Keep using localStorage data if API returns empty
        console.log("API returned no items, using cached data");
      } else {
        // Set empty cart items array
        setCartItems([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching cart items:", err);
      setError("Failed to load cart items. Please try again.");

      // If API call fails but we have localStorage data, use that
      const cachedCartData = localStorage.getItem("cartData");
      if (cachedCartData) {
        try {
          const parsedData = JSON.parse(cachedCartData);
          if (parsedData && Array.isArray(parsedData.items)) {
            setCartItems(parsedData.items);
            setError(null); // Clear error since we have fallback data
          }
        } catch (e) {
          console.error("Error parsing cached cart data", e);
        }
      }

      setLoading(false);
    }
  }, [setCartItems]);

  // On component mount, fetch the cart items ONCE
  useEffect(() => {
    fetchCartItems();

    // Set up an interval to refresh cart data every 30 seconds
    // This is more efficient than constant refreshing
    const intervalId = setInterval(() => {
      fetchCartItems();
    }, 30000);

    // Cleanup the interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchCartItems]); // Remove cartItems from dependency array

  // Debug - Log cart items when they change, but don't trigger API calls
  useEffect(() => {
    console.log("Current cart items:", cartItems);
  }, [cartItems]);

  // Call fetchCartData when component mounts
  useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);

  // Update quantity via API with proper error handling
  const updateQuantity = async (id, delta) => {
    const item = cartItems.find((item) => item.dishId === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);

    try {
      if (newQuantity === 0) {
        await removeItem(id);
      } else {
        await updateItemQuantity(id, newQuantity);
      }
      // The context functions already update the state and localStorage
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Failed to update quantity. Please try again.");
    }
  };

  // Create order via API and process payment
  const createOrder = async () => {
    try {
      setProcessingOrder(true);

      const orderData = {
        tableId: tableId,
        customerName: "Guest",
        items: cartItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          notes: item.notes || "",
        })),
        notes: "",
      };

      // Create the order first
      const orderResponse = await axios.post(
        `${API_BASE_URL}/api/orders`,
        orderData
      );

      // Get the orderId from the response
      let orderId;
      if (orderResponse.data && orderResponse.data.orderId) {
        orderId = orderResponse.data.orderId;
      } else {
        console.error("Order created but no orderId returned");
        throw new Error("Could not get orderId from response");
      }

      // Process the payment with default "CASH" method
      await axios.post(`${API_BASE_URL}/api/payment/process`, {
        orderId: orderId,
        paymentMethod: "CASH", // Default to cash payment
      });

      setShowModal(false);
      setShowConfirmation(true);

      // Clear local cart after order is created
      setCartItems([]);
      localStorage.removeItem("cartData");

      // After a few seconds, navigate to payment page
      setTimeout(() => {
        setShowConfirmation(false);
        navigate(`/payment?orderId=${orderId}`);
      }, 3000);
    } catch (err) {
      console.error("Error in order/payment flow:", err);
      setError("Failed to process your order. Please try again.");
      setShowModal(false);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Debug information - Fixed NODE_ENV check */}
      {typeof window !== "undefined" && window.ENV_DEBUG && (
        <div className="w-full bg-yellow-100 p-2 text-xs text-center">
          Debug: Cart has {cartItems.length} items
        </div>
      )}

      {/* Input Search */}
      <div className="container mx-auto p-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Menu and Home buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center font-bold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Menu
          </button>

          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center font-bold"
          >
            Home
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 ml-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 7l10 10M7 17L17 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected dishes list - Only show if there are items */}
      {cartItems && cartItems.length > 0 && (
        <div className="container mx-auto px-4 mb-4">
          <h3 className="text-lg font-bold mb-2">Your Selections</h3>
          <div className="flex space-x-6 overflow-x-auto pb-2">
            {cartItems.map((item) => (
              <div
                key={item.dishId}
                className="flex flex-col items-center min-w-[120px]"
              >
                <img
                  src={getImageUrl(item.dishImage)}
                  alt={item.dishName}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/src/assets/img/placeholder.jpg";
                  }}
                />
                <p className="text-sm text-center mt-2 font-medium">
                  {item.dishName}
                </p>
                <p className="text-xs text-center text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bill */}
      <div className="container mx-auto p-4 flex flex-col items-center">
        <div className="flex items-center w-full max-w-2xl mb-4">
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 mr-2"
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
          <h2 className="text-xl font-bold">Bill</h2>
        </div>

        {error && (
          <div className="w-full max-w-2xl mb-4 bg-red-100 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              className="mt-2 bg-red-500 text-white py-1 px-3 rounded"
              onClick={() => {
                setError(null);
                fetchCartItems();
              }}
            >
              Try Again
            </button>
          </div>
        )}

        <div className="space-y-4 w-full max-w-2xl">
          {!cartItems || cartItems.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">Your cart is empty</p>
              <button
                onClick={() => navigate("/menu")}
                className="mt-4 !bg-red-500 text-white py-2 px-6 rounded-lg"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.dishId}
                className="bg-white p-4 rounded-lg shadow-sm flex items-start"
              >
                <img
                  src={getImageUrl(item.dishImage || item.image)}
                  alt={item.dishName || item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/src/assets/img/placeholder.jpg";
                  }}
                />

                <div className="flex-1 ml-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-left">
                        {item.dishName}
                      </h3>
                      <p className="text-gray-500 text-lg text-left">
                        {parseFloat(item.price).toLocaleString()} VND
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.dishId)}
                      className="bg-gray-200 text-red-500 hover:text-red-700 p-2 rounded-full"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.dishId, -1)}
                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dishId, 1)}
                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/note/${item.dishId}`, {
                          state: { name: item.dishName },
                        })
                      }
                      className="!bg-rose-400 text-white px-4 py-1 rounded-md hover:bg-rose-500 transition duration-300"
                    >
                      Note
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total price and Order button */}
        {cartItems && cartItems.length > 0 && (
          <div className="mt-6 flex justify-between items-center w-full max-w-2xl">
            <button
              onClick={() => setShowModal(true)}
              className="!bg-red-400 text-white px-6 py-2 rounded-lg flex items-center hover:bg-red-500 transition-colors duration-300"
            >
              {processingOrder ? "Processing..." : "Order"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>

            <div className="border border-gray-300 rounded-lg px-4 py-2 bg-white flex items-center">
              <p className="text-lg font-bold">
                {totalPrice.toLocaleString()} VND
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            <button
              onClick={() => setShowModal(false)}
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

            <img
              src={`${API_BASE_URL}/api/images/logo.jpg`}
              alt="Restaurant Logo"
              className="mx-auto mb-4 w-24 h-24 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            <p className="text-center text-gray-700 mb-6">
              ARE YOU SURE YOU WANT TO ORDER THESE DISHES?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={createOrder}
                className="!bg-green-400 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors duration-300"
              >
                {processingOrder ? "Processing..." : "Yes"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-lg transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center border border-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">Order Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your order has been placed successfully. You will be redirected to
              the payment page.
            </p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
