import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";

const Menu = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const [orderFeedback, setOrderFeedback] = useState({
    show: false,
    message: "",
    type: "",
  });
  const { addToCartGraphQL, updateCartWithGraphQLData, fetchCartData } =
    useContext(CartContext);

  // Retrieve tableNumber from query params or localStorage
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const tableNumberFromUrl = queryParams.get("tableNumber");
  const savedTableNumber = localStorage.getItem("tableNumber");
  const tableNumber = tableNumberFromUrl || savedTableNumber || "1";

  const categories = [
    { id: 0, name: "All", icon: "🍽️" },
    { id: 1, name: "Main Course", icon: "🍽️" },
    { id: 2, name: "Appetizers", icon: "🍴" },
    { id: 3, name: "Drink", icon: "🍹" },
    { id: 4, name: "Dessert", icon: "🍰" },
  ];

  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState({});
  const [loadingDish, setLoadingDish] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [dishIngredients, setDishIngredients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch dishes
        const dishesResponse = await fetch("http://localhost:8080/api/dishes");
        if (!dishesResponse.ok) {
          throw new Error(`HTTP error! Status: ${dishesResponse.status}`);
        }
        const dishesData = await dishesResponse.json();

        // Fetch available inventory
        const inventoryResponse = await fetch(
          "http://localhost:8080/api/inventory/available"
        );
        if (!inventoryResponse.ok) {
          throw new Error(`HTTP error! Status: ${inventoryResponse.status}`);
        }
        const inventoryData = await inventoryResponse.json();

        // Fetch dish-ingredients
        const dishIngredientsResponse = await fetch(
          "http://localhost:8080/api/dish_ingredients"
        );
        if (!dishIngredientsResponse.ok) {
          throw new Error(
            `HTTP error! Status: ${dishIngredientsResponse.status}`
          );
        }
        const dishIngredientsData = await dishIngredientsResponse.json();

        // Initialize quantities and notes
        const initialQuantities = dishesData.reduce((acc, dish) => {
          acc[dish.dishId] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);

        const initialNotes = dishesData.reduce((acc, dish) => {
          acc[dish.dishId] = "";
          return acc;
        }, {});
        setNotes(initialNotes);

        // Set state
        setDishes(dishesData);
        setInventory(inventoryData);
        setDishIngredients(dishIngredientsData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load dish list or inventory data");
        setLoading(false);
        console.error("Error loading data:", err);
      }
    };

    fetchData();
    fetchCartData();

    // Synchronize tableNumber
    if (
      tableNumberFromUrl &&
      !isNaN(tableNumberFromUrl) &&
      parseInt(tableNumberFromUrl) > 0
    ) {
      localStorage.setItem("tableNumber", tableNumberFromUrl);
    } else if (
      !savedTableNumber ||
      isNaN(savedTableNumber) ||
      parseInt(savedTableNumber) <= 0
    ) {
      localStorage.setItem("tableNumber", "1");
    }

    console.log("Menu - tableNumberFromUrl:", tableNumberFromUrl);
    console.log("Menu - savedTableNumber:", savedTableNumber);
    console.log("Menu - tableNumber:", tableNumber);
  }, [fetchCartData, tableNumberFromUrl]);

  // Function to check if a dish has sufficient ingredients
  const hasSufficientIngredients = (dishId) => {
    // Retrieve the list of ingredients required for the dish
    const requiredIngredients = dishIngredients.filter(
      (di) => di.dishId === dishId
    );

    // If no ingredients are found, return false
    if (requiredIngredients.length === 0) {
      return false; // Dish has no ingredient information, do not display
    }

    // Check each ingredient
    for (const req of requiredIngredients) {
      const inventoryItem = inventory.find(
        (inv) => inv.ingredientId === req.ingredientId
      );
      if (!inventoryItem || inventoryItem.remainingQuantity < req.quantity) {
        return false; // Insufficient ingredients or ingredient does not exist
      }
    }
    return true; // Sufficient ingredients
  };

  // Filter dishes based on search, category, and ingredients
  const filteredItems = dishes.filter((item) => {
    const itemName = item.dishName || "";
    const matchesSearch = itemName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      (item.categoryName &&
        item.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    const hasIngredients = hasSufficientIngredients(item.dishId);
    return matchesSearch && matchesCategory && hasIngredients;
  });

  const handleIncreaseQuantity = (dishId) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: prev[dishId] + 1,
    }));
  };

  const handleDecreaseQuantity = (dishId) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: prev[dishId] > 1 ? prev[dishId] - 1 : 1,
    }));
  };

  const handleViewDish = (dishId) => {
    console.log(`Viewing dish with ID: ${dishId}`);
    navigate(`/viewitem/${dishId}`);
  };

  const handleOrderDish = async (dishId) => {
    try {
      setLoadingDish(dishId);

      const currentDish = dishes.find((d) => d.dishId === dishId);
      if (!currentDish) {
        throw new Error("Dish not found");
      }

      const itemToAdd = {
        dishId: dishId,
        quantity: quantities[dishId],
        notes: notes[dishId] || "",
        dishName: currentDish.dishName,
        price: currentDish.price,
      };

      let result;

      if (typeof addToCartGraphQL === "function") {
        console.log("Using CartContext.addToCartGraphQL");
        result = await addToCartGraphQL(itemToAdd);
      } else {
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
          credentials: "include",
          body: JSON.stringify(graphqlQuery),
        });

        const responseData = await response.json();

        if (responseData.errors) {
          throw new Error(
            responseData.errors[0].message || "Error adding dish to cart"
          );
        }

        result = responseData.data.addDishToOrderCart;

        if (typeof updateCartWithGraphQLData === "function") {
          updateCartWithGraphQLData(result);
        }

        localStorage.setItem("cartData", JSON.stringify(result));
      }

      console.log("Added to cart:", result);

      setOrderFeedback({
        show: true,
        message: `Added ${quantities[dishId]} x ${currentDish.dishName} to cart`,
        type: "success",
      });

      setTimeout(() => {
        setOrderFeedback({ show: false, message: "", type: "" });
      }, 3000);

      return result;
    } catch (error) {
      console.error("Error adding dish to cart:", error);

      setOrderFeedback({
        show: true,
        message: `Failed to add to cart: ${error.message}`,
        type: "error",
      });

      setTimeout(() => {
        setOrderFeedback({ show: false, message: "", type: "" });
      }, 3000);

      throw error;
    } finally {
      setLoadingDish(null);
    }
  };

  const handleNote = (dishId) => {
    const currentNote = notes[dishId] || "";
    const newNote = prompt("Add note for the dish:", currentNote);

    if (newNote !== null) {
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
      <div className="bg-white py-2 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center px-3">
          <button
            onClick={() => navigate(`/table/${tableNumber}`)}
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

      <div className="max-w-md mx-auto px-3 py-3 bg-gray-100">
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

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                  console.log("Selected category:", category.name);
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

        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.dishId}
                className="bg-white rounded-lg shadow-sm p-3"
              >
                <div className="flex w-full mb-2">
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

                  <div className="flex-1 ml-3">
                    <h3 className="font-bold text-sm">{item.dishName}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>5.0</span>
                      <span className="mx-1.5">•</span>
                      <span>{item.categoryName}</span>
                    </div>
                    <div className="font-semibold text-sm mt-0.5">
                      {Number(item.price).toLocaleString("en-US")} VNĐ
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                {notes[item.dishId] && (
                  <div className="text-xs text-gray-500 mb-1 px-2 py-1 bg-gray-50 rounded">
                    <span className="font-medium">Note:</span>{" "}
                    {notes[item.dishId]}
                  </div>
                )}

                <div className="flex justify-between items-center mt-2">
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
              No dishes match the search criteria or category.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
