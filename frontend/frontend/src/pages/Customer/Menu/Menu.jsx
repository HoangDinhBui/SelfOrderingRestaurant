import { useState } from "react";

// Static mock data to match the image
const mockMenuItems = [
  {
    dishId: 1,
    dishName: "Huitres Fraiches (6PCS)",
    categoryName: "Appetizers",
    price: 25.34,
    rating: 5.0,
    imageUrl: "/huitres-fraiches.jpg",
  },
  {
    dishId: 2,
    dishName: "Huitres Gratinées (6PCS)",
    categoryName: "Appetizers",
    price: 25.34,
    rating: 5.0,
    imageUrl: "/huitres-gratinees.jpg",
  },
  {
    dishId: 3,
    dishName: "Tartare De Saumon",
    categoryName: "Main Course",
    price: 25.34,
    rating: 5.0,
    imageUrl: "/tartare-de-saumon.jpg",
  },
];

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = [
    { id: 0, name: "All", icon: "🍽️" },
    { id: 1, name: "Main Course", icon: "🍽️" },
    { id: 2, name: "Appetizers", icon: "🍴" },
    { id: 3, name: "Drink", icon: "🍹" },
    { id: 4, name: "Dessert", icon: "🍰" },
  ];

  // State to manage quantity for each dish
  const [quantities, setQuantities] = useState(
    mockMenuItems.reduce((acc, item) => {
      acc[item.dishId] = 1; // Default quantity is 1 for each dish
      return acc;
    }, {})
  );

  // Filter items based on search term and selected category
  const filteredItems = mockMenuItems.filter((item) => {
    const itemName = item.dishName || item.name || "";
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

  // Static actions for buttons
  const handleViewDish = (dishId) => {
    console.log(`View dish with ID: ${dishId}`);
  };

  const handleOrderDish = (dishId) => {
    console.log(`Order dish with ID: ${dishId}`);
  };

  const handleNote = (dishId) => {
    console.log(`Add note for dish with ID: ${dishId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex items-center px-4">
          <button
            onClick={() => console.log("Navigate back to home")}
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
          <div className="flex overflow-x-auto space-x-2 py-2 px-1 scrollbar-hide">
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
                className="min-w-[90px] flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 flex-shrink-0"
              >
                <span className="text-2xl mb-1">{category.icon}</span>
                <span className="text-sm text-center">{category.name}</span>
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
                className="bg-white rounded-lg shadow-sm p-4 flex items-center"
              >
                {/* Dish Image */}
                <div className="w-20 h-20 flex-shrink-0">
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
                <div className="flex-1 ml-4">
                  <h3 className="font-bold text-base">{item.dishName}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span>{item.rating}</span>
                    <span className="mx-2">•</span>
                    <span>{item.categoryName}</span>
                  </div>
                  <div className="font-semibold text-base mt-1">
                    ${Number(item.price).toFixed(2)}
                  </div>
                </div>

                {/* Actions (Quantity, Note, View, Order) */}
                <div className="flex flex-col items-end space-y-2">
                  {/* Quantity Selector and Note */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleNote(item.dishId)}
                      className=" text-[#1f2937] text-sm w-[70px] h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                    >
                      Note
                    </button>
                    <div className="flex items-center bg-white bg-opacity-50 rounded-lg">
                      <button
                        onClick={() => handleDecreaseQuantity(item.dishId)}
                        className="w-8 h-8 flex items-center justify-center text-[#1f2937] rounded-l-lg"
                        style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                      >
                        -
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-[#1f2937] bg-transparent">
                        {quantities[item.dishId]}
                      </span>
                      <button
                        onClick={() => handleIncreaseQuantity(item.dishId)}
                        className="w-8 h-8 flex items-center justify-center text-[#1f2937] rounded-r-lg"
                        style={{ backgroundColor: "#D9D9D9", opacity: 0.5 }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* View and Order Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDish(item.dishId)}
                      className="text-white text-sm w-[83px] h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#EE6363" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOrderDish(item.dishId)}
                      className="bg-[#EE6363] text-white text-sm w-[83px] h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#EE6363" }}
                    >
                      Order
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
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
