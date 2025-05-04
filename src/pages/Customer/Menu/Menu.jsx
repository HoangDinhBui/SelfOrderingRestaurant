import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/CartContext"; // Adjust path as needed

const Menu = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  // Add orderFeedback state for showing messages to user
  const [orderFeedback, setOrderFeedback] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Get cart context - THIS IS THE KEY ADDITION
  const { addToCartGraphQL, updateCartWithGraphQLData, fetchCartData } =
    useContext(CartContext);

  // Categories with icons
  const categories = [
    { id: 0, name: "All", icon: "🍽️" },
    { id: 1, name: "Main Course", icon: "🍽️" },
    { id: 2, name: "Appetizers", icon: "🍴" },
    { id: 3, name: "Drink", icon: "🍹" },
    { id: 4, name: "Dessert", icon: "🍰" },
  ];

  // State to manage quantity for each dish
  const [quantities, setQuantities] = useState({});
  // State to manage notes for each dish
  const [notes, setNotes] = useState({});

  const [loadingDish, setLoadingDish] = useState(null);

  // Fetch all dishes from the API
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8080/api/dishes");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setDishes(data);

        // Initialize quantities state with all dishes
        const initialQuantities = data.reduce((acc, dish) => {
          acc[dish.dishId] = 1; // Default quantity is 1 for each dish
          return acc;
        }, {});
        setQuantities(initialQuantities);

        // Initialize notes state with all dishes
        const initialNotes = data.reduce((acc, dish) => {
          acc[dish.dishId] = ""; // Default empty note for each dish
          return acc;
        }, {});
        setNotes(initialNotes);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch menu items");
        setLoading(false);
        console.error("Error fetching dishes:", err);
      }
    };

    fetchDishes();
    fetchCartData();
  }, [fetchCartData]); // Fixed: Don't call fetchCartData in the dependency array

  // Filter items based on search term and selected category
  const filteredItems = dishes.filter((item) => {
    const itemName = item.dishName || "";
    const matchesSearch = itemName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      (item.categoryName &&
        item.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Handlers for quantity adjustments
  const handleIncreaseQuantity = (dishId) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: prev[dishId] + 1,
    }));
  };

  const handleDecreaseQuantity = (dishId) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: prev[dishId] > 1 ? prev[dishId] - 1 : 1, // Minimum quantity is 1
    }));
  };

  const handleViewDish = (dishId) => {
    console.log(`View dish with ID: ${dishId}`);
    navigate(`/viewitem/${dishId}`); // đường dẫn đến ViewItem.jsx
  };

  // Updated order dish function to call GraphQL API
  const handleOrderDish = async (dishId) => {
    try {
      // Show loading state if needed
      // setLoadingDish(dishId);
      setLoadingDish(dishId); // Show loading state for this dish

      const currentDish = dishes.find((d) => d.dishId === dishId);
      if (!currentDish) {
        throw new Error("Dish not found");
      }

      const itemToAdd = {
        dishId: dishId,
        quantity: quantities[dishId],
        notes: notes[dishId] || "",
        dishName: currentDish.dishName, // Include name for better feedback
        price: currentDish.price, // Include price for cart calculations
      };

      let result;

      // First try using the Cart Context if available (best option)
      if (typeof addToCartGraphQL === "function") {
        console.log("Using CartContext.addToCartGraphQL");
        result = await addToCartGraphQL(itemToAdd);
      }
      // Fallback to direct GraphQL call
      else {
        console.log("Using direct GraphQL call");
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
              dishId: dishId.toString(),
              quantity: quantities[dishId],
              notes: notes[dishId] || "",
            },
          },
        };

        const response = await fetch("http://localhost:8080/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for session-based carts
          body: JSON.stringify(graphqlQuery),
        });

        const responseData = await response.json();

        if (responseData.errors) {
          throw new Error(
            responseData.errors[0].message || "Error adding dish to cart"
          );
        }

        result = responseData.data.addDishToOrderCart;

        // Update CartContext if possible
        if (typeof updateCartWithGraphQLData === "function") {
          updateCartWithGraphQLData(result);
        }

        // Also update localStorage as backup
        localStorage.setItem("cartData", JSON.stringify(result));
      }

      console.log("Added to cart:", result);

      // Show success feedback
      setOrderFeedback({
        show: true,
        message: `Added ${quantities[dishId]} x ${currentDish.dishName} to cart`,
        type: "success",
      });

      // Hide feedback after 3 seconds
      setTimeout(() => {
        setOrderFeedback({ show: false, message: "", type: "" });
      }, 3000);

      return result;
    } catch (error) {
      console.error("Error adding dish to cart:", error);

      // Show error feedback
      setOrderFeedback({
        show: true,
        message: `Failed to add to cart: ${error.message}`,
        type: "error",
      });

      // Hide feedback after 3 seconds
      setTimeout(() => {
        setOrderFeedback({ show: false, message: "", type: "" });
      }, 3000);

      throw error;
    } finally {
      setLoadingDish(null); // Clear loading state
    }
  };

  const handleNote = (dishId) => {
    // Get current note for this dish
    const currentNote = notes[dishId] || "";

    // Simple prompt for note (in a real app, you'd use a modal or better UI)
    const newNote = prompt("Add a note for this dish:", currentNote);

    if (newNote !== null) {
      // Only update if user didn't cancel
      setNotes((prev) => ({
        ...prev,
        [dishId]: newNote,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700">
            Loading menu...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <div className="text-lg font-medium text-red-600 mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Optimized for mobile */}
      <div className="bg-white py-2 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center px-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300"
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
          <div className="flex-1 text-center">
            <div className="text-base font-bold">Menu</div>
          </div>
          <button
            onClick={() => navigate("/order_cus")}
            className=" rounded-full bg-white-100 hover:bg-gray-300"
          >
            <img
              src="https://img.icons8.com/?size=100&id=59997&format=png&color=000000"
              alt="Cart Icon"
              className="w-5 h-5"
            />
          </button>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Content - Mobile optimized width */}
      <div className="max-w-md mx-auto px-3 py-3 bg-gray-100">
        {/* Feedback toast notification */}
        {orderFeedback.show && (
          <div
            className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
              orderFeedback.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {orderFeedback.message}
          </div>
        )}

        {/* Search Bar - Made slightly smaller for mobile */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search in menu"
            className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Selection - Optimized for mobile scrolling */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
          <div className="flex items-center mb-2">
            <span className="text-yellow-500 text-lg mr-2">⭐</span>
            <h3 className="font-bold text-base">Select Category</h3>
          </div>
          <div className="flex overflow-x-auto space-x-2 py-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  console.log("Selecting category:", category.name);
                  setSelectedCategory(category.name);
                }}
                style={{
                  backgroundColor:
                    selectedCategory === category.name ? "#f87171" : "#f9fafb",
                  color:
                    selectedCategory === category.name ? "white" : "#1f2937",
                }}
                className="min-w-[80px] flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 flex-shrink-0"
              >
                <span className="text-xl mb-1">{category.icon}</span>
                <span className="text-xs text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List - Optimized for mobile viewing */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.dishId}
                className="bg-white rounded-lg shadow-sm p-3"
              >
                {/* Dish Image and Details - Vertical layout on mobile */}
                <div className="flex w-full mb-2">
                  {/* Dish Image - Made smaller for mobile */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.dishName}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-dish.jpg";
                      }}
                    />
                  </div>

                  {/* Dish Details */}
                  <div className="flex-1 ml-3">
                    <h3 className="font-bold text-sm">{item.dishName}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>5.0</span>
                      <span className="mx-1.5">•</span>
                      <span>{item.categoryName}</span>
                    </div>
                    <div className="font-semibold text-sm mt-0.5">
                      {Number(item.price).toLocaleString("vi-VN")} VNĐ
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes indicator if there's a note */}
                {notes[item.dishId] && (
                  <div className="text-xs text-gray-500 mb-1 px-2 py-1 bg-gray-50 rounded">
                    <span className="font-medium">Note:</span>{" "}
                    {notes[item.dishId]}
                  </div>
                )}

                {/* Actions - Reorganized for better mobile layout */}
                <div className="flex justify-between items-center mt-2">
                  {/* Note button and Quantity Selector in one row */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleNote(item.dishId)}
                      className="text-[#1f2937] text-xs h-7 w-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                    >
                      Note
                    </button>
                    <div className="flex items-center bg-white bg-opacity-50 rounded-lg">
                      <button
                        onClick={() => handleDecreaseQuantity(item.dishId)}
                        className="w-7 h-7 flex items-center justify-center text-[#1f2937] rounded-l-lg"
                        style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                      >
                        -
                      </button>
                      <span className="w-6 h-7 flex items-center justify-center text-[#1f2937] text-xs bg-transparent">
                        {quantities[item.dishId] || 1}
                      </span>
                      <button
                        onClick={() => handleIncreaseQuantity(item.dishId)}
                        className="w-7 h-7 flex items-center justify-center text-[#1f2937] rounded-r-lg"
                        style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* View and Order buttons in one row */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDish(item.dishId)}
                      className="text-white text-xs w-16 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#EE6363" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOrderDish(item.dishId)}
                      className="text-white text-xs w-16 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#EE6363" }}
                    >
                      Order
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 ml-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-6 text-sm">
              No dishes match your search or filter criteria.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
