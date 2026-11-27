import React, { useEffect, useRef, useState } from "react";
import { applyVoiceCommand, applyVoiceOp, parseVoiceCommand } from "../../utils/voiceOrder";
import { formatVnd } from "../../utils/reservation";
import useSpeechRecognition from "./useSpeechRecognition";

const dishName = (dish) => dish.name ?? dish.dishName ?? "";
const CONFIRM_SECONDS = 3;
const ACTION_LABEL = { add: "thêm", remove: "bỏ", set: "đổi" };

/**
 * Gọi món bằng giọng nói. Mỗi câu nói là một lệnh: gọi thêm ("hai phở bò"), bỏ ("bỏ phở bò"),
 * bớt ("bớt một trà đá"), đổi số lượng ("phở bò thành ba"), xóa hết ("hủy hết"),
 * và đặt đơn ("xác nhận", "chốt đơn"): đếm ngược vài giây, nói "hủy" hoặc bấm Hủy để dừng.
 * dishes: [{ dishId, name | dishName, price }] là các món đang bán.
 * initialItems: [{ dish, quantity }] món đã chọn sẵn, giọng nói sửa tiếp trên danh sách này.
 * onConfirm(items): đưa món vào giỏ/danh sách; onPlaceOrder(items): đặt đơn luôn.
 * items: [{ dishId, quantity, dish }].
 */
export default function VoiceOrderModal({
  isOpen,
  onClose,
  dishes = [],
  initialItems,
  onConfirm,
  onPlaceOrder,
  confirmLabel = "Thêm vào giỏ",
  placeOrderLabel = "Đặt món luôn",
}) {
  const [draft, setDraft] = useState([]); // [{ dish, quantity }]
  const [pending, setPending] = useState([]); // món nói thiếu tên cần khách chọn
  const [unmatched, setUnmatched] = useState([]);
  const [heard, setHeard] = useState("");
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  // Chỉ lấy danh sách ban đầu lúc mở modal
  const initialItemsRef = useRef(initialItems);
  initialItemsRef.current = initialItems;

  const handleCommand = (text) => {
    if (submitting) return;
    const command = parseVoiceCommand(text, dishes);
    setHeard(text);
    setUnmatched(command.unmatched);
    if (command.cancel) {
      setCountdown(null);
      return;
    }
    const result = applyVoiceCommand(draftRef.current, command);
    draftRef.current = result.draft;
    setDraft(result.draft);
    const cleared = command.ops.some((op) => op.type === "clear");
    setPending((prev) => [...(cleared ? [] : prev), ...result.pending]);
    if (command.ops.length > 0 || result.pending.length > 0) setCountdown(null);
    if (command.confirm && result.draft.length > 0) {
      if (onPlaceOrder) setCountdown(CONFIRM_SECONDS);
      else submit(onConfirm, result.draft);
    }
  };

  const { supported, listening, error, start, stop } = useSpeechRecognition({
    onFinal: handleCommand,
    onInterim: setInterim,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    setDraft(initialItemsRef.current || []);
    setPending([]);
    setUnmatched([]);
    setHeard("");
    setTyped("");
    setCountdown(null);
    setSubmitting(false);
    setSubmitError("");
    if (supported) start();
    return stop;
  }, [isOpen, supported, start, stop]);

  const submit = async (action, items = draftRef.current) => {
    if (!action || items.length === 0) return;
    stop();
    setCountdown(null);
    setSubmitting(true);
    setSubmitError("");
    try {
      await action(items.map((it) => ({ dishId: it.dish.dishId, quantity: it.quantity, dish: it.dish })));
      onClose();
    } catch (err) {
      setSubmitError(err?.message || "Không gửi được, thử lại nhé.");
      setSubmitting(false);
    }
  };

  // Đếm ngược trước khi đặt đơn bằng giọng nói
  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown === 0) {
      submit(onPlaceOrder);
      return undefined;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
    // submit đọc món mới nhất qua ref, không cần chạy lại khi submit đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, onPlaceOrder]);

  const changeQuantity = (dish, delta) => {
    setCountdown(null);
    setDraft((prev) => applyVoiceOp(prev, { type: "add", dish, quantity: delta }));
  };

  const chooseOption = (index, dish) => {
    const amb = pending[index];
    setPending((prev) => prev.filter((_, i) => i !== index));
    setDraft((prev) => applyVoiceOp(prev, { type: amb.type, dish, quantity: amb.quantity }));
  };

  const submitTyped = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    handleCommand(typed.trim());
    setTyped("");
  };

  if (!isOpen) return null;

  const total = draft.reduce((sum, it) => sum + (Number(it.dish.price) || 0) * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[#2B2118]/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-[#FAF7F2] text-[#3A2E22] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-white border-b border-[#F0DEC0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Gọi món bằng giọng nói</h2>
            <p className="text-xs text-[#7D6B55]">
              "hai phở bò" · "bỏ phở bò" · "bớt một trà đá" · "phở bò thành ba" · "xác nhận"
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-full bg-[#F5EFE6] hover:bg-[#EBDCC8] text-[#6E5A44] text-sm"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
            {supported ? (
              <>
                <button
                  type="button"
                  onClick={listening ? stop : start}
                  disabled={submitting}
                  className={`w-20 h-20 rounded-full text-3xl text-white shadow-lg transition ${
                    listening ? "bg-[#DC2626] animate-pulse" : "bg-[#EA580C] hover:bg-[#C2410C]"
                  }`}
                  aria-label={listening ? "Dừng nghe" : "Bắt đầu nói"}
                >
                  🎤
                </button>
                <span className="text-sm text-[#6E5A44] text-center min-h-5">
                  {interim ? `"${interim}"` : listening ? "Đang nghe, cứ nói từng câu..." : "Bấm micro để nói"}
                </span>
              </>
            ) : (
              <p className="text-sm text-center text-[#8A5A14] bg-[#FFF4E0] rounded-xl px-3 py-2">
                Trình duyệt này chưa hỗ trợ nhận giọng nói (hãy dùng Chrome, Edge hoặc Safari). Bạn có thể gõ lệnh
                vào ô bên dưới.
              </p>
            )}
            {heard && <p className="text-xs text-[#8C7A65]">Vừa nghe: "{heard}"</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>

          <form onSubmit={submitTyped} className="flex gap-2">
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Hoặc gõ: hai phở bò, bỏ trà đá..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#EBD4B0] bg-white text-sm focus:outline-none focus:border-[#EA580C]"
            />
            <button type="submit" className="px-3 rounded-xl bg-[#3A2E22] text-white text-sm">
              Gửi
            </button>
          </form>

          {countdown !== null && (
            <div className="flex items-center justify-between gap-3 bg-[#FFF1E6] border border-[#F5C293] rounded-xl px-3 py-2">
              <span className="text-sm font-semibold">Đặt món sau {countdown} giây... nói "hủy" để dừng</span>
              <button
                type="button"
                onClick={() => setCountdown(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#EBD4B0] text-sm font-semibold"
              >
                Hủy
              </button>
            </div>
          )}

          {pending.map((amb, index) => (
            <div key={index} className="bg-white rounded-xl border border-[#F5C293] p-3">
              <p className="text-sm mb-2">
                {amb.type === "add" ? "Thêm" : amb.type === "set" ? "Đổi" : "Bỏ"} "{amb.phrase}"
                {amb.quantity ? ` (${amb.quantity})` : ""} là món nào?
              </p>
              <div className="flex flex-wrap gap-2">
                {amb.options.map((dish) => (
                  <button
                    key={dish.dishId}
                    type="button"
                    onClick={() => chooseOption(index, dish)}
                    className="px-3 py-1.5 rounded-lg border border-[#EBD4B0] bg-[#FFFBF5] hover:bg-[#FFEED8] text-sm"
                    aria-label={`${ACTION_LABEL[amb.type]} ${dishName(dish)}`}
                  >
                    {dishName(dish)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {unmatched.length > 0 && (
            <p className="text-sm text-[#8A5A14] bg-[#FFF4E0] rounded-xl px-3 py-2">
              Chưa tìm thấy trong thực đơn: {unmatched.map((u) => `"${u}"`).join(", ")}
            </p>
          )}

          <div className="space-y-2">
            {draft.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#9E8B75] bg-white rounded-xl border border-dashed border-[#E8D4BA]">
                Chưa có món nào.
              </p>
            ) : (
              draft.map((it) => (
                <div
                  key={it.dish.dishId}
                  className="bg-white p-2.5 rounded-xl border border-[#F2DFC2] flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold truncate">{dishName(it.dish)}</h5>
                    <span className="text-xs text-[#8C7A65]">{formatVnd(it.dish.price)} / phần</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#FAF4ED] border border-[#ECD1B3] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => changeQuantity(it.dish, -1)}
                      className="w-7 h-7 rounded bg-white font-bold"
                      aria-label={`Bớt ${dishName(it.dish)}`}
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(it.dish, 1)}
                      className="w-7 h-7 rounded bg-white font-bold"
                      aria-label={`Thêm ${dishName(it.dish)}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-[#F0DEC0] space-y-2">
          {submitError && <p className="text-sm text-red-700">{submitError}</p>}
          {draft.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Tạm tính</span>
              <span className="font-bold text-[#C85319]">{formatVnd(total)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => submit(onConfirm)}
              disabled={submitting || draft.length === 0}
              className={`flex-1 py-3 rounded-xl font-bold disabled:opacity-50 ${
                onPlaceOrder ? "bg-white border border-[#EA580C] text-[#C2410C]" : "bg-[#EA580C] text-white"
              }`}
            >
              {confirmLabel}
            </button>
            {onPlaceOrder && (
              <button
                type="button"
                onClick={() => submit(onPlaceOrder)}
                disabled={submitting || draft.length === 0}
                className="flex-1 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : placeOrderLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
