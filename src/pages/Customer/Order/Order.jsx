import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const Order = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState(
    state?.tableNumber || localStorage.getItem("tableNumber") || "1"
  );
  const [processingOrder, setProcessingOrder] = useState(false);

  const {
    cartItems,
    setCartItems,
    fetchCartData,
    updateItemQuantity,
    removeItem,
    updateItemNotes,
  } = useContext(CartContext);

  const API_BASE_URL = "http://localhost:8080";

  const getImageUrl = (imageName) => {
    if (!imageName) return "/src/assets/img/placeholder.jpg";
    return `${API_BASE_URL}/api/images/${imageName}`;
  };

  // Sync tableId with localStorage and navigation state
  useEffect(() => {
    const savedTableNumber = localStorage.getItem("tableNumber");
    const newTableNumber = state?.tableNumber || savedTableNumber || "1";

    if (newTableNumber !== tableId) {
      if (!isNaN(newTableNumber) && parseInt(newTableNumber) > 0) {
        setTableId(newTableNumber);
        localStorage.setItem("tableNumber", newTableNumber);
        console.log("Updated tableId:", newTableNumber);
      } else {
        // Invalid table number, set default
        localStorage.setItem("tableNumber", "1");
        setTableId("1");
        navigate("/table/1", { replace: true });
      }
    }
  }, [state?.tableNumber, tableId, navigate]);

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching cart items...");

      const cachedCartData = localStorage.getItem("cartData");
      let localItems = [];

      if (cachedCartData) {
        try {
          const parsedData = JSON.parse(cachedCartData);
          if (parsedData && Array.isArray(parsedData.items)) {
            localItems = parsedData.items;
            setCartItems(localItems);
            console.log("Using cached cart data initially", localItems);
          }
        } catch (e) {
          console.error("Error parsing cached cart data", e);
        }
      }

      try {
        const graphqlQuery = {
          query: `
            query GetOrderCart {
              orderCart {
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
          `,
        };

        const graphqlResponse = await fetch(`${API_BASE_URL}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(graphqlQuery),
        });

        const result = await graphqlResponse.json();

        if (!result.errors && result.data && result.data.orderCart) {
          console.log(
            "Successfully fetched cart via GraphQL",
            result.data.orderCart
          );
          setCartItems(result.data.orderCart.items);
          localStorage.setItem(
            "cartData",
            JSON.stringify(result.data.orderCart)
          );
        } else if (localItems.length > 0) {
          console.log("API returned no items, using cached data");
        } else {
          setCartItems([]);
        }
      } catch (graphqlError) {
        console.error("GraphQL cart fetch failed:", graphqlError);
        if (localItems.length > 0) {
          console.log("Using cached data as fallback after API failures");
        } else {
          setError("Failed to load cart items. Please try again.");
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error in fetchCartItems:", err);
      setError("Failed to load cart items. Please try again.");
      setLoading(false);
    }
  }, [setCartItems]);

  useEffect(() => {
    console.log("Order component mounted, fetching cart items");
    console.log("Initial tableId:", tableId);
    fetchCartItems();

    const intervalId = setInterval(() => {
      fetchCartItems();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchCartItems]);

  useEffect(() => {
    console.log("Calling fetchCartData from context");
    fetchCartData();
  }, [fetchCartData]);

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
    } catch (err) {
      setError("Failed to update quantity. Please try again.");
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );

  const createOrder = async () => {
    try {
      setProcessingOrder(true);

      const items = cartItems.map((item) => ({
        dishId: item.dishId.toString(),
        quantity: item.quantity,
        notes: item.notes || "",
      }));

      const orderMutation = {
        query: `
          mutation CreateOrder($input: OrderInput!) {
            createOrder(input: $input)
          }
        `,
        variables: {
          input: {
            tableId: tableId.toString(),
            customerName: "Guest",
            items: items,
            notes: "",
          },
        },
      };

      console.log("Creating order with tableId:", tableId);
      console.log("Full mutation:", JSON.stringify(orderMutation, null, 2));

      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderMutation),
      });

      const result = await response.json();
      console.log("GraphQL response:", result);

      if (result.errors) {
        throw new Error(result.errors[0].message || "Error creating order");
      }

      const orderId = result.data.createOrder;

      if (orderId) {
        const paymentInfo = {
          orderId: orderId,
          amount: totalPrice,
          customerId: 1,
          createdAt: new Date().toISOString(),
          isPaid: false,
        };
        localStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));
        sessionStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));

        try {
          const notificationData = {
            tableNumber: Number(tableId),
            customerId: 1,
            orderId: Number(orderId),
            type: "NEW_ORDER",
            additionalMessage: `New order placed for Table ${tableId}`,
          };

          console.log("Sending notification data:", notificationData);

          await axios.post(
            `${API_BASE_URL}/api/notifications`,
            notificationData
          );
          console.log("Order notification sent successfully");
        } catch (notificationError) {
          console.error(
            "Failed to send order notification:",
            notificationError
          );
        }

        setShowModal(false);
        setShowConfirmation(true);

        setCartItems([]);
        localStorage.removeItem("cartData");

        setTimeout(() => {
          setShowConfirmation(false);
          navigate(`/table/${tableId}`);
        }, 3000);
      } else {
        console.error("Order created but no orderId returned");
        throw new Error("Could not get orderId from response");
      }
    } catch (err) {
      console.error("Error in order/payment flow:", err);
      setError(`Failed to process your order: ${err.message}`);
      setShowModal(false);
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-110 bg-gray-100 flex flex-col items-center">
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
            onClick={() => navigate("/menu_cus")}
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
            onClick={() => navigate(`/table/${tableId}`)}
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

      {/* Selected Staff list - Only show if there are items */}
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
            onClick={() => navigate("/menu_cus")}
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
                onClick={() => navigate("/menu_cus")}
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
                        {item.notes && item.notes.trim() !== "" && (
                          <span
                            className="ml-2 text-rose-500"
                            title="Has notes"
                          >
                            📝
                          </span>
                        )}
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
                        navigate(`/note_cus/${item.dishId}`, {
                          state: { name: item.dishName },
                        })
                      }
                      className="!bg-rose-400 text-white px-4 py-1 rounded-md hover:bg-rose-500 transition duration-300"
                    >
                      Note
                    </button>
                  </div>
                  {/* Display item notes when they exist */}
                  {item.notes && item.notes.trim() !== "" && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      <span className="font-medium">Notes:</span> {item.notes}
                    </div>
                  )}
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
              ARE YOU SURE YOU WANT TO ORDER THESE ITEMS?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={createOrder}
                className="!bg-green-400 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors duration-300"
                disabled={processingOrder}
              >
                {processingOrder ? "Processing..." : "Yes"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-lg transition"
                disabled={processingOrder}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
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
              the home page.
            </p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
