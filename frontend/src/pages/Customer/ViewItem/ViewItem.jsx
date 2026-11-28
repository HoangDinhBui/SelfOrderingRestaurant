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
          err.message || "Không tải được thông tin món. Vui lòng thử lại!"
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
        setError(`Xin lỗi, chỉ còn ${item.stock} phần.`);
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
      let errorMessage = "Không thêm được món vào giỏ. Vui lòng thử lại.";

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
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-4 pt-16 animate-pulse">
          <div className="h-72 rounded-3xl bg-line/70" />
          <div className="mt-4 h-6 w-2/3 rounded bg-line/70" />
          <div className="mt-2 h-4 w-1/3 rounded bg-line/70" />
          <div className="mt-6 h-16 rounded bg-line/70" />
        </div>
      </div>
    );

  if (error || contextError)
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center bg-card border border-line rounded-2xl p-6 max-w-sm w-full">
          <p className="text-red-700">{error || contextError}</p>
          <button
            onClick={() => navigate("/menu_cus")}
            className="mt-4 min-h-[44px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );

  if (!item)
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-ink-muted">Không tìm thấy món</p>
          <button
            onClick={() => navigate("/menu_cus")}
            className="mt-4 min-h-[44px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );

  // Extract dish details with fallbacks
  const name = item.dishName || item.name || "Món ăn";
  const price = item.price || 0;
  const category = item.categoryName || item.category || "";
  const imageUrl = item.imageUrl || item.image || "/img/logoremovebg.png";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto pb-32 page-enter">
        <div className="relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-72 object-cover bg-line"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/img/logoremovebg.png";
            }}
          />
          <button
            onClick={() => navigate("/menu_cus")}
            aria-label="Quay lại thực đơn"
            className="absolute top-3 left-3 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md hover:bg-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="relative -mt-6 bg-card rounded-t-3xl px-5 pt-6">
          {category && (
            <span className="inline-block text-xs font-medium text-brand bg-brand-soft px-2.5 py-1 rounded-full">
              {category}
            </span>
          )}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="font-bold text-2xl text-ink leading-tight">{name}</h1>
            <p className="shrink-0 text-xl font-bold text-brand">{Number(price).toLocaleString("vi-VN")}đ</p>
          </div>

          <p className="text-sm text-ink-muted mt-3 leading-relaxed">
            {item.description || "Chưa có mô tả cho món này."}
          </p>

          <button
            onClick={() => navigate(`/note_cus/${id}`, { state: { name: name } })}
            className="mt-5 w-full h-12 rounded-xl border border-line bg-white text-sm font-semibold text-ink flex items-center justify-center gap-2 hover:border-brand/40 transition"
          >
            <i className="fa-regular fa-pen-to-square text-ink-muted" aria-hidden="true" />
            Thêm ghi chú cho bếp
          </button>

          {error && (
            <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Sticky add-to-cart bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-line">
        <div className="max-w-md mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-line bg-white">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={orderLoading}
              aria-label="Giảm số lượng"
              className="w-11 h-11 flex items-center justify-center text-ink text-lg rounded-l-xl hover:bg-brand-soft transition disabled:opacity-50"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-ink" aria-live="polite">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={orderLoading}
              aria-label="Tăng số lượng"
              className="w-11 h-11 flex items-center justify-center text-ink text-lg rounded-r-xl hover:bg-brand-soft transition disabled:opacity-50"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={orderLoading}
            className={`flex-1 h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 ${
              orderSuccess ? "bg-green-700" : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {orderLoading
              ? "Đang thêm..."
              : orderSuccess
              ? "Đã thêm vào giỏ!"
              : `Thêm · ${(Number(price) * quantity).toLocaleString("vi-VN")}đ`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewItem;
