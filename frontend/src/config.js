// Single source of truth for the backend location. Set VITE_API_BASE_URL per environment
// (e.g. http://localhost:8081 in dev); the Render URL is only the production fallback.
export const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://selforderingrestaurant-635x.onrender.com"
).replace(/\/+$/, "");

// http -> ws, https -> wss
export const BACKEND_WS_URL = BACKEND_URL.replace(/^http/, "ws");

export const authHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
