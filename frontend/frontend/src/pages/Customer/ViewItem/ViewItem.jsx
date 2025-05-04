import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { MenuContext } from "../../../context/MenuContext";
import { CartContext } from "../../../context/CartContext";

const ViewItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDishById, error: contextError } = useContext(MenuContext);
  const {
    addToCart,
    addToCartGraphQL,
    updateCartWithGraphQLData,
    loading: cartLoading,
    error: cartError,
  } = useContext(CartContext);

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Clear cart error when component unmounts or when id changes
  useEffect(() => {
    return () => setError(null);
  }, [id]);

  useEffect(() => {
    // If there's a cart error, show it in this component
    if (cartError) {
      setError(cartError);
    }
  }, [cartError]);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        // Clear any previous errors
        setError(null);
        setLoading(true);

        // Try to get the dish from localStorage first
        const cachedDishStr = localStorage.getItem("currentDish");
        if (cachedDishStr) {
          try {
            const parsedDish = JSON.parse(cachedDishStr);
            // Check if the cached dish matches the requested ID
            if (
              parsedDish.dishId === parseInt(id) ||
              parsedDish.id === parseInt(id)
            ) {
              setItem(parsedDish);
              setLoading(false);
              console.log("Using cached dish data:", parsedDish);
              return;
            }
          } catch (parseErr) {
            console.error("Error parsing cached dish:", parseErr);
            // Continue to API call if parse fails
          }
        }

        // If not in cache or not matching the current ID, fetch from API
        console.log("Fetching dish data from API for dish ID:", id);
        const dishData = await getDishById(id);
        console.log("API dish data received:", dishData);

        setItem(dishData);
        // Save to localStorage for future use
        localStorage.setItem("currentDish", JSON.stringify(dishData));
      } catch (err) {
        console.error("Error fetching dish details:", err);
        setError(
          err.message || "Failed to load dish details. Please try again!"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDish();
  }, [id, getDishById]);

  // Handle quantity changes
  const handleQuantityChange = (change) => {
    setQuantity((prev) => {
      const newQuantity = Math.max(1, prev + change);
      // Optional: Check against available stock
      if (item && item.stock && newQuantity > item.stock) {
        setError(`Sorry, only ${item.stock} items available in stock.`);
        return prev;
      }
      setError(null);
      return newQuantity;
    });
  };

  // Handle adding to cart
  const handleAddToCart = async () => {
    if (orderLoading) return; // Prevent multiple clicks

    try {
      setOrderLoading(true);
      setError(null);

      console.log(`Adding dish ID: ${id} to cart with quantity: ${quantity}`);

      const itemToAdd = {
        dishId: parseInt(id),
        quantity: quantity,
        notes: "",
      };

      let result;

      // First try using the GraphQL method from CartContext
      if (typeof addToCartGraphQL === "function") {
        console.log("Using CartContext.addToCartGraphQL");
        result = await addToCartGraphQL(itemToAdd);
      }
      // Fallback to standard addToCart method which may try REST first
      else {
        console.log("Using standard addToCart method");
        result = await addToCart(itemToAdd);
      }

      console.log("Item added successfully:", result);

      // Show success message
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
      let errorMessage = "Failed to add item to cart. Please try again.";

      // Extract more specific error message if available
      if (err.response && err.response.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-center text-gray-500">Loading dish details...</p>
      </div>
    );

  if (error || contextError)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-center text-red-500 p-4">{error || contextError}</p>
      </div>
    );

  if (!item)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-center text-red-500">Dish not found</p>
      </div>
    );

  // Extract dish details with fallbacks
  const name = item.dishName || item.name || "Unnamed Dish";
  const price = item.price || 0;
  const category = item.categoryName || item.category || "Uncategorized";
  const imageUrl = item.imageUrl || item.image || "/placeholder-dish.jpg";
  const rating = item.rating || 4.5;
  const sold = item.sold || 0;
  const stock = item.stock || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10 flex items-center px-4">
        <button
          onClick={() => navigate("/menu_cus")}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
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
        <h2 className="text-lg font-bold flex-1 text-center">View</h2>
      </div>

      {/* Dish details content */}
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        {/* Dish image */}
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-64 object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-dish.jpg";
          }}
        />

        {/* Name and price */}
        <div className="flex justify-between items-center mt-4">
          <h3 className="font-bold text-xl">{name}</h3>
          <p className="text-gray-500 text-lg">
            {Number(price).toLocaleString()} VND
          </p>
        </div>

        {/* Sales count and inventory status */}
        <div className="flex justify-between items-center mt-2">
          <div className="mt-2">
            {/* Items sold and in stock */}
            <div className="flex items-center space-x-2"></div>

            {/* Rating and category */}
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-yellow-500 text-lg">⭐</span>
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-sm text-gray-600">• {category}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/note/${id}`, { state: { name: name } })}
            className="!bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Note
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-4">
          {item.description || "No description available."}
        </p>

        {/* Quantity, total price and Order button */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={orderLoading}
              className="bg-gray-400 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              -
            </button>
            <span className="text-lg">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={orderLoading}
              className="bg-gray-400 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <p className="font-bold text-lg">
            {(Number(price) * quantity).toLocaleString()} VND
          </p>
          <button
            onClick={handleAddToCart}
            disabled={orderLoading}
            className={`${
              orderLoading
                ? "!bg-gray-400"
                : orderSuccess
                ? "!bg-green-500"
                : "!bg-red-400"
            } text-white py-2 px-6 rounded-lg flex items-center disabled:opacity-50`}
          >
            {orderLoading ? "Adding..." : orderSuccess ? "Added!" : "Order"}
            {!orderLoading && !orderSuccess && (
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
            )}
          </button>
        </div>

        {/* Display error message if any */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewItem;
