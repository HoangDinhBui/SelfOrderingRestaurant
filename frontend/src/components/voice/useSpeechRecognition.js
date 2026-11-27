import { useCallback, useEffect, useRef, useState } from "react";

const getRecognition = () =>
  typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ERROR_MESSAGES = {
  "not-allowed": "Chưa cho phép dùng micro. Hãy bật quyền micro cho trang này.",
  "service-not-allowed": "Trình duyệt không cho dùng nhận giọng nói.",
  "no-speech": "Không nghe thấy gì, bạn thử nói lại nhé.",
  "audio-capture": "Không tìm thấy micro.",
  network: "Nhận giọng nói cần kết nối mạng.",
};

/**
 * Nhận giọng nói bằng Web Speech API (Chrome, Edge, Safari). onText(text) được gọi mỗi khi có chữ mới
 * trong lượt nghe hiện tại; text là toàn bộ câu của lượt đó.
 */
export default function useSpeechRecognition({ lang = "vi-VN", onText } = {}) {
  const supported = Boolean(getRecognition());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition || recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      // Ghép lại toàn bộ kết quả của lượt nghe, tránh lặp chữ trên Chrome Android
      const text = Array.from(event.results, (r) => r[0].transcript).join(" ");
      onTextRef.current?.(text.replace(/\s+/g, " ").trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(ERROR_MESSAGES[event.error] || "Nhận giọng nói bị lỗi, thử lại nhé.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError("Không bật được micro, thử lại nhé.");
    }
  }, [lang]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, error, start, stop };
}
