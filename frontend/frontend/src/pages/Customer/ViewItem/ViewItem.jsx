import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { MenuContext } from "../../../context/MenuContext";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const ViewItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDishById, error: contextError } = useContext(MenuContext);
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        const cachedDish = localStorage.getItem("currentDish");
        if (cachedDish) {
          const parsedDish = JSON.parse(cachedDish);
          // Check if this is the dish we're looking for
          if (
            parsedDish.dishId === parseInt(id) ||
            parsedDish.id === parseInt(id)
          ) {
            setItem(parsedDish);
            setLoading(false);
            return;
          }
        }
        const dishData = await getDishById(id);
        setItem(dishData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dish details:", err);
        setError("Failed to load dish details. Please try again!");
        setLoading(false);
      }
    };

    fetchDish();
  }, [id, getDishById]);

  // Add the missing handleQuantityChange function
  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const { addToCart } = useContext(CartContext);

  const handleAddToCart = async () => {
    try {
      setOrderLoading(true);

      const orderItemData = {
        dishId: parseInt(id),
        quantity: quantity,
        note: "",
      };

      await addToCart(orderItemData);

      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500">Loading dish details...</p>;
  if (error)
    return <p className="text-center text-red-500">{error || contextError}</p>;
  if (!item) return <p className="text-center text-red-500">Dish not found</p>;

  const name = item.dishName || item.name || "Unnamed Dish";
  const price = item.price || 0;
  const category = item.categoryName || item.category || "Uncategorized";
  // const description = item.description || "No description available.";
  const imageUrl = item.imageUrl || item.image || "/placeholder-dish.jpg";
  const rating = item.rating || 4.5;
  const sold = item.sold || 0;
  const stock = item.stock || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10 flex items-center px-4">
        <button
          onClick={() => navigate("/menu")}
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

      {/* Nội dung chi tiết món ăn */}
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        {/* Ảnh món ăn */}
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-64 object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-dish.jpg";
          }}
        />

        {/* Tên và giá */}
        <div className="flex justify-between items-center mt-4">
          <h3 className="font-bold text-xl">{name}</h3>
          <p className="text-gray-500 text-lg">
            {Number(price).toLocaleString()} VND
          </p>
        </div>

        {/* Số lượng đã bán và tồn kho */}
        <div className="flex justify-between items-center mt-2">
          <div className="mt-2">
            {/* Số lượng đã bán và tồn kho */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-black">{sold}</span>
              <span className="text-gray-400">{stock}</span>
            </div>

            {/* Đánh giá và danh mục */}
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-yellow-500 text-lg">⭐</span>
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-sm text-gray-600">{category}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/note/${id}`, { state: { name: name } })} // Truyền tên món ăn qua state
            className="!bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Note
          </button>
        </div>

        {/* Mô tả */}
        <p className="text-sm text-gray-600 mt-4">{item.description}</p>

        {/* Số lượng, tổng giá và nút Order */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="!bg-gray-400 px-2 py-1 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-lg">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="!bg-gray-400 px-2 py-1 rounded hover:bg-gray-300"
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
            } text-white py-2 px-6 rounded-lg flex items-center`}
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
      </div>
    </div>
  );
};

export default ViewItem;
