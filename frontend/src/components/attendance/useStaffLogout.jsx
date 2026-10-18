import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../../axiosConfig";
import FaceScanner from "./FaceScanner";
import { formatAttendanceResult } from "./attendanceMessages";
import { getTodayAttendance } from "../../services/attendanceAPI";

const SESSION_KEYS = ["accessToken", "refreshToken", "username", "userType", "staffId"];

/** Đăng xuất; với STAFF đang check-in thì mở modal check-out bằng khuôn mặt trước. */
export default function useStaffLogout() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const finishLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // vẫn xoá phiên phía client dù server lỗi
    }
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  }, [navigate]);

  const requestLogout = useCallback(async () => {
    if (localStorage.getItem("userType") === "STAFF") {
      try {
        const today = await getTodayAttendance();
        if (today.status === "CHECKED_IN") {
          setScanning(true);
          return;
        }
      } catch {
        // không lấy được trạng thái → đăng xuất luôn
      }
    }
    await finishLogout();
  }, [finishLogout]);

  const handleCheckedOut = useCallback(
    (result) => {
      toast.success(formatAttendanceResult(result));
      setTimeout(() => {
        setScanning(false);
        finishLogout();
      }, 1500);
    },
    [finishLogout]
  );

  const logoutModal = scanning ? (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
      <FaceScanner mode="CHECK_OUT" onSuccess={handleCheckedOut} onCancel={() => setScanning(false)} />
    </div>
  ) : null;

  return { requestLogout, logoutModal };
}
