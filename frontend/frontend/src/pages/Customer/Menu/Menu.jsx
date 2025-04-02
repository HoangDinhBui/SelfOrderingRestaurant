import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Menu = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Appetizers");

  const categories = [
    { id: 1, name: "Appetizers", icon: "🍴" },
    { id: 2, name: "Main Course", icon: "🍽️" },
    { id: 3, name: "Vegetarian", icon: "🥗" },
  ];

  const menuItems = [
    {
      id: 1,
      name: "Huîtres Fraiches (6PCS)",
      originalPrice: 250,
      discountedPrice: 199,
      category: "Appetizers",
      price: "$25.34",
      rating: 5.0,
      image: "/src/assets/img/Mon1.jpg"
    },
    {
      id: 2,
      name: "Huîtres Gratinées (6PCS)",
      originalPrice: 250,
      discountedPrice: 199,
      category: "Appetizers",
      price: "$25.73",
      rating: 5.0,
      image: "/src/assets/img/Mon2.jpg"
    },
    {
      id: 3,
      name: "Tartare De Saumon",
      originalPrice: 250,
      discountedPrice: 199,
      category: "Appetizers",
      price: "$14.03",
      rating: 5.0,
      image: "/src/assets/img/Mon3.jpg"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-lg font-bold">Menu</div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="container mx-auto p-4 bg-gray-100">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search in menu"
            className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center mb-4">
            <span className="text-yellow-500 text-xl mr-2">⭐</span>
            <h3 className="font-bold text-lg">Select Category</h3>
          </div>
          <div className="flex space-x-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center justify-center px-6 py-3 rounded-full border-2 transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "!bg-red-400 text-white border-red-400"
                    : "bg-white text-black border-gray-300"
                } hover:bg-orange-500 hover:text-white`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm flex items-center p-3">
            <div className="w-32 h-32 flex-shrink-0">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 ml-4">
              <h3 className="font-bold text-lg text-left">{item.name}</h3>
              <div className="flex items-center mt-1">
                <span className="font-bold text-black text-lg">{item.discountedPrice}</span>
                <span className="text-gray-400 text-sm line-through ml-2">{item.originalPrice}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-lg">{item.price}</p>
                <button
                  onClick={() => navigate(`/view/${item.id}`)} // Điều hướng đến trang chi tiết
                  className="!bg-red-400 text-white py-2 px-6 rounded-lg flex items-center"
                >
                  View
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default Menu;
