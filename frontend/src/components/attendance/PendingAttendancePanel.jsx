import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPendingAttendance, reviewAttendance } from "../../services/attendanceAPI";
import { describeAttendanceError } from "./attendanceMessages";

const fmt = (iso) => (iso ? `${iso.substring(8, 10)}/${iso.substring(5, 7)} ${iso.substring(11, 16)}` : "—");

export default function PendingAttendancePanel() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    getPendingAttendance()
      .then(setItems)
      .catch((e) => toast.error(describeAttendanceError(e).message));
  }, []);

  useEffect(load, [load]);

  const review = async (id, approved) => {
    setBusyId(id);
    try {
      await reviewAttendance(id, approved);
      toast.success(approved ? "Đã duyệt" : "Đã từ chối");
      setItems((prev) => prev.filter((i) => i.attendanceId !== id));
    } catch (e) {
      toast.error(describeAttendanceError(e).message);
      load();
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-amber-800">Chấm công chờ duyệt ({items.length})</h2>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li
            key={i.attendanceId}
            className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <div className="font-medium">{i.staffName}</div>
              <div className="text-gray-600">
                Vào {fmt(i.checkInTime)} · Ra {fmt(i.checkOutTime)}
                {i.workingHours != null && ` · ${i.workingHours}h`}
              </div>
              <div className="italic text-gray-500">“{i.reason}”</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === i.attendanceId}
                onClick={() => review(i.attendanceId, true)}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Duyệt
              </button>
              <button
                type="button"
                disabled={busyId === i.attendanceId}
                onClick={() => review(i.attendanceId, false)}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
