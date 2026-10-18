const RETRYABLE = new Set(["NO_FACE", "FACE_MISMATCH", "SPOOF_DETECTED"]);

const FALLBACK_MESSAGES = {
  NETWORK: "Không kết nối được máy chủ",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn",
  UNKNOWN: "Có lỗi xảy ra, vui lòng thử lại",
};

export function describeAttendanceError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  if (!error?.response) {
    return { code: "NETWORK", message: FALLBACK_MESSAGES.NETWORK, kind: "fatal" };
  }
  const code = data.code || (status === 401 || status === 403 ? "UNAUTHORIZED" : "UNKNOWN");
  const message = data.message || FALLBACK_MESSAGES[code] || FALLBACK_MESSAGES.UNKNOWN;
  if (status === 409) return { code, message, kind: "done" };
  if (RETRYABLE.has(code)) return { code, message, kind: "retry" };
  return { code, message, kind: "fatal" };
}

const hhmm = (iso) => (iso ? iso.substring(11, 16) : "");

export function formatAttendanceResult(result) {
  if (!result) return "";
  if (result.alreadyDone || result.manual) return result.message;
  if (result.type === "CHECK_IN") {
    const shift = result.shift ? ` · ${result.shift.name} ${result.shift.start}–${result.shift.end}` : "";
    const late = result.late ? " (đi trễ)" : "";
    return `Chào ${result.staffName}${shift} · Vào lúc ${hhmm(result.time)}${late}`;
  }
  const totalMinutes = Math.round((result.workingHours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `Ra lúc ${hhmm(result.time)} · Làm ${h}h${m}'`;
}
