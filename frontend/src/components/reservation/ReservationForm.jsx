import React, { useEffect, useMemo, useState } from "react";
import { formatVnd, toLocalDateString } from "../../utils/reservation";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-[#F0F5FD] px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#B73512]";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";

const MAX_DAYS_AHEAD = 30;

// 10:00 → 21:00, mỗi 30 phút
const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const minutes = 10 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

const slotIsPast = (dateStr, slot) => new Date(`${dateStr}T${slot}:00`) <= new Date();

/**
 * Form đặt bàn dùng chung cho khách (trang Đặt bàn trước) và nhân viên (Đặt bàn thủ công).
 * tables: [{ tableNumber, capacity }], dishes: kết quả normalizeDish().
 * onSubmit nhận body đúng dạng ReservationRequestDTO của backend.
 */
export default function ReservationForm({
  tables = [],
  dishes = [],
  submitting = false,
  error = "",
  submitLabel = "Xác nhận đặt bàn",
  onSubmit,
}) {
  const today = toLocalDateString(new Date());
  const lastDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return toLocalDateString(d);
  }, []);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState({});
  const [category, setCategory] = useState("Tất cả");
  const [localError, setLocalError] = useState("");

  const availableSlots = TIME_SLOTS.filter((slot) => !slotIsPast(date, slot));
  const fittingTables = tables.filter((t) => (t.capacity || 0) >= guestCount);

  // Bỏ chọn giờ/bàn khi không còn hợp lệ (đổi ngày, tăng số khách)
  useEffect(() => {
    if (time && slotIsPast(date, time)) setTime("");
  }, [date, time]);
  useEffect(() => {
    if (tableId && !fittingTables.some((t) => String(t.tableNumber) === String(tableId))) {
      setTableId("");
    }
  }, [fittingTables, tableId]);

  const availableDishes = dishes.filter((d) => d.available);
  const categories = ["Tất cả", ...new Set(availableDishes.map((d) => d.categoryName))];
  const shownDishes =
    category === "Tất cả" ? availableDishes : availableDishes.filter((d) => d.categoryName === category);
  const selectedDishes = availableDishes.filter((d) => quantities[d.dishId] > 0);
  const total = selectedDishes.reduce((sum, d) => sum + d.price * quantities[d.dishId], 0);

  const changeQuantity = (dishId, delta) =>
    setQuantities((prev) => {
      const next = Math.max(0, (prev[dishId] || 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[dishId];
      else copy[dishId] = next;
      return copy;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!customerName.trim()) return setLocalError("Vui lòng nhập tên khách.");
    if (phone.replace(/\D/g, "").length < 9) return setLocalError("Vui lòng nhập số điện thoại hợp lệ.");
    if (!time) return setLocalError("Vui lòng chọn giờ đến.");
    if (!tableId) return setLocalError("Vui lòng chọn bàn.");
    setLocalError("");

    await onSubmit({
      customerName: customerName.trim(),
      contactPhone: phone.trim(),
      guestCount,
      tableId: Number(tableId),
      reservationTime: `${date}T${time}:00`,
      notes: notes.trim(),
      items: selectedDishes.map((d) => ({ dishId: d.dishId, quantity: quantities[d.dishId], notes: "" })),
    });
  };

  const shownError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Tên khách hàng *</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
            placeholder="Nhập tên khách"
            autoComplete="name"
          />
        </label>
        <label>
          <span className={labelClass}>Số điện thoại *</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="09xx xxx xxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label>
          <span className={labelClass}>Ngày dùng bữa</span>
          <input
            type="date"
            min={today}
            max={lastDay}
            value={date}
            onChange={(e) => setDate(e.target.value || today)}
            className={inputClass}
          />
        </label>
        <div>
          <span className={labelClass}>Số khách</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
              className="h-10 w-10 rounded-lg bg-[#EAF0F9] text-lg font-bold text-slate-700"
              aria-label="Bớt một khách"
            >
              −
            </button>
            <span className="w-8 text-center text-base font-semibold">{guestCount}</span>
            <button
              type="button"
              onClick={() => setGuestCount((n) => Math.min(30, n + 1))}
              className="h-10 w-10 rounded-lg bg-[#EAF0F9] text-lg font-bold text-slate-700"
              aria-label="Thêm một khách"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      <div>
        <span className={labelClass}>Giờ đến *</span>
        {availableSlots.length === 0 ? (
          <p className="text-sm text-slate-500">Hôm nay đã hết khung giờ, vui lòng chọn ngày khác.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {availableSlots.map((slot) => (
              <button
                type="button"
                key={slot}
                onClick={() => setTime(slot)}
                className={`rounded-md py-2 text-sm font-semibold ${
                  time === slot ? "bg-[#B73512] text-white" : "bg-[#EAF0F9] text-slate-700 hover:bg-slate-200"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className={labelClass}>Bàn *</span>
        <select value={tableId} onChange={(e) => setTableId(e.target.value)} className={inputClass}>
          <option value="">
            {fittingTables.length ? "-- Chọn bàn --" : `Không có bàn đủ ${guestCount} chỗ`}
          </option>
          {fittingTables.map((t) => (
            <option key={t.tableNumber} value={t.tableNumber}>
              Bàn {t.tableNumber} ({t.capacity} chỗ)
            </option>
          ))}
        </select>
      </label>

      {availableDishes.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Món đặt trước (không bắt buộc)</span>
            {selectedDishes.length > 0 && (
              <span className="text-sm font-semibold text-[#B73512]">{formatVnd(total)}</span>
            )}
          </div>
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                  category === c ? "bg-[#B73512] text-white" : "bg-[#EAF0F9] text-slate-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {shownDishes.map((d) => (
              <div key={d.dishId} className="flex items-center justify-between gap-2 rounded-lg bg-[#F0F5FD] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{d.name}</p>
                  <p className="text-xs text-slate-500">{formatVnd(d.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {quantities[d.dishId] > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => changeQuantity(d.dishId, -1)}
                        className="h-8 w-8 rounded bg-white text-slate-600"
                        aria-label={`Bớt ${d.name}`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{quantities[d.dishId]}</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => changeQuantity(d.dishId, 1)}
                    className="h-8 w-8 rounded bg-white text-slate-600"
                    aria-label={`Thêm ${d.name}`}
                  >
                    ＋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className={labelClass}>Ghi chú</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Ví dụ: có người lớn tuổi, cần ghế trẻ em..."
        />
      </label>

      {shownError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {shownError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#B73512] py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Đang gửi..." : submitLabel}
      </button>
    </form>
  );
}
