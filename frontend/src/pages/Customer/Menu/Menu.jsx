import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import VoiceOrderModal from "../../../components/voice/VoiceOrderModal";
import { hasSufficientIngredients as hasEnoughStock } from "../../../utils/inventory";
import { submitCustomerOrder } from "../../../services/customerOrder";
import { toast } from "react-toastify";

import { BACKEND_URL } from "../../../config";

const ALL = "__all__";

const Menu = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const navigate = useNavigate();
  // Feedback goes through toasts (the old fixed banner sat under the sticky header)
  const setOrderFeedback = ({ show, message, type }) => {
    if (show && message) (type === "error" ? toast.error : toast.success)(message);
  };
  const { addToCartGraphQL, updateCartWithGraphQLData, fetchCartData, cartItemCount } =
    useContext(CartContext);

  // Retrieve tableNumber from query params or localStorage
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const tableNumberFromUrl = queryParams.get("tableNumber");
  const savedTableNumber = localStorage.getItem("tableNumber");
  const tableNumber = tableNumberFromUrl || savedTableNumber || "1";

  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState({});
  const [loadingDish, setLoadingDish] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [dishIngredients, setDishIngredients] = useState([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [noteDishId, setNoteDishId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Categories come from the dishes themselves; the old hardcoded English names
  // ("Main Course"...) never matched the backend's Vietnamese categoryName, so filtering showed nothing.
  const categories = useMemo(
    () => [ALL, ...new Set(dishes.map((d) => d.categoryName).filter(Boolean))],
    [dishes]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch dishes
        const dishesResponse = await fetch(`${BACKEND_URL}/api/dishes`);
        if (!dishesResponse.ok) {
          throw new Error(`HTTP error! Status: ${dishesResponse.status}`);
        }
        const dishesData = await dishesResponse.json();

        // Fetch available inventory
        const inventoryResponse = await fetch(
          `${BACKEND_URL}/api/inventory/available`
        );
        if (!inventoryResponse.ok) {
          throw new Error(`HTTP error! Status: ${inventoryResponse.status}`);
        }
        const inventoryData = await inventoryResponse.json();

        // Fetch dish-ingredients
        const dishIngredientsResponse = await fetch(
          `${BACKEND_URL}/api/dish_ingredients`
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
        setError("Không tải được danh sách món");
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

  const hasSufficientIngredients = useCallback(
    (dishId) => hasEnoughStock(dishId, dishIngredients, inventory),
    [inventory, dishIngredients]
  );

  // Món đang bán, dùng cho gọi món bằng giọng nói
  const availableDishes = useMemo(
    () => dishes.filter((dish) => hasSufficientIngredients(dish.dishId)),
    [dishes, hasSufficientIngredients]
  );

  // Đặt đơn ngay với đúng các món trong danh sách giọng nói; giỏ hàng giữ nguyên
  const handleVoicePlaceOrder = async (items) => {
    const orderId = await submitCustomerOrder({
      tableId: tableNumber,
      items,
      totalAmount: items.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0),
    });
    setOrderFeedback({
      show: true,
      message: `Đã đặt đơn #${orderId}, món đang được chuyển xuống bếp`,
      type: "success",
    });
    setTimeout(() => navigate(`/table/${tableNumber}`), 2500);
  };

  const handleVoiceOrder = async (items) => {
    for (const item of items) {
      await addToCartGraphQL({ dishId: item.dishId, quantity: item.quantity, notes: "" });
    }
    const portions = items.reduce((sum, item) => sum + item.quantity, 0);
    setOrderFeedback({
      show: true,
      message: `Đã thêm ${portions} phần vào giỏ hàng`,
      type: "success",
    });
  };

  // Filter dishes based on search, category, and ingredients
  const filteredItems = dishes.filter((item) => {
    const itemName = item.dishName || "";
    const matchesSearch = itemName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === ALL || item.categoryName === selectedCategory;
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
        throw new Error("Không tìm thấy món");
      }

      const itemToAdd = {
        dishId: dishId,
        quantity: quantities[dishId],
        notes: notes[dishId] || "",
        dishName: currentDish.dishName,
        price: currentDish.price,
        imageUrl: currentDish.imageUrl,
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

        const response = await fetch(`${BACKEND_URL}/graphql`, {
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
            responseData.errors[0].message || "Không thêm được món vào giỏ"
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
        message: `Đã thêm ${quantities[dishId]} × ${currentDish.dishName} vào giỏ`,
        type: "success",
      });

      return result;
    } catch (error) {
      console.error("Error adding dish to cart:", error);

      setOrderFeedback({
        show: true,
        message: `Không thêm được vào giỏ: ${error.message}`,
        type: "error",
      });

      throw error;
    } finally {
      setLoadingDish(null);
    }
  };

  const handleNote = (dishId) => {
    // In-app sheet instead of window.prompt(): prompts are blocked by the Zalo/Facebook
    // in-app browsers guests open from the table QR, so the Note button "did nothing".
    setNoteDraft(notes[dishId] || "");
    setNoteDishId(dishId);
  };

  const saveNote = () => {
    setNotes((prev) => ({ ...prev, [noteDishId]: noteDraft.trim() }));
    setNoteDishId(null);
  };

  const noteDish = dishes.find((d) => d.dishId === noteDishId);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-4 pt-16 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-2xl bg-card border border-line p-3 animate-pulse">
              <div className="w-20 h-20 rounded-xl bg-line/70" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-2/3 rounded bg-line/70" />
                <div className="h-3 w-1/3 rounded bg-line/70" />
                <div className="h-4 w-1/4 rounded bg-line/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center p-6 bg-card border border-line rounded-2xl shadow-sm max-w-sm w-full">
          <div className="text-lg font-semibold text-red-700 mb-2">Có lỗi xảy ra</div>
          <p className="text-ink-muted text-sm">{error}</p>
          <button
            className="mt-5 min-h-[44px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-card/95 backdrop-blur border-b border-line sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between px-2 h-14">
          <button
            onClick={() => navigate(`/table/${tableNumber}`)}
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-ink">Thực đơn</div>
            <div className="text-[11px] text-ink-muted">Bàn {tableNumber}</div>
          </div>
          <button
            onClick={() => navigate("/order_cus")}
            aria-label={`Giỏ hàng${cartItemCount ? `, ${cartItemCount} món` : ""}`}
            className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <i className="fa-solid fa-basket-shopping text-lg text-ink" aria-hidden="true" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 pb-10">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 min-w-0">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm món..."
              aria-label="Tìm món"
              className="w-full h-11 pl-10 pr-3 text-sm bg-white border border-line rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            className="shrink-0 h-11 px-3.5 rounded-xl bg-brand text-white text-sm font-semibold flex items-center gap-2 hover:bg-brand-hover transition"
          >
            <i className="fa-solid fa-microphone" aria-hidden="true" />
            Giọng nói
          </button>
        </div>

        <VoiceOrderModal
          isOpen={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          dishes={availableDishes}
          onConfirm={handleVoiceOrder}
          onPlaceOrder={handleVoicePlaceOrder}
        />

        <div className="-mx-4 px-4 mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Danh mục">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 h-10 px-4 rounded-full text-sm font-medium border transition ${
                  active
                    ? "bg-brand border-brand text-white shadow-sm"
                    : "bg-white border-line text-ink hover:border-brand/40"
                }`}
              >
                {category === ALL ? "Tất cả" : category}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <article key={item.dishId} className="bg-card border border-line rounded-2xl shadow-sm p-3">
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewDish(item.dishId)}
                    className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-line"
                    aria-label={`Xem ${item.dishName}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/logoremovebg.png";
                      }}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] text-ink leading-snug">{item.dishName}</h3>
                    <div className="text-xs text-ink-muted mt-0.5">{item.categoryName}</div>
                    {item.description && (
                      <div className="text-xs text-ink-muted mt-1 line-clamp-1">{item.description}</div>
                    )}
                    <div className="font-bold text-brand text-[15px] mt-1">
                      {Number(item.price).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                </div>

                {notes[item.dishId] && (
                  <div className="text-xs text-ink-muted mt-2 px-2.5 py-1.5 bg-brand-soft rounded-lg">
                    <span className="font-medium text-ink">Ghi chú:</span> {notes[item.dishId]}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-line bg-white">
                      <button
                        onClick={() => handleDecreaseQuantity(item.dishId)}
                        aria-label="Giảm số lượng"
                        className="w-10 h-10 flex items-center justify-center text-ink text-lg rounded-l-xl hover:bg-brand-soft transition"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-ink" aria-live="polite">
                        {quantities[item.dishId] || 1}
                      </span>
                      <button
                        onClick={() => handleIncreaseQuantity(item.dishId)}
                        aria-label="Tăng số lượng"
                        className="w-10 h-10 flex items-center justify-center text-ink text-lg rounded-r-xl hover:bg-brand-soft transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleNote(item.dishId)}
                      aria-label="Thêm ghi chú"
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                        notes[item.dishId] ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-muted hover:text-ink"
                      }`}
                    >
                      <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOrderDish(item.dishId).catch(() => {})}
                    disabled={loadingDish === item.dishId}
                    className="h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-brand-hover active:scale-[0.97] transition disabled:opacity-60"
                  >
                    {loadingDish === item.dishId ? (
                      <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                    ) : (
                      <i className="fa-solid fa-plus" aria-hidden="true" />
                    )}
                    Thêm vào giỏ
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="text-center py-12">
              <i className="fa-solid fa-bowl-food text-3xl text-line" aria-hidden="true" />
              <p className="mt-3 text-ink-muted text-sm">Không có món nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>

      {noteDishId !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="note-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNoteDishId(null)} />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl page-enter">
            <h2 id="note-title" className="text-lg font-bold text-ink">Ghi chú cho món</h2>
            <p className="text-sm text-ink-muted mt-0.5">{noteDish?.dishName}</p>
            <textarea
              autoFocus
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="VD: ít cay, không hành..."
              className="mt-4 w-full rounded-xl border border-line bg-white p-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setNoteDishId(null)}
                className="h-11 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
              >
                Hủy
              </button>
              <button
                onClick={saveNote}
                className="h-11 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
