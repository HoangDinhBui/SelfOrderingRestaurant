import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReservationForm from "./ReservationForm";
import {
  cancelReservation,
  changeReservationTable,
  checkInReservation,
  confirmReservation,
  createManualReservation,
  errorMessage,
  getMenuDishes,
  listReservations,
  rejectReservation,
} from "../../services/reservationAPI";
import {
  RESERVATION_STATUS_LABEL,
  formatReservationTime,
  formatVnd,
  normalizeDish,
  toLocalDateString,
} from "../../utils/reservation";

const TABS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "done", label: "Đã xử lý" },
];

const STATUS_STYLE = {
  SCHEDULED: "bg-[#FFF5E8] text-[#A65B00]",
  CONFIRMED: "bg-[#E8F7EF] text-[#047857]",
  CANCELLED: "bg-slate-100 text-ink-muted",
};

/**
 * Quản lý lịch hẹn dùng chung cho Admin và Staff.
 * tables: [{ tableNumber, capacity }]; onChanged() để trang cha làm mới bàn/đơn sau khi nhận khách.
 * refreshKey: đổi giá trị để buộc tải lại (ví dụ khi WebSocket báo có lịch hẹn mới).
 */
export default function ReservationManager({ isOpen, onClose, tables = [], onChanged, refreshKey }) {
  const [tab, setTab] = useState("pending");
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState([]);
  const [ofDay, setOfDay] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { reservation, kind: "reject" | "cancel" }
  const [moving, setMoving] = useState(null); // { reservation, tableId }
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduled, dayList] = await Promise.all([
        listReservations({ status: "SCHEDULED" }),
        listReservations({ date }),
      ]);
      setPending(scheduled);
      setOfDay(dayList);
    } catch (err) {
      showToast(errorMessage(err, "Không tải được danh sách lịch hẹn."), true);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load, refreshKey]);

  useEffect(() => {
    if (isOpen && dishes.length === 0) {
      getMenuDishes()
        .then((list) => setDishes((list || []).map(normalizeDish)))
        .catch(() => setDishes([]));
    }
  }, [isOpen, dishes.length]);

  const visible = useMemo(() => {
    const source =
      tab === "pending"
        ? pending
        : tab === "confirmed"
          ? ofDay.filter((r) => r.status === "CONFIRMED")
          : ofDay.filter((r) => !["SCHEDULED", "CONFIRMED"].includes(r.status));
    const q = search.trim().toLowerCase();
    return q
      ? source.filter((r) => `${r.customerName} ${r.contactPhone} ${r.orderId}`.toLowerCase().includes(q))
      : source;
  }, [tab, pending, ofDay, search]);

  if (!isOpen) return null;

  const run = async (reservation, action, successMessage, notifyParent = false) => {
    setBusyId(reservation.orderId);
    try {
      await action(reservation.orderId);
      showToast(successMessage);
      await load();
      if (notifyParent) onChanged?.();
    } catch (err) {
      showToast(errorMessage(err), true);
    } finally {
      setBusyId(null);
    }
  };

  const submitManual = async (body) => {
    setFormSubmitting(true);
    setFormError("");
    try {
      const created = await createManualReservation(body);
      showToast(`Đã lưu lịch hẹn #${created.orderId}.`);
      setShowForm(false);
      setFormKey((k) => k + 1);
      setDate(body.reservationTime.slice(0, 10));
      setTab("confirmed");
      await load();
    } catch (err) {
      setFormError(errorMessage(err, "Không lưu được lịch hẹn."));
    } finally {
      setFormSubmitting(false);
    }
  };

  const submitMove = async () => {
    const { reservation, tableId } = moving;
    if (!tableId) return;
    setMoving(null);
    await run(
      reservation,
      (id) => changeReservationTable(id, Number(tableId)),
      `Đã chuyển lịch hẹn #${reservation.orderId} sang bàn ${tableId}.`,
      true,
    );
  };

  const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50";

  const actionsFor = (r) => {
    const busy = busyId === r.orderId;
    const moveBtn = (
      <button
        key="move"
        disabled={busy}
        onClick={() => setMoving({ reservation: r, tableId: "" })}
        className={`${btn} bg-white text-ink-muted border border-line hover:bg-slate-50`}
      >
        Đổi bàn
      </button>
    );
    if (r.status === "SCHEDULED") {
      return [
        moveBtn,
        <button
          key="reject"
          disabled={busy}
          onClick={() => setConfirmAction({ reservation: r, kind: "reject" })}
          className={`${btn} text-ink-muted hover:bg-slate-100`}
        >
          Từ chối
        </button>,
        <button
          key="confirm"
          disabled={busy}
          onClick={() => run(r, confirmReservation, `Đã xác nhận lịch hẹn #${r.orderId}.`)}
          className={`${btn} bg-[#E89255] text-white hover:bg-[#D9783A]`}
        >
          Chấp nhận
        </button>,
      ];
    }
    if (r.status === "CONFIRMED") {
      return [
        moveBtn,
        <button
          key="cancel"
          disabled={busy}
          onClick={() => setConfirmAction({ reservation: r, kind: "cancel" })}
          className={`${btn} text-ink-muted hover:bg-slate-100`}
        >
          Hủy
        </button>,
        <button
          key="checkin"
          disabled={busy}
          onClick={() =>
            run(r, checkInReservation, `Đã nhận khách bàn ${r.tableNumber}, món đặt trước đã chuyển xuống bếp.`, true)
          }
          className={`${btn} bg-brand text-white hover:bg-[#9a2c0f]`}
        >
          Khách đã đến
        </button>,
      ];
    }
    return [];
  };

  const movableTables = moving
    ? tables.filter(
        (t) => (t.capacity || 0) >= (moving.reservation.guestCount || 1) && t.tableNumber !== moving.reservation.tableNumber,
      )
    : [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-sm sm:p-5">
      <div className="relative flex max-h-[96vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-[#EEF4FD] px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Quản lý lịch hẹn</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-[#E89255] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#D9783A]"
            >
              {showForm ? "Đóng form" : "＋ Đặt bàn thủ công"}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-muted hover:bg-slate-100"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </header>

        <nav className="flex gap-6 border-b border-slate-100 bg-[#EEF4FD] px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-1 pb-3 pt-1 text-sm font-semibold ${
                tab === t.key ? "border-[#B73512] text-brand" : "border-transparent text-ink-muted"
              }`}
            >
              {t.label}
              {t.key === "pending" && pending.length > 0 && (
                <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className={`grid grid-cols-1 items-start gap-4 ${showForm ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]" : ""}`}>
            <section className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, SĐT, mã lịch hẹn..."
                  className="w-full max-w-[260px] rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
                {tab !== "pending" && (
                  <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-ink-muted">
                    Ngày
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value || toLocalDateString(new Date()))}
                      className="bg-transparent text-xs outline-none"
                    />
                  </label>
                )}
                <button onClick={load} className="ml-auto text-xs text-ink-muted hover:text-brand">
                  ↻ Làm mới
                </button>
              </div>

              {loading && visible.length === 0 ? (
                <p className="p-8 text-center text-sm text-ink-muted">Đang tải...</p>
              ) : visible.length === 0 ? (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-ink-muted">
                  {tab === "pending" ? "Không có yêu cầu nào cần duyệt." : "Không có lịch hẹn trong ngày này."}
                </p>
              ) : (
                <div className="space-y-3">
                  {visible.map((r) => (
                    <article key={r.orderId} className="rounded-xl border border-line bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <strong className="text-slate-900">{r.customerName}</strong>
                          {r.contactPhone && (
                            <a href={`tel:${r.contactPhone}`} className="text-ink-muted hover:text-brand">
                              {r.contactPhone}
                            </a>
                          )}
                          <span className="text-xs text-slate-400">#{r.orderId}</span>
                        </div>
                        <span
                          className={`rounded px-2 py-1 text-[11px] font-semibold ${
                            STATUS_STYLE[r.status] || "bg-[#EEF3FA] text-ink-muted"
                          }`}
                        >
                          {RESERVATION_STATUS_LABEL[r.status] || r.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink-muted sm:grid-cols-4">
                        <span className="font-semibold text-brand">{formatReservationTime(r.reservationTime)}</span>
                        <span>• Bàn {r.tableNumber}</span>
                        <span>• {r.guestCount ?? "?"} khách</span>
                        <span>• {r.items?.length ? formatVnd(r.totalAmount) : "Chưa đặt món"}</span>
                      </div>
                      {r.items?.length > 0 && (
                        <p className="mt-2 text-xs text-ink-muted">
                          {r.items.map((i) => `${i.dishName} x${i.quantity}`).join(", ")}
                        </p>
                      )}
                      {r.notes && (
                        <p className="mt-2 rounded-lg bg-[#F7FAFE] px-2.5 py-2 text-xs text-ink-muted">
                          Ghi chú: {r.notes}
                        </p>
                      )}
                      {actionsFor(r).length > 0 && (
                        <div className="mt-2 flex flex-wrap justify-end gap-2">{actionsFor(r)}</div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {showForm && (
              <aside className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <h3 className="mb-3 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
                  Đặt bàn thủ công
                  <span className="block text-xs font-normal text-ink-muted">
                    Lịch hẹn do nhân viên nhập được xác nhận ngay.
                  </span>
                </h3>
                <ReservationForm
                  key={formKey}
                  tables={tables}
                  dishes={dishes}
                  submitting={formSubmitting}
                  error={formError}
                  submitLabel="Lưu lịch hẹn"
                  onSubmit={submitManual}
                />
              </aside>
            )}
          </div>
        </div>

        {confirmAction && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <p className="text-base font-semibold text-slate-900">
                {confirmAction.kind === "reject" ? "Từ chối" : "Hủy"} lịch hẹn #{confirmAction.reservation.orderId}?
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {confirmAction.reservation.customerName} · {formatReservationTime(confirmAction.reservation.reservationTime)}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmAction(null)} className={`${btn} text-ink-muted hover:bg-slate-100`}>
                  Không
                </button>
                <button
                  onClick={() => {
                    const { reservation, kind } = confirmAction;
                    setConfirmAction(null);
                    run(
                      reservation,
                      kind === "reject" ? rejectReservation : cancelReservation,
                      kind === "reject"
                        ? `Đã từ chối lịch hẹn #${reservation.orderId}.`
                        : `Đã hủy lịch hẹn #${reservation.orderId}.`,
                    );
                  }}
                  className={`${btn} bg-brand text-white`}
                >
                  {confirmAction.kind === "reject" ? "Từ chối" : "Hủy lịch hẹn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {moving && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <p className="text-base font-semibold text-slate-900">
                Đổi bàn cho lịch hẹn #{moving.reservation.orderId}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Hiện tại: bàn {moving.reservation.tableNumber} · {moving.reservation.guestCount ?? "?"} khách
              </p>
              <select
                value={moving.tableId}
                onChange={(e) => setMoving({ ...moving, tableId: e.target.value })}
                className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              >
                <option value="">-- Chọn bàn --</option>
                {movableTables.map((t) => (
                  <option key={t.tableNumber} value={t.tableNumber}>
                    Bàn {t.tableNumber} ({t.capacity} chỗ)
                  </option>
                ))}
              </select>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setMoving(null)} className={`${btn} text-ink-muted hover:bg-slate-100`}>
                  Hủy
                </button>
                <button
                  disabled={!moving.tableId}
                  onClick={submitMove}
                  className={`${btn} bg-brand text-white`}
                >
                  Đổi bàn
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
              toast.isError ? "bg-red-600" : "bg-slate-900"
            }`}
            role="status"
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
