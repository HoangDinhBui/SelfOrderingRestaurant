import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "../../config";

const MAX_RECORD_MS = 15000;
const MIN_RECORD_MS = 600;

// Chrome/Android record webm, Safari/iOS records mp4
const MIME_TYPES = [
  { type: "audio/webm;codecs=opus", ext: "webm" },
  { type: "audio/webm", ext: "webm" },
  { type: "audio/mp4", ext: "mp4" },
  { type: "audio/ogg;codecs=opus", ext: "ogg" },
];

const isSupported = () =>
  typeof window !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window.MediaRecorder !== "undefined";

const pickMimeType = () =>
  MIME_TYPES.find((m) => window.MediaRecorder.isTypeSupported?.(m.type)) || {
    type: "",
    ext: "webm",
  };

const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString("vi-VN")}đ`;

/**
 * Nút micro nổi trên trang Menu: giữ để nói, thả ra để gửi.
 * Kết quả chỉ là đề xuất; khách sửa/xác nhận rồi mới gọi onAddItem cho từng món.
 */
const VoiceOrderButton = ({ onAddItem, onAdded }) => {
  // idle | starting | recording | processing | review
  const [phase, setPhase] = useState("idle");
  const [hint, setHint] = useState("");
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const holdingRef = useRef(false);
  const timerRef = useRef(null);
  const mimeRef = useRef(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      stopStream();
    },
    []
  );

  if (!isSupported()) return null;

  const showHint = (text) => {
    setHint(text);
    setTimeout(() => setHint(""), 3500);
  };

  const startRecording = async () => {
    if (phase !== "idle") return;
    holdingRef.current = true;
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holdingRef.current) {
        // Released while the permission prompt was open: just keep the permission
        stream.getTracks().forEach((t) => t.stop());
        setPhase("idle");
        showHint("Đã bật micro. Giữ nút và nói món bạn muốn gọi.");
        return;
      }
      streamRef.current = stream;
      mimeRef.current = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeRef.current.type ? { mimeType: mimeRef.current.type } : undefined
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStopped;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setPhase("recording");
      timerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (err) {
      console.error("Microphone error:", err);
      setPhase("idle");
      showHint(
        err?.name === "NotAllowedError"
          ? "Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này."
          : "Không mở được micro trên thiết bị này."
      );
    }
  };

  const stopRecording = () => {
    holdingRef.current = false;
    clearTimeout(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") recorder.stop();
  };

  const handleStopped = async () => {
    stopStream();
    const duration = Date.now() - startedAtRef.current;
    const { type, ext } = mimeRef.current;
    const blob = new Blob(chunksRef.current, { type: type || "audio/webm" });
    recorderRef.current = null;

    if (duration < MIN_RECORD_MS || blob.size === 0) {
      setPhase("idle");
      showHint("Giữ nút lâu hơn một chút trong lúc nói nhé.");
      return;
    }

    setPhase("processing");
    try {
      const form = new FormData();
      form.append("audio", blob, `voice.${ext}`);
      const res = await fetch(`${BACKEND_URL}/api/voice-order`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Không xử lý được giọng nói, vui lòng thử lại.");
      }
      if (!data.items?.length && !data.unmatched?.length) {
        setPhase("idle");
        showHint(
          data.transcript
            ? `Chưa nhận ra món nào trong: "${data.transcript}"`
            : "Không nghe rõ, bạn nói lại giúp nhé."
        );
        return;
      }
      setResult({ ...data, items: data.items.map((it, i) => ({ ...it, key: i })) });
      setPhase("review");
    } catch (err) {
      console.error("Voice order error:", err);
      setPhase("idle");
      showHint(err.message);
    }
  };

  const changeQuantity = (key, delta) =>
    setResult((r) => ({
      ...r,
      items: r.items.map((it) =>
        it.key === key
          ? { ...it, quantity: Math.min(20, Math.max(1, it.quantity + delta)) }
          : it
      ),
    }));

  const removeItem = (key) =>
    setResult((r) => ({ ...r, items: r.items.filter((it) => it.key !== key) }));

  const closeReview = () => {
    setResult(null);
    setPhase("idle");
  };

  const confirm = async () => {
    setAdding(true);
    let added = 0;
    try {
      // One at a time: parallel GraphQL mutations race on the same server-side cart
      for (const it of result.items) {
        await onAddItem({
          dishId: it.dishId,
          quantity: it.quantity,
          notes: it.notes || "",
          dishName: it.dishName,
          price: it.price,
        });
        added += it.quantity;
      }
      closeReview();
      onAdded?.(added);
    } catch (err) {
      console.error("Error adding voice order to cart:", err);
      showHint("Có món chưa thêm được vào giỏ, bạn kiểm tra lại giỏ hàng nhé.");
    } finally {
      setAdding(false);
    }
  };

  const total = result?.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0) || 0;
  const recording = phase === "recording";

  return (
    <>
      {hint && (
        <div className="fixed bottom-24 right-4 left-4 max-w-md mx-auto z-40 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg text-center">
          {hint}
        </div>
      )}

      {(recording || phase === "processing") && (
        <div className="fixed bottom-24 right-4 z-40 bg-white text-gray-800 text-sm px-4 py-2 rounded-lg shadow-lg">
          {recording ? "Đang nghe… thả tay để gửi" : "Đang nhận món…"}
        </div>
      )}

      <button
        type="button"
        aria-label="Giữ để gọi món bằng giọng nói"
        title="Giữ để gọi món bằng giọng nói"
        disabled={phase === "processing" || phase === "review"}
        onPointerDown={(e) => {
          e.preventDefault();
          startRecording();
        }}
        onPointerUp={stopRecording}
        onPointerLeave={() => holdingRef.current && stopRecording()}
        onPointerCancel={stopRecording}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none" }}
        className={`fixed bottom-6 right-4 z-40 w-16 h-16 rounded-full shadow-xl flex items-center justify-center select-none transition-transform ${
          recording ? "bg-red-500 scale-110 animate-pulse" : "bg-orange-500"
        } ${phase === "processing" ? "opacity-60" : ""}`}
      >
        {phase === "processing" ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
          </svg>
        )}
      </button>

      {phase === "review" && result && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Xác nhận món</h2>
            <p className="text-sm text-gray-500 mb-3">Bạn nói: “{result.transcript}”</p>

            <ul className="divide-y">
              {result.items.map((it) => (
                <li key={it.key} className="py-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{it.dishName}</p>
                    {it.notes && <p className="text-xs text-orange-600">Ghi chú: {it.notes}</p>}
                    <p className="text-xs text-gray-500">{formatPrice(it.price)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Giảm"
                    onClick={() => changeQuantity(it.key, -1)}
                    className="w-7 h-7 rounded-full bg-gray-200 text-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{it.quantity}</span>
                  <button
                    type="button"
                    aria-label="Tăng"
                    onClick={() => changeQuantity(it.key, 1)}
                    className="w-7 h-7 rounded-full bg-gray-200 text-sm"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="Xoá món"
                    onClick={() => removeItem(it.key)}
                    className="ml-1 text-gray-400 hover:text-red-500 text-lg"
                  >
                    ×
                  </button>
                </li>
              ))}
              {result.unmatched?.map((phrase, i) => (
                <li key={`u-${i}`} className="py-2 text-sm text-gray-400">
                  Không tìm thấy trong thực đơn: {phrase}
                </li>
              ))}
            </ul>

            {result.items.length > 0 && (
              <p className="text-right text-sm font-semibold mt-2">Tạm tính: {formatPrice(total)}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={closeReview}
                disabled={adding}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm"
              >
                Nói lại
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={adding || result.items.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {adding ? "Đang thêm…" : "Thêm vào giỏ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceOrderButton;
