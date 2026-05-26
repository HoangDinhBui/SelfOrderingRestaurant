import React, { useState, useEffect } from "react";
import axios from "axios";
import { publicAPI, authAPI } from "../../../services/api";

const QuickOrderModal = ({ isOpen, onClose, tables, onOrderSuccess }) => {
  const [selectedTableId, setSelectedTableId] = useState("");
  const [dishes, setDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchDishes();
      setSelectedTableId("");
      setSelectedDishes([]);
      setIsScheduling(false);
      setReservationDate("");
      setReservationTime("");
      setError("");
    }
  }, [isOpen]);

  const fetchDishes = async () => {
    try {
      const res = await publicAPI.get("/api/dishes");
      setDishes(res.data);
    } catch (err) {
      console.error("Error fetching dishes:", err);
    }
  };

  const handleAddDish = (dishId) => {
    const dish = dishes.find((d) => d.dishId === parseInt(dishId));
    if (!dish) return;

    const existing = selectedDishes.find((d) => d.dishId === dish.dishId);
    if (existing) {
      setSelectedDishes(
        selectedDishes.map((d) =>
          d.dishId === dish.dishId ? { ...d, quantity: d.quantity + 1 } : d
        )
      );
    } else {
      setSelectedDishes([...selectedDishes, { ...dish, quantity: 1, notes: "" }]);
    }
  };

  const handleUpdateQuantity = (dishId, qty) => {
    if (qty <= 0) {
      setSelectedDishes(selectedDishes.filter((d) => d.dishId !== dishId));
    } else {
      setSelectedDishes(
        selectedDishes.map((d) =>
          d.dishId === dishId ? { ...d, quantity: qty } : d
        )
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedTableId) {
      setError("Vui lòng chọn bàn.");
      return;
    }

    if (!isScheduling && selectedDishes.length === 0) {
      setError("Vui lòng chọn món.");
      return;
    }

    if (isScheduling && (!reservationDate || !reservationTime)) {
      setError("Vui lòng chọn ngày và giờ hẹn.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderItems = selectedDishes.map((d) => ({
        dishId: d.dishId,
        quantity: d.quantity,
        notes: d.notes || "",
      }));

      const payload = {
        tableId: parseInt(selectedTableId),
        items: orderItems,
        customerName: "Staff Quick Order",
        notes: "Quick order from staff",
      };

      if (isScheduling) {
        payload.reservationTime = `${reservationDate}T${reservationTime}:00`;
      }

      await publicAPI.post("/api/orders", payload);
      onOrderSuccess();
      onClose();
    } catch (err) {
      console.error("Error placing order:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đặt đơn.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 w-[500px] relative z-50 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Đặt Đơn Nhanh</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Chọn bàn</label>
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Chọn bàn --</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Bàn {t.id} (Sức chứa: {t.capacity}) - {t.status === 'available' ? 'Trống' : (t.status === 'reserved' ? 'Đã đặt' : 'Đang sử dụng')}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Thêm món</label>
          <select
            onChange={(e) => {
              if (e.target.value) handleAddDish(e.target.value);
              e.target.value = "";
            }}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Chọn món --</option>
            {dishes.map((d) => (
              <option key={d.dishId} value={d.dishId}>
                {d.name} - {d.price.toLocaleString()}đ
              </option>
            ))}
          </select>
        </div>

        {selectedDishes.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Món đã chọn:</h4>
            {selectedDishes.map((d) => (
              <div key={d.dishId} className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-sm text-gray-500">{d.price.toLocaleString()}đ</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleUpdateQuantity(d.dishId, d.quantity - 1)} className="bg-gray-200 px-2 rounded">-</button>
                  <span>{d.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(d.dishId, d.quantity + 1)} className="bg-gray-200 px-2 rounded">+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="scheduling"
            checked={isScheduling}
            onChange={(e) => setIsScheduling(e.target.checked)}
          />
          <label htmlFor="scheduling" className="font-medium">Hẹn lịch cho bàn này</label>
        </div>

        {isScheduling && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày</label>
              <input
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full border p-2 rounded"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giờ</label>
              <input
                type="time"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : (isScheduling ? "Xác nhận đặt bàn" : "Đặt đơn")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickOrderModal;
