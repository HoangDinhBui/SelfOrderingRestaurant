import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FaceScanner from "../../../components/attendance/FaceScanner";
import { formatAttendanceResult } from "../../../components/attendance/attendanceMessages";
import { getTodayAttendance } from "../../../services/attendanceAPI";

const STAFF_HOME = "/table-management_staff";

const Attendance = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }
    if (userType === "ADMIN") {
      navigate("/table-management_admin", { replace: true });
      return;
    }
    getTodayAttendance()
      .then((today) => {
        if (today.status === "NONE") setReady(true);
        else navigate(STAFF_HOME, { replace: true });
      })
      .catch(() => setReady(true));
  }, [navigate]);

  const handleSuccess = useCallback(
    (result) => {
      toast.success(formatAttendanceResult(result));
      setTimeout(() => navigate(STAFF_HOME, { replace: true }), 1500);
    },
    [navigate]
  );

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.pinimg.com/736x/94/95/3b/94953b87c421ef358cad42c358876403.jpg')" }}
    >
      {ready ? (
        <FaceScanner mode="CHECK_IN" onSuccess={handleSuccess} />
      ) : (
        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
      )}
    </div>
  );
};

export default Attendance;
