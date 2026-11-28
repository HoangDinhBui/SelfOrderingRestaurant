import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import { submitCustomerOrder } from "../../../services/customerOrder";

import { BACKEND_URL } from "../../../config";
const Order = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState(
    state?.tableNumber || localStorage.getItem("tableNumber") || "1"
  );
  const [processingOrder, setProcessingOrder] = useState(false);
  // Note popup: edited right here in the cart instead of navigating to a separate page
  const [noteItem, setNoteItem] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const {
    cartItems,
    fetchCartData,
    updateItemQuantity,
    removeItem,
    updateItemNotes,
    updateCartWithGraphQLData,
  } = useContext(CartContext);

  const openNote = (item) => {
    setNoteDraft(item.notes || "");
    setNoteItem(item);
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await updateItemNotes(noteItem.dishId, noteDraft.trim());
      setNoteItem(null);
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Không lưu được ghi chú. Vui lòng thử lại.");
    } finally {
      setSavingNote(false);
    }
  };

  const API_BASE_URL = BACKEND_URL;

  const getImageUrl = (imageName) => {
    if (!imageName) return "/img/logoremovebg.png";
    if (/^https?:\/\//.test(imageName)) return imageName;
    return `${API_BASE_URL}/api/images/${imageName}`;
  };

  // Sync tableId with localStorage and navigation state
  useEffect(() => {
    const savedTableNumber = localStorage.getItem("tableNumber");
    const newTableNumber = state?.tableNumber || savedTableNumber || "1";

    if (newTableNumber !== tableId) {
      if (!isNaN(newTableNumber) && parseInt(newTableNumber) > 0) {
        setTableId(newTableNumber);
        localStorage.setItem("tableNumber", newTableNumber);
        console.log("Updated tableId:", newTableNumber);
      } else {
        // Invalid table number, set default
        localStorage.setItem("tableNumber", "1");
        setTableId("1");
        navigate("/table/1", { replace: true });
      }
    }
  }, [state?.tableNumber, tableId, navigate]);

  // The cart is stored on this device (see CartContext); just reload it
  const fetchCartItems = useCallback(async () => {
    try {
      await fetchCartData();
    } catch (err) {
      console.error("Error loading cart:", err);
      setError("Không tải được giỏ hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [fetchCartData]);

  useEffect(() => {
    console.log("Order component mounted, fetching cart items");
    console.log("Initial tableId:", tableId);
    fetchCartItems();
  }, [fetchCartItems]);

  const updateQuantity = async (id, delta) => {
    const item = cartItems.find((item) => item.dishId === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);

    try {
      if (newQuantity === 0) {
        await removeItem(id);
      } else {
        await updateItemQuantity(id, newQuantity);
      }
    } catch (err) {
      setError("Không cập nhật được số lượng. Vui lòng thử lại.");
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );

  const createOrder = async () => {
    try {
      setProcessingOrder(true);

      await submitCustomerOrder({
        tableId,
        items: cartItems,
        totalAmount: totalPrice,
      });

      setShowModal(false);
      setShowConfirmation(true);

      // Empty the cart through the context so the badge count resets too
      updateCartWithGraphQLData({ items: [] });

      setTimeout(() => {
        setShowConfirmation(false);
        navigate(`/table/${tableId}`);
      }, 3000);
    } catch (err) {
      console.error("Error in order/payment flow:", err);
      setError(`Không gửi được đơn: ${err.message}`);
      setShowModal(false);
    } finally {
      setProcessingOrder(false);
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-4 pt-20 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-line animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-card/95 backdrop-blur border-b border-line sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between px-2 h-14">
          <button
            onClick={() => navigate("/menu_cus")}
            aria-label="Quay lại thực đơn"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-ink">Giỏ hàng</div>
            <div className="text-[11px] text-ink-muted">Bàn {tableId}</div>
          </div>
          <button
            onClick={() => navigate(`/table/${tableId}`)}
            aria-label="Trang chủ"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <i className="fa-solid fa-house text-ink" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className={`max-w-md mx-auto px-4 py-4 ${cartItems.length > 0 ? "pb-32" : "pb-10"}`}>
        {error && (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{error}</p>
            <button
              className="shrink-0 font-semibold underline underline-offset-2"
              onClick={() => {
                setError(null);
                fetchCartItems();
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="mt-10 text-center bg-card border border-line rounded-2xl p-8">
            <i className="fa-solid fa-basket-shopping text-4xl text-line" aria-hidden="true" />
            <p className="mt-4 font-semibold text-ink">Giỏ hàng đang trống</p>
            <p className="mt-1 text-sm text-ink-muted">Hãy chọn vài món ngon nhé!</p>
            <button
              onClick={() => navigate("/menu_cus")}
              className="mt-5 min-h-[44px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <article key={item.dishId} className="bg-card border border-line rounded-2xl shadow-sm p-3 flex gap-3">
                <img
                  src={getImageUrl(item.dishImage || item.image)}
                  alt=""
                  loading="lazy"
                  className="w-20 h-20 shrink-0 object-cover rounded-xl bg-line"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/img/logoremovebg.png";
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] text-ink leading-snug">{item.dishName}</h3>
                      <p className="text-sm font-bold text-brand mt-0.5">
                        {parseFloat(item.price).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.dishId)}
                      className="w-9 h-9 -mt-1 -mr-1 shrink-0 flex items-center justify-center rounded-full text-ink-muted hover:bg-red-50 hover:text-red-700 transition"
                      aria-label={`Xóa ${item.dishName}`}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true" />
                    </button>
                  </div>

                  {item.notes && item.notes.trim() !== "" && (
                    <div className="mt-1.5 text-xs text-ink-muted bg-brand-soft px-2 py-1 rounded-lg">
                      <span className="font-medium text-ink">Ghi chú:</span> {item.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center rounded-xl border border-line bg-white">
                      <button
                        onClick={() => updateQuantity(item.dishId, -1)}
                        aria-label="Giảm số lượng"
                        className="w-9 h-9 flex items-center justify-center text-ink text-lg rounded-l-xl hover:bg-brand-soft transition"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-ink" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.dishId, 1)}
                        aria-label="Tăng số lượng"
                        className="w-9 h-9 flex items-center justify-center text-ink text-lg rounded-r-xl hover:bg-brand-soft transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => openNote(item)}
                      className={`h-9 px-3 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition ${
                        item.notes ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink hover:border-brand/40"
                      }`}
                    >
                      <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                      {item.notes ? "Sửa ghi chú" : "Ghi chú"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Sticky checkout bar: total is always visible next to the action */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-line">
          <div className="max-w-md mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-ink-muted">{itemCount} món · Tổng cộng</div>
              <div className="text-lg font-bold text-ink">{totalPrice.toLocaleString("vi-VN")}đ</div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={processingOrder}
              className="h-12 px-6 rounded-xl bg-brand text-white font-semibold shadow-md shadow-brand/25 hover:bg-brand-hover active:scale-[0.98] transition disabled:opacity-60"
            >
              {processingOrder ? "Đang gửi..." : "Đặt món"}
            </button>
          </div>
        </div>
      )}

      {noteItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="note-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => !savingNote && setNoteItem(null)} />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl page-enter">
            <h2 id="note-title" className="text-lg font-bold text-ink">Ghi chú cho bếp</h2>
            <p className="text-sm text-ink-muted mt-0.5">{noteItem.dishName}</p>
            <textarea
              autoFocus
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="VD: ít cay, không hành..."
              aria-label="Ghi chú cho món"
              className="mt-4 w-full rounded-xl border border-line bg-white p-3 text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {["Ít cay", "Không hành", "Không đá", "Ít đường"].map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setNoteDraft((prev) => (prev ? `${prev}, ${hint.toLowerCase()}` : hint))}
                  className="min-h-[36px] px-3 rounded-full border border-line bg-white text-sm text-ink hover:border-brand/40 transition"
                >
                  + {hint}
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setNoteItem(null)}
                disabled={savingNote}
                className="h-11 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
              >
                Hủy
              </button>
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="h-11 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition disabled:opacity-60"
              >
                {savingNote ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="order-confirm-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processingOrder && setShowModal(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl page-enter">
            <h2 id="order-confirm-title" className="text-lg font-bold text-ink text-center">
              Xác nhận gọi món?
            </h2>
            <p className="mt-1 text-sm text-ink-muted text-center">
              {itemCount} món · {totalPrice.toLocaleString("vi-VN")}đ sẽ được gửi xuống bếp
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
                disabled={processingOrder}
              >
                Xem lại
              </button>
              <button
                onClick={createOrder}
                className="h-12 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition disabled:opacity-60"
                disabled={processingOrder}
              >
                {processingOrder ? "Đang gửi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="alertdialog" aria-live="assertive">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card p-7 rounded-3xl shadow-xl w-full max-w-sm text-center page-enter">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-ink mb-1">Đặt món thành công!</h3>
            <p className="text-ink-muted text-sm">Đơn của bạn đã được gửi tới bếp. Đang quay về trang chủ...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
