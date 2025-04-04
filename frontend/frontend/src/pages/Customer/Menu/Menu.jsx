import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { MenuContext } from "../../../context/MenuContext";

import axios from "axios";

const Menu = () => {
  const { getDishById } = useContext(MenuContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuItems, setMenuItems] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [categories, setCategories] = useState([
    { id: 0, name: "All", icon: "🍽️" },
    { id: 1, name: "Appetizers", icon: "🍴" },
    { id: 2, name: "Main Course", icon: "🍽️" },
    { id: 3, name: "Vegetarian", icon: "🥗" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/dishes")
      .then((response) => {
        console.log(
          "API Categories:",
          response.data.map((item) => item.categoryName)
        );
        setMenuItems(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading menu:", error);
        setError("Failed to load menu. Please try again!");
        setLoading(false);
      });
  }, []);

  // Function to handle the View button click
  const handleViewDish = async (dishId) => {
    try {
      // First, show loading state
      setLoading(true);

      // Make API call to get dish details
      // Use context's getDishById instead of direct axios call
      const dishData = await getDishById(dishId);

      // Store dish details in localStorage
      localStorage.setItem("currentDish", JSON.stringify(dishData));

      // Navigate to dish details page
      navigate(`/view/${dishId}`);
    } catch (error) {
      console.error(`Error fetching dish ${dishId}:`, error);
      setError("Failed to load dish details. Please try again!");
      setLoading(false);
    }
  };

  // Filter dishes based on search term and selected category
  const filteredItems = menuItems.filter((item) => {
    // Handle potential null or undefined values for dishName
    const itemName = item.dishName || item.name || "";
    const matchesSearch = itemName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Use categoryName from the API response instead of the hardcoded categoryMap
    const matchesCategory =
      selectedCategory === "All" ||
      (item.categoryName &&
        item.categoryName.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  if (loading)
    return <p className="text-center text-gray-500">Loading menu...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex items-center px-4">
          <button
            onClick={() => navigate("/")}
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
          <div className="flex-1 text-center">
            <div className="text-lg font-bold">Menu</div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 bg-gray-100">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search in menu"
            className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Selection */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center mb-4">
            <span className="text-yellow-500 text-xl mr-2">⭐</span>
            <h3 className="font-bold text-lg">Select Category</h3>
          </div>

          {/* Category buttons */}
          <div className="grid grid-cols-4 gap-2">
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
                className="flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200"
              >
                <span className="text-2xl mb-1">{category.icon}</span>
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.dishId}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={item.imageUrl || "/placeholder-dish.jpg"}
                      alt={item.dishName || item.name || "Dish"}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-dish.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-bold text-lg">
                      {item.dishName || item.name}
                    </h3>
                    <div className="text-gray-500 text-sm mt-1">
                      ⭐ {item.categoryName}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div
                        className="font-semibold text-lg p-2 px-4 rounded-lg bg-gray-100 text-gray-800"
                        style={{
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {Number(item.price).toLocaleString()} VND
                      </div>
                      <button
                        onClick={() => handleViewDish(item.dishId)}
                        style={{
                          backgroundColor: "#f87171",
                          color: "white",
                          padding: "0.5rem 1.5rem",
                          borderRadius: "0.5rem",
                          transition: "background-color 200ms",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#ef4444")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f87171")
                        }
                        className="flex items-center"
                      >
                        View
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No dishes match your search or filter criteria.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
