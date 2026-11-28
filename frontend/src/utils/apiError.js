// Turn backend errors (REST body, axios error, GraphQL error) into something a guest can read.

export const NO_STAFF_ON_SHIFT = "NO_STAFF_ON_SHIFT";

// Older backends prefixed messages with English context ("Failed to create notification: ...")
const stripPrefix = (message) => message.replace(/^(Failed to [^:]+|Error[^:]*):\s*/i, "");

export const getApiErrorMessage = (errOrBody, fallback) => {
  const body = errOrBody?.response?.data ?? errOrBody;
  const raw = body?.message || body?.error || (errOrBody instanceof Error ? errOrBody.message : "");
  return raw ? stripPrefix(String(raw)) : fallback;
};

export const isNoStaffOnShift = (errOrBody) => {
  const body = errOrBody?.response?.data ?? errOrBody;
  if (body?.code === NO_STAFF_ON_SHIFT || errOrBody?.code === NO_STAFF_ON_SHIFT) return true;
  // Fallback for deployments that still return only the message
  return /không có nhân viên trong ca/i.test(getApiErrorMessage(errOrBody, ""));
};

// Opens the shared NoStaffNotice popup (mounted once in App)
export const showNoStaffNotice = (action) =>
  window.dispatchEvent(new CustomEvent("app:no-staff-on-shift", { detail: { action } }));
