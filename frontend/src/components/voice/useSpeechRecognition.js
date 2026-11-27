import { useCallback, useEffect, useRef, useState } from "react";

const getRecognition = () =>
  typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ERROR_MESSAGES = {
  "not-allowed": "Chưa cho phép dùng micro. Hãy bật quyền micro cho trang này.",
  "service-not-allowed": "Trình duyệt không cho dùng nhận giọng nói.",
  "audio-capture": "Không tìm thấy micro.",
  network: "Nhận giọng nói cần kết nối mạng.",
};

/**
 * Nhận giọng nói bằng Web Speech API (Chrome, Edge, Safari), nghe liên tục cho tới khi stop().
 * Mỗi câu nói xong gọi onFinal(text) đúng một lần; onInterim(text) hiện chữ đang nghe dở.
 * Dùng chế độ một câu mỗi lượt rồi tự nghe lại, vì chế độ continuous trên Chrome Android hay lặp kết quả.
 */
export default function useSpeechRecognition({ lang = "vi-VN", onFinal, onInterim } = {}) {
  const supported = Boolean(getRecognition());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const wantListening = useRef(false);
  const callbacks = useRef({ onFinal, onInterim });
  callbacks.current = { onFinal, onInterim };

  const begin = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition || recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (const result of event.results) {
        const text = result[0].transcript.replace(/\s+/g, " ").trim();
        if (result.isFinal) {
          if (text) callbacks.current.onFinal?.(text);
        } else {
          interim += ` ${text}`;
        }
      }
      callbacks.current.onInterim?.(interim.trim());
    };
    recognition.onerror = (event) => {
      // Im lặng hoặc bị ngắt thì cứ nghe lại; lỗi quyền/thiết bị thì dừng hẳn
      if (["no-speech", "aborted"].includes(event.error)) return;
      wantListening.current = false;
      setError(ERROR_MESSAGES[event.error] || "Nhận giọng nói bị lỗi, thử lại nhé.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      callbacks.current.onInterim?.("");
      if (wantListening.current) begin();
      else setListening(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      wantListening.current = false;
      setListening(false);
      setError("Không bật được micro, thử lại nhé.");
    }
  }, [lang]);

  const start = useCallback(() => {
    wantListening.current = true;
    setError("");
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => {
    wantListening.current = false;
    setListening(false);
    recognitionRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      wantListening.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  return { supported, listening, error, start, stop };
}
