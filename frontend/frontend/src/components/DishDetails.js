import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const DishDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/dishes/${id}`)
      .then((response) => {
        console.log("Original price data:", response.data.price);
        setDish(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dish details. Please try again!");
        setLoading(false);
      });
  }, [id]);

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const handleAddToCart = () => {
    // Implement add to cart functionality here
    alert(`Added ${quantity} ${dish.dishName} to cart!`);
    // Navigate to cart or stay on page
  };

  if (loading)
    return <p className="text-center text-gray-500">Loading dish details...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!dish) return <p className="text-center text-red-500">Dish not found</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white py-3 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex items-center px-4">
          <button
            onClick={() => navigate(-1)}
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
            <div className="text-lg font-bold">Dish Details</div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-64 overflow-hidden">
            <img
              src={dish.imageUrl || "/placeholder-dish.jpg"}
              alt={dish.dishName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder-dish.jpg";
              }}
            />
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{dish.dishName}</h1>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                {dish.status}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium">{dish.categoryName}</span>
            </div>

            <p className="text-gray-700 mb-6">
              {dish.description || "No description available."}
            </p>

            <div className="flex justify-between items-center mb-6">
              <div className="text-2xl font-bold">{Number(dish.price)} VND</div>

              <div className="flex items-center">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-1 bg-gray-200 rounded-l-lg"
                >
                  -
                </button>
                <span className="px-4 py-1 bg-gray-100">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-1 bg-gray-200 rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-red-400 text-white rounded-lg font-medium hover:bg-red-500"
            >
              Add to Cart - {Number(dish.price) * quantity} VND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishDetails;
