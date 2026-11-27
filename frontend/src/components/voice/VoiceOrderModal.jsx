import React, { useEffect, useMemo, useRef, useState } from "react";
import { parseVoiceOrder } from "../../utils/voiceOrder";
import { formatVnd } from "../../utils/reservation";
import useSpeechRecognition from "./useSpeechRecognition";

const dishName = (dish) => dish.name ?? dish.dishName ?? "";

/**
 * Gọi món bằng giọng nói: nghe (hoặc gõ) câu gọi món, hiện danh sách món hiểu được để sửa,
 * rồi mới gửi qua onConfirm([{ dishId, quantity, dish }]). Không bao giờ tự đặt món.
 * dishes: [{ dishId, name | dishName, price }] là các món đang bán.
 */
export default function VoiceOrderModal({ isOpen, onClose, dishes = [], onConfirm, confirmLabel = "Thêm vào giỏ" }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState([]); // [{ dish, quantity }]
  const [resolved, setResolved] = useState({}); // chỉ số món mơ hồ đã chọn xong
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const baseText = useRef("");

  const { supported, listening, error, start, stop } = useSpeechRecognition({
    onText: (spoken) => setText(`${baseText.current} ${spoken}`.trim()),
  });

  const startListening = () => {
    baseText.current = text;
    start();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    setText("");
    setSubmitting(false);
    setSubmitError("");
    baseText.current = "";
    if (supported) start();
    return stop;
  }, [isOpen, supported, start, stop]);

  const parsed = useMemo(() => parseVoiceOrder(text, dishes), [text, dishes]);

  // Mỗi lần câu nói thay đổi thì tính lại danh sách món từ đầu
  useEffect(() => {
    setDraft(parsed.items.map((item) => ({ dish: dishes.find((d) => d.dishId === item.dishId), quantity: item.quantity })));
    setResolved({});
  }, [parsed, dishes]);

  const changeQuantity = (dishId, delta) =>
    setDraft((prev) =>
      prev
        .map((it) => (it.dish.dishId === dishId ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0),
    );

  const chooseOption = (index, dish, quantity) => {
    setResolved((prev) => ({ ...prev, [index]: true }));
    setDraft((prev) =>
      prev.some((it) => it.dish.dishId === dish.dishId)
        ? prev.map((it) => (it.dish.dishId === dish.dishId ? { ...it, quantity: it.quantity + quantity } : it))
        : [...prev, { dish, quantity }],
    );
  };

  const handleConfirm = async () => {
    if (submitting || draft.length === 0) return;
    stop();
    setSubmitting(true);
    setSubmitError("");
    try {
      await onConfirm(draft.map((it) => ({ dishId: it.dish.dishId, quantity: it.quantity, dish: it.dish })));
      onClose();
    } catch (err) {
      setSubmitError(err?.message || "Không thêm được món, thử lại nhé.");
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const pendingChoices = parsed.ambiguous.filter((_, index) => !resolved[index]).length;
  const total = draft.reduce((sum, it) => sum + (Number(it.dish.price) || 0) * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[#2B2118]/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-[#FAF7F2] text-[#3A2E22] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-white border-b border-[#F0DEC0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Gọi món bằng giọng nói</h2>
            <p className="text-xs text-[#7D6B55]">Ví dụ: "cho hai phở bò với một ly trà đá"</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#EBDCC8] text-[#6E5A44] text-sm"
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
                  onClick={listening ? stop : startListening}
                  className={`w-20 h-20 rounded-full text-3xl text-white shadow-lg transition ${
                    listening ? "bg-[#DC2626] animate-pulse" : "bg-[#EA580C] hover:bg-[#C2410C]"
                  }`}
                  aria-label={listening ? "Dừng nghe" : "Bắt đầu nói"}
                >
                  🎤
                </button>
                <span className="text-sm text-[#6E5A44]">
                  {listening ? "Đang nghe... nói xong bấm để dừng" : "Bấm micro để nói"}
                </span>
              </>
            ) : (
              <p className="text-sm text-center text-[#8A5A14] bg-[#FFF4E0] rounded-xl px-3 py-2">
                Trình duyệt này chưa hỗ trợ nhận giọng nói (hãy dùng Chrome, Edge hoặc Safari). Bạn có thể gõ món vào
                ô bên dưới.
              </p>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Câu gọi món sẽ hiện ở đây, bạn có thể sửa lại"
            className="w-full px-3 py-2 rounded-xl border border-[#EBD4B0] bg-white text-sm focus:outline-none focus:border-[#EA580C]"
          />

          {parsed.ambiguous.map((amb, index) =>
            resolved[index] ? null : (
              <div key={index} className="bg-white rounded-xl border border-[#F5C293] p-3">
                <p className="text-sm mb-2">
                  "{amb.phrase}" (x{amb.quantity}) là món nào?
                </p>
                <div className="flex flex-wrap gap-2">
                  {amb.options.map((dish) => (
                    <button
                      key={dish.dishId}
                      type="button"
                      onClick={() => chooseOption(index, dish, amb.quantity)}
                      className="px-3 py-1.5 rounded-lg border border-[#EBD4B0] bg-[#FFFBF5] hover:bg-[#FFEED8] text-sm"
                    >
                      {dishName(dish)}
                    </button>
                  ))}
                </div>
              </div>
            ),
          )}

          {parsed.unmatched.length > 0 && (
            <p className="text-sm text-[#8A5A14] bg-[#FFF4E0] rounded-xl px-3 py-2">
              Chưa tìm thấy trong thực đơn: {parsed.unmatched.map((u) => `"${u}"`).join(", ")}
            </p>
          )}

          <div className="space-y-2">
            {draft.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#9E8B75] bg-white rounded-xl border border-dashed border-[#E8D4BA]">
                Chưa nhận được món nào.
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
                      onClick={() => changeQuantity(it.dish.dishId, -1)}
                      className="w-7 h-7 rounded bg-white font-bold"
                      aria-label={`Bớt ${dishName(it.dish)}`}
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(it.dish.dishId, 1)}
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
          {pendingChoices > 0 && (
            <p className="text-xs text-[#8A5A14]">Còn {pendingChoices} món cần chọn rõ ở trên.</p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || draft.length === 0}
            className="w-full py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold disabled:opacity-50"
          >
            {submitting ? "Đang thêm..." : `${confirmLabel} (${formatVnd(total)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
