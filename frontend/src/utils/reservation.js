// Lịch hẹn chưa nhận khách: không được hiện ở bếp hay tính tiền chung với bàn
export const RESERVATION_WAITING = ["SCHEDULED", "CONFIRMED"];

export const isAwaitingReservation = (order) =>
  RESERVATION_WAITING.includes(String(order?.status || "").toUpperCase());

// Đơn không còn thuộc về bàn: lịch hẹn chưa nhận khách, hoặc đơn đã hủy (kể cả lịch hẹn bị từ chối)
export const isOffTable = (order) =>
  isAwaitingReservation(order) ||
  String(order?.status || "").toUpperCase() === "CANCELLED";

export const RESERVATION_STATUS_LABEL = {
  SCHEDULED: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  PENDING: "Đã nhận khách",
  PROCESSING: "Đã nhận khách",
  COMPLETED: "Đã nhận khách",
  CANCELLED: "Đã hủy",
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const pad = (n) => String(n).padStart(2, "0");

// "2026-12-02T19:00:00" -> "19:00 · T4 02/12"
export const formatReservationTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${WEEKDAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

// Ngày theo giờ máy dạng yyyy-MM-dd (không dùng toISOString vì lệch múi giờ)
export const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Món từ /api/dishes -> dạng dùng trong form đặt món/đặt bàn
export const normalizeDish = (dish) => ({
  dishId: dish.dishId,
  name: dish.dishName ?? dish.name ?? "",
  price: Number(dish.price) || 0,
  categoryName: dish.categoryName || "Khác",
  description: dish.description || "",
  imageUrl: dish.imageUrl || "",
  available: String(dish.status || "AVAILABLE").toUpperCase() === "AVAILABLE",
});

export const formatVnd = (amount) =>
  `${(Number(amount) || 0).toLocaleString("vi-VN")}đ`;
