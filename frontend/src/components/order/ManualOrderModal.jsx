import React, { useEffect, useMemo, useRef, useState } from "react";
import { authAPI } from "../../axiosConfig";
import { errorMessage, getMenuDishes } from "../../services/reservationAPI";
import { formatVnd, normalizeDish } from "../../utils/reservation";
import VoiceOrderModal from "../voice/VoiceOrderModal";

/**
 * Nhân viên đặt món giúp khách tại bàn (khách lớn tuổi, khách không tự order được).
 * tables: [{ tableNumber, capacity, status }]. Tạo đơn qua POST /api/orders; bàn đang có khách thì
 * backend tự gộp món vào đơn đang phục vụ.
 */
export default function ManualOrderModal({
  isOpen,
  onClose,
  tables = [],
  defaultTableNumber,
  onOrderSuccess,
}) {
  const [dishes, setDishes] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [targetTable, setTargetTable] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [kitchenNote, setKitchenNote] = useState("");
  const [cart, setCart] = useState({}); // dishId -> quantity
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const closeTimer = useRef(null);

  // Hủy hẹn giờ đóng khi modal đóng hoặc bị gỡ, để lần mở sau không bị tự đóng
  useEffect(() => {
    if (isOpen) return undefined;
    clearTimeout(closeTimer.current);
    return () => clearTimeout(closeTimer.current);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitting(false);
    setCart({});
    setCustomerName("");
    setKitchenNote("");
    setSearchQuery("");
    setVoiceOpen(false);
    setTargetTable(defaultTableNumber ? String(defaultTableNumber) : "");
    setLoadError("");
    getMenuDishes()
      .then((list) => setDishes((list || []).map(normalizeDish).filter((d) => d.available)))
      .catch((err) => setLoadError(errorMessage(err, "Không tải được thực đơn.")));
  }, [isOpen, defaultTableNumber]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const categories = useMemo(
    () => ["Tất cả", ...new Set(dishes.map((d) => d.categoryName))],
    [dishes],
  );

  const filteredDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dishes.filter(
      (d) =>
        (selectedCategory === "Tất cả" || d.categoryName === selectedCategory) &&
        (!q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)),
    );
  }, [dishes, selectedCategory, searchQuery]);

  const cartItems = dishes
    .filter((d) => cart[d.dishId] > 0)
    .map((d) => ({ ...d, quantity: cart[d.dishId] }));
  const totalPortions = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const changeQuantity = (dishId, delta) =>
    setCart((prev) => {
      const next = Math.max(0, (prev[dishId] || 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[dishId];
      else copy[dishId] = next;
      return copy;
    });

  const toCart = (items) => Object.fromEntries(items.map((it) => [it.dishId, it.quantity]));

  // Giọng nói sửa trên chính danh sách đã chọn, nên kết quả thay cho danh sách cũ
  const handleVoiceOrder = (items) => setCart(toCart(items));

  const handleVoicePlaceOrder = async (items) => {
    setCart(toCart(items));
    const error = await submitOrder(items.map((it) => ({ ...it.dish, quantity: it.quantity })));
    if (error) throw new Error(error);
  };

  const handlePlaceOrder = async () => {
    if (submitting) return;
    await submitOrder(cartItems);
  };

  // Trả về câu báo lỗi nếu không gửi được, null nếu thành công
  const submitOrder = async (orderItems) => {
    if (!targetTable) {
      setToastMessage("Vui lòng chọn bàn phục vụ.");
      return "Vui lòng chọn bàn phục vụ trước khi đặt.";
    }
    if (orderItems.length === 0) {
      setToastMessage("Vui lòng chọn ít nhất 1 món ăn trước khi đặt.");
      return "Chưa có món nào.";
    }
    setSubmitting(true);
    try {
      const { data: orderId } = await authAPI.post("/api/orders", {
        tableId: Number(targetTable),
        customerName: customerName.trim() || `Khách tại bàn ${targetTable}`,
        notes: kitchenNote.trim(),
        items: orderItems.map((it) => ({ dishId: it.dishId, quantity: it.quantity, notes: "" })),
      });
      setToastMessage(`Đã tạo đơn #${orderId} cho bàn ${targetTable}, món đã chuyển xuống bếp.`);
      onOrderSuccess?.(orderId);
      closeTimer.current = setTimeout(onClose, 1200);
      return null;
    } catch (err) {
      const message = errorMessage(err, "Không tạo được đơn, vui lòng thử lại.");
      setToastMessage(message);
      setSubmitting(false);
      return message;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2118]/45 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#3A2E22] text-[#FFF9F2] px-5 py-2.5 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[#FAF7F2] border border-[#F2DFC2] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-[#3A2E22]">
        <div className="px-5 py-3.5 bg-white border-b border-[#F0DEC0] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight">Đặt món thủ công</h2>
            <p className="text-xs text-[#7D6B55]">Nhân viên chọn món giúp khách và gửi thẳng xuống bếp</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#EBDCC8] text-[#6E5A44] flex items-center justify-center text-sm"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Cột trái: tìm kiếm, danh mục, thực đơn */}
          <div className="lg:col-span-7 p-4 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[#F0DEC0] overflow-y-auto">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên món..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#EBD4B0] bg-white text-sm placeholder-[#A89882] focus:outline-none focus:border-[#EA580C]"
              />
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                disabled={dishes.length === 0}
                className="shrink-0 px-3 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold disabled:opacity-50"
              >
                🎤 Giọng nói
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#3A2E22] text-[#FFF9F2]"
                      : "bg-white text-[#6E5A44] hover:bg-[#FFF6E8] border border-[#EED8B4]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {loadError ? (
                <div className="p-6 text-center text-sm text-red-700 bg-red-50 rounded-xl">{loadError}</div>
              ) : filteredDishes.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#8A775E] bg-white rounded-xl border border-[#F2DFC2]">
                  {dishes.length === 0 ? "Đang tải thực đơn..." : "Không tìm thấy món phù hợp."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDishes.map((dish) => {
                    const qty = cart[dish.dishId] || 0;
                    return (
                      <div
                        key={dish.dishId}
                        className={`bg-white rounded-2xl p-3.5 border flex flex-col justify-between ${
                          qty > 0 ? "border-[#F6BA88] ring-1 ring-[#EA580C]/20 bg-[#FFFDF9]" : "border-[#F2DFC2]"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold tracking-wider text-[#A84B14] bg-[#FFF2E0] px-2 py-0.5 rounded-md border border-[#FBD2A8]">
                            {dish.categoryName}
                          </span>
                          <h4 className="mt-2 text-sm font-bold leading-snug">{dish.name}</h4>
                          {dish.description && (
                            <p className="text-xs text-[#7D6B55] line-clamp-2 mt-1 mb-2">{dish.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#F7EAD7]">
                          <span className="text-sm font-bold">{formatVnd(dish.price)}</span>
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => changeQuantity(dish.dishId, 1)}
                              className="px-3 py-1.5 rounded-lg border border-[#EBD4B0] bg-[#FFFBF5] hover:bg-[#FFEED8] text-[#C2410C] text-sm font-bold"
                            >
                              + Thêm
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-[#FFF4E5] border border-[#F5C293] rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => changeQuantity(dish.dishId, -1)}
                                className="w-7 h-7 rounded bg-white text-[#A84B14] font-bold"
                                aria-label={`Bớt ${dish.name}`}
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-[#EA580C]">{qty}</span>
                              <button
                                type="button"
                                onClick={() => changeQuantity(dish.dishId, 1)}
                                className="w-7 h-7 rounded bg-[#EA580C] text-white font-bold"
                                aria-label={`Thêm ${dish.name}`}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: bàn, khách, món đã chọn, gửi bếp */}
          <div className="lg:col-span-5 p-4 bg-[#FFFDFB] flex flex-col justify-between min-h-0 overflow-y-auto">
            <div className="space-y-3.5">
              <label className="block">
                <span className="text-xs font-bold tracking-wider text-[#6E4B18] uppercase block mb-1.5">
                  Bàn phục vụ *
                </span>
                <select
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-[#EBD4B0] bg-white text-sm font-semibold focus:outline-none focus:border-[#EA580C]"
                >
                  <option value="">-- Chọn bàn --</option>
                  {tables.map((t) => (
                    <option key={t.tableNumber} value={String(t.tableNumber)}>
                      Bàn {String(t.tableNumber).padStart(2, "0")} (
                      {String(t.status).toLowerCase() === "available" ? "Trống" : "Đang phục vụ"} •{" "}
                      {t.capacity || 4} chỗ)
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-[#6E4B18] block mb-1">Tên khách (không bắt buộc)</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={targetTable ? `Khách tại bàn ${targetTable}` : "Ví dụ: Bác Hùng"}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBD4B0] bg-white text-sm focus:outline-none focus:border-[#EA580C]"
                />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-wider text-[#6E4B18] uppercase">
                    Món đã chọn ({cartItems.length} món • {totalPortions} phần)
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart({})}
                      className="text-xs text-[#DC2626] hover:underline font-semibold"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#9E8B75] bg-white rounded-xl border border-dashed border-[#E8D4BA]">
                      Chưa chọn món nào.
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.dishId}
                        className="bg-white p-2.5 rounded-xl border border-[#F2DFC2] flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold truncate">{item.name}</h5>
                          <span className="text-xs text-[#8C7A65]">{formatVnd(item.price)} / phần</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#FAF4ED] border border-[#ECD1B3] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.dishId, -1)}
                            className="w-7 h-7 rounded bg-white text-[#6E5A44] font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.dishId, 1)}
                            className="w-7 h-7 rounded bg-white text-[#6E5A44] font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold min-w-[80px] text-right">
                          {formatVnd(item.price * item.quantity)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-[#6E4B18] block mb-1">Ghi chú cho bếp</span>
                <input
                  type="text"
                  value={kitchenNote}
                  onChange={(e) => setKitchenNote(e.target.value)}
                  placeholder="Ví dụ: ít cay, nấu mềm cho người lớn tuổi..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EBD4B0] bg-white text-sm focus:outline-none focus:border-[#EA580C]"
                />
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#F0DEC0]">
                <span className="text-sm font-bold uppercase">Tạm tính</span>
                <span className="text-lg font-black text-[#C85319]">{formatVnd(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white text-base font-bold disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "📋 Đặt món & gửi bếp"}
            </button>
          </div>
        </div>
      </div>

      <VoiceOrderModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        dishes={dishes}
        initialItems={cartItems.map((it) => ({ dish: it, quantity: it.quantity }))}
        onConfirm={handleVoiceOrder}
        onPlaceOrder={handleVoicePlaceOrder}
        confirmLabel="Lưu vào món đã chọn"
        placeOrderLabel="Gửi bếp luôn"
      />
    </div>
  );
}
