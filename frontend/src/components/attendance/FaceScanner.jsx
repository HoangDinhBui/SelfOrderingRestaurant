import { useCallback, useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { manualAttendance, scanAttendance } from "../../services/attendanceAPI";
import { describeAttendanceError, formatAttendanceResult } from "./attendanceMessages";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const MAX_ATTEMPTS = 3;
const STABLE_MS = 500;
const MIN_CONFIDENCE = 0.8;
const MIN_FACE_RATIO = 0.2;
const RETRY_DELAY_MS = 1500;
const MAX_CAPTURE_WIDTH = 640;

// Trạng thái: INIT | SEARCHING | VERIFYING | SUCCESS | RETRY | FAILED
const HINTS = {
  INIT: "Đang bật camera…",
  SEARCHING: "Đưa khuôn mặt vào khung",
  VERIFYING: "Đang xác thực…",
};

function isFaceReady(detections, videoWidth) {
  if (detections.length !== 1) return false;
  const d = detections[0];
  const score = d.categories?.[0]?.score ?? 0;
  return score >= MIN_CONFIDENCE && d.boundingBox.width / videoWidth >= MIN_FACE_RATIO;
}

export default function FaceScanner({ mode, onSuccess, onCancel }) {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(null);
  const busyRef = useRef(false);
  const stateRef = useRef("INIT");
  const attemptsRef = useRef(0);
  const [state, setStateValue] = useState("INIT");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [detectorFailed, setDetectorFailed] = useState(false);
  const [reason, setReason] = useState("");

  const setState = useCallback((s) => {
    stateRef.current = s;
    setStateValue(s);
  }, []);

  const finish = useCallback(
    (result) => {
      setState("SUCCESS");
      setMessage(formatAttendanceResult(result));
      onSuccess(result);
    },
    [onSuccess, setState]
  );

  const handleError = useCallback(
    (error) => {
      const { message: msg, kind } = describeAttendanceError(error);
      if (kind === "done") {
        finish({ alreadyDone: true, message: msg });
        return;
      }
      if (kind === "fatal") {
        setMessage(msg);
        setState("FAILED");
        return;
      }
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      setMessage(msg);
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setState("FAILED");
        return;
      }
      setState("RETRY");
      setTimeout(() => {
        stableSinceRef.current = null;
        if (stateRef.current === "RETRY") setState("SEARCHING");
      }, RETRY_DELAY_MS);
    },
    [finish, setState]
  );

  const captureAndVerify = useCallback(async () => {
    const video = videoRef.current;
    if (busyRef.current || !video || !video.videoWidth) return;
    busyRef.current = true;
    setState("VERIFYING");
    try {
      // Thu nhỏ ảnh (tối đa 640px chiều rộng) để không vượt giới hạn multipart 1MB của backend
      const scale = Math.min(1, MAX_CAPTURE_WIDTH / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const result = await scanAttendance(mode, blob);
      finish(result);
    } catch (error) {
      handleError(error);
    } finally {
      busyRef.current = false;
    }
  }, [mode, finish, handleError, setState]);

  // Bật camera + nạp detector
  useEffect(() => {
    let cancelled = false;
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        if (!cancelled) {
          setMessage("Không truy cập được camera");
          setState("FAILED");
        }
        return;
      }
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
        if (cancelled) {
          detector.close();
          return;
        }
        detectorRef.current = detector;
      } catch {
        if (!cancelled) setDetectorFailed(true); // vẫn cho chụp bằng nút
      }
      if (!cancelled && stateRef.current === "INIT") setState("SEARCHING");
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, [setState]);

  // Vòng lặp phát hiện khuôn mặt
  useEffect(() => {
    if (state !== "SEARCHING" || detectorFailed) return;
    let frame;
    const loop = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (video && detector && video.readyState >= 2 && !busyRef.current) {
        const { detections } = detector.detectForVideo(video, performance.now());
        if (isFaceReady(detections, video.videoWidth)) {
          stableSinceRef.current ??= performance.now();
          if (performance.now() - stableSinceRef.current >= STABLE_MS) {
            captureAndVerify();
            return;
          }
        } else {
          stableSinceRef.current = null;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state, detectorFailed, captureAndVerify]);

  const submitManual = async () => {
    if (!reason.trim() || busyRef.current) return;
    busyRef.current = true;
    try {
      finish(await manualAttendance(mode, reason.trim()));
    } catch (error) {
      const { message: msg, kind } = describeAttendanceError(error);
      if (kind === "done") finish({ alreadyDone: true, message: msg });
      else setMessage(msg);
    } finally {
      busyRef.current = false;
    }
  };

  const title = mode === "CHECK_IN" ? "Check-in" : "Check-out";
  const ringColor =
    state === "SUCCESS" ? "border-green-400" : state === "RETRY" || state === "FAILED" ? "border-red-400" : "border-white/80";

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 p-4 rounded-3xl bg-black/60 backdrop-blur text-white shadow-2xl">
      <h2 className="text-2xl font-semibold">{title} bằng khuôn mặt</h2>

      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-3/5 aspect-[3/4] rounded-[50%] border-4 transition-colors ${ringColor} ${
              state === "VERIFYING" ? "animate-pulse" : ""
            }`}
          />
        </div>
        {state === "SUCCESS" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-600/40 text-6xl">✓</div>
        )}
      </div>

      <p className="text-center min-h-[3rem]" aria-live="polite">
        {state === "SUCCESS" || state === "RETRY" || state === "FAILED" ? message : HINTS[state]}
        {state === "RETRY" && ` (lần ${attempts}/${MAX_ATTEMPTS})`}
      </p>

      {detectorFailed && state === "SEARCHING" && (
        <button
          type="button"
          onClick={captureAndVerify}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium"
        >
          Chụp ảnh
        </button>
      )}

      {state === "FAILED" && (
        <div className="w-full flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 255))}
            placeholder="Lý do chấm công thủ công (bắt buộc)"
            rows={2}
            className="w-full rounded-xl p-3 text-black"
          />
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={submitManual}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-medium"
          >
            Chấm công thủ công
          </button>
        </div>
      )}

      {onCancel && state !== "SUCCESS" && (
        <button type="button" onClick={onCancel} className="text-sm text-white/70 underline">
          Huỷ
        </button>
      )}
    </div>
  );
}
