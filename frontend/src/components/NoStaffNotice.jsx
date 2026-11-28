import { useEffect, useState } from "react";

// Explains, in plain words, why a guest request could not go through when nobody is on shift.
// Opened from anywhere with showNoStaffNotice(action) (utils/apiError.js).
const ACTION_TEXT = {
  call: "gọi nhân viên",
  payment: "gửi yêu cầu thanh toán",
  order: "gửi đơn xuống bếp",
};

const NoStaffNotice = () => {
  const [action, setAction] = useState(null);

  useEffect(() => {
    const open = (e) => setAction(e.detail?.action || "call");
    window.addEventListener("app:no-staff-on-shift", open);
    return () => window.removeEventListener("app:no-staff-on-shift", open);
  }, []);

  if (!action) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="no-staff-title"
      aria-describedby="no-staff-desc"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => setAction(null)} />
      <div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl text-center page-enter">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <i className="fa-solid fa-user-clock text-2xl text-amber-700" aria-hidden="true" />
        </div>
        <h2 id="no-staff-title" className="text-lg font-bold text-ink">
          Chưa có nhân viên trong ca
        </h2>
        <p id="no-staff-desc" className="mt-2 text-sm text-ink-muted leading-relaxed">
          Hiện chưa có nhân viên nào đang trực nên chưa thể {ACTION_TEXT[action] || ACTION_TEXT.call}.
          Bạn vui lòng thử lại sau ít phút, hoặc gọi trực tiếp nhân viên gần nhất nhé.
        </p>
        {action === "order" && (
          <p className="mt-2 text-xs text-ink-muted">Các món trong giỏ vẫn được giữ nguyên.</p>
        )}
        <button
          onClick={() => setAction(null)}
          className="mt-6 w-full h-12 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};

export default NoStaffNotice;
