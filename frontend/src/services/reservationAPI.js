import { authAPI, publicAPI } from "../axiosConfig";

// Khách (không cần đăng nhập). Dùng authAPI để nếu khách đã đăng nhập thì có token,
// backend gắn lịch hẹn vào tài khoản; chưa đăng nhập thì authAPI không gửi token.
export const createReservation = async (body) =>
  (await authAPI.post("/api/reservations", body)).data;

export const getPublicTables = async () =>
  (await publicAPI.get("/api/reservations/tables")).data;

export const getMenuDishes = async () =>
  (await publicAPI.get("/api/dishes")).data;

// Nhân viên / quản lý
export const listReservations = async ({ date, status } = {}) =>
  (await authAPI.get("/api/reservations", { params: { date, status } })).data;

export const createManualReservation = async (body) =>
  (await authAPI.post("/api/reservations/manual", body)).data;

export const confirmReservation = async (id) =>
  (await authAPI.put(`/api/reservations/${id}/confirm`)).data;

export const rejectReservation = async (id) =>
  (await authAPI.put(`/api/reservations/${id}/reject`)).data;

export const checkInReservation = async (id) =>
  (await authAPI.put(`/api/reservations/${id}/check-in`)).data;

export const cancelReservation = async (id) =>
  (await authAPI.put(`/api/reservations/${id}/cancel`)).data;

export const changeReservationTable = async (id, tableId) =>
  (await authAPI.put(`/api/reservations/${id}/table`, { tableId })).data;

// Lỗi backend -> câu tiếng Việt hiển thị cho người dùng
export const errorMessage = (err, fallback = "Có lỗi xảy ra, vui lòng thử lại.") =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;
