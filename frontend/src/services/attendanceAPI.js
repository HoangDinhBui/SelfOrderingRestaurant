import { authAPI } from "../axiosConfig";

export const scanAttendance = async (type, blob) => {
  const formData = new FormData();
  formData.append("image", blob, "capture.jpg");
  formData.append("type", type);
  const { data } = await authAPI.post("/api/attendance/scan", formData);
  return data;
};

export const manualAttendance = async (type, reason) => {
  const { data } = await authAPI.post("/api/attendance/manual", { type, reason });
  return data;
};

export const getTodayAttendance = async () => {
  const { data } = await authAPI.get("/api/attendance/today");
  return data;
};

export const getPendingAttendance = async () => {
  const { data } = await authAPI.get("/api/attendance/pending");
  return data;
};

export const reviewAttendance = async (id, approved) => {
  await authAPI.patch(`/api/attendance/${id}/approval`, { approved });
};
