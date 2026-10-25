import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import MenuBar from "../../../components/layout/MenuBar";
import { authAPI } from "../../../services/api";

const MAX_STAFF_PER_SHIFT = 3;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local calendar dates only: toISOString() would shift the day for UTC+7
const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfWeek = (d) => {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const addDays = (d, n) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

const hhmm = (time) => (time || "").slice(0, 5);

const errorMessage = (error, fallback) =>
  error.response?.data?.message ||
  (typeof error.response?.data === "string" ? error.response.data : null) ||
  fallback;

const emptyShiftForm = { shiftId: null, name: "", startTime: "", endTime: "" };

const ShiftSchedule = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // { date, shift } while the assign dialog is open
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [shiftForm, setShiftForm] = useState(null);

  const today = toIsoDate(new Date());
  const days = useMemo(
    () => DAY_LABELS.map((label, i) => {
      const date = addDays(weekStart, i);
      return { label, date: toIsoDate(date), dayOfMonth: `${date.getDate()}/${date.getMonth() + 1}` };
    }),
    [weekStart]
  );

  const sortedShifts = useMemo(
    () => [...shifts].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
    [shifts]
  );

  const loadWeek = useCallback(async () => {
    const from = toIsoDate(weekStart);
    const to = toIsoDate(addDays(weekStart, 6));
    const res = await authAPI.get("/api/admin/staff-shifts", { params: { from, to } });
    setAssignments(res.data || []);
  }, [weekStart]);

  const loadShifts = async () => {
    const res = await authAPI.get("/api/admin/shifts");
    setShifts(res.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        const [, staffRes] = await Promise.all([loadShifts(), authAPI.get("/api/admin/staff")]);
        setStaff(staffRes.data || []);
      } catch (error) {
        toast.error(errorMessage(error, "Could not load shifts and staff"));
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    loadWeek()
      .catch((error) => toast.error(errorMessage(error, "Could not load the schedule")))
      .finally(() => setLoading(false));
  }, [loadWeek]);

  const cellAssignments = (date, shiftId) =>
    assignments.filter((a) => a.date === date && a.shiftId === shiftId);

  const openAssign = (date, shift) => {
    setAssignTarget({ date, shift });
    setSelectedStaffId("");
  };

  const assign = async () => {
    if (!selectedStaffId) return;
    setBusy(true);
    try {
      await authAPI.post("/api/admin/staff/shift/assign", {
        staffId: Number(selectedStaffId),
        shiftId: assignTarget.shift.shiftId,
        date: assignTarget.date,
      });
      toast.success("Shift assigned");
      setAssignTarget(null);
      await loadWeek();
    } catch (error) {
      toast.error(errorMessage(error, "Could not assign the shift"));
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (assignment) => {
    setBusy(true);
    try {
      await authAPI.delete(`/api/admin/staff-shifts/${assignment.staffShiftId}`);
      toast.success(`Removed ${assignment.staffName} from ${assignment.shiftName}`);
      await loadWeek();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove the assignment"));
    } finally {
      setBusy(false);
    }
  };

  const saveShift = async () => {
    const { shiftId, name, startTime, endTime } = shiftForm;
    if (!name.trim() || !startTime || !endTime) {
      toast.error("Enter a name, a start time and an end time");
      return;
    }
    setBusy(true);
    try {
      const body = { name: name.trim(), startTime, endTime };
      if (shiftId) {
        await authAPI.put(`/api/admin/shifts/${shiftId}`, body);
      } else {
        await authAPI.post("/api/admin/shifts", body);
      }
      toast.success(shiftId ? "Shift updated" : "Shift created");
      setShiftForm(null);
      await Promise.all([loadShifts(), loadWeek()]);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the shift"));
    } finally {
      setBusy(false);
    }
  };

  const deleteShift = async (shift) => {
    setBusy(true);
    try {
      await authAPI.delete(`/api/admin/shifts/${shift.shiftId}`);
      toast.success(`Deleted ${shift.name}`);
      await loadShifts();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete the shift"));
    } finally {
      setBusy(false);
    }
  };

  const assignedInTarget = assignTarget
    ? cellAssignments(assignTarget.date, assignTarget.shift.shiftId).map((a) => a.staffId)
    : [];
  const assignableStaff = staff.filter((s) => !assignedInTarget.includes(s.staff_id));
  const weekLabel = `${days[0].dayOfMonth} – ${days[6].dayOfMonth}/${addDays(weekStart, 6).getFullYear()}`;

  return (
    <div className="min-h-screen bg-[#f0f8fd]">
      <MenuBar title="Shift Schedule" icon="https://img.icons8.com/ios-filled/50/FFFFFF/calendar.png" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-[#1C2E4A]">Weekly schedule · {weekLabel}</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                ← Previous
              </button>
              <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                This week
              </button>
              <button type="button" onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>

          {sortedShifts.length === 0 ? (
            <p className="text-gray-500 text-sm">No shifts yet. Create one below, then assign staff to it.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-36 p-2 text-left text-gray-500 font-medium border-b">Shift</th>
                    {days.map((d) => (
                      <th key={d.date}
                        className={`p-2 text-left font-medium border-b ${d.date === today ? "text-blue-600" : "text-gray-700"}`}>
                        {d.label} <span className="font-normal text-gray-400">{d.dayOfMonth}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedShifts.map((shift) => (
                    <tr key={shift.shiftId} className="align-top">
                      <td className="p-2 border-b">
                        <div className="font-medium text-[#1C2E4A]">{shift.name}</div>
                        <div className="text-xs text-gray-500">{hhmm(shift.startTime)} – {hhmm(shift.endTime)}</div>
                      </td>
                      {days.map((d) => {
                        const cell = cellAssignments(d.date, shift.shiftId);
                        const past = d.date < today;
                        return (
                          <td key={d.date}
                            className={`p-2 border-b border-l border-gray-100 ${past ? "bg-gray-50" : ""} ${d.date === today ? "bg-blue-50/60" : ""}`}>
                            <div className="space-y-1">
                              {cell.map((a) => (
                                <div key={a.staffShiftId}
                                  className="flex items-center justify-between gap-1 rounded-md bg-blue-100 text-blue-900 px-2 py-1">
                                  <span className="truncate" title={a.staffName}>{a.staffName}</span>
                                  {!past && (
                                    <button type="button" disabled={busy} onClick={() => removeAssignment(a)}
                                      aria-label={`Remove ${a.staffName}`}
                                      className="text-blue-700 hover:text-red-600 leading-none">
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              {!past && cell.length < MAX_STAFF_PER_SHIFT && (
                                <button type="button" disabled={busy || loading} onClick={() => openAssign(d.date, shift)}
                                  className="w-full rounded-md border border-dashed border-gray-300 text-gray-500 py-1 hover:border-blue-400 hover:text-blue-600">
                                  + Assign
                                </button>
                              )}
                              {past && cell.length === 0 && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Up to {MAX_STAFF_PER_SHIFT} staff per shift. A staff member cannot hold two overlapping shifts on the same day.
            Past days are read-only because attendance and salary are computed from them.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-[#1C2E4A]">Shifts</h2>
            <button type="button" onClick={() => setShiftForm(emptyShiftForm)}
              className="px-3 py-1.5 rounded-lg !bg-blue-500 text-white text-sm hover:!bg-blue-600">
              + New shift
            </button>
          </div>
          <ul className="divide-y">
            {sortedShifts.map((shift) => (
              <li key={shift.shiftId} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{shift.name}</span>
                  <span className="ml-2 text-sm text-gray-500">{hhmm(shift.startTime)} – {hhmm(shift.endTime)}</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" disabled={busy}
                    onClick={() => setShiftForm({
                      shiftId: shift.shiftId, name: shift.name,
                      startTime: hhmm(shift.startTime), endTime: hhmm(shift.endTime),
                    })}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                    Edit
                  </button>
                  <button type="button" disabled={busy} onClick={() => deleteShift(shift)}
                    className="px-3 py-1 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold mb-1">Assign staff</h3>
            <p className="text-sm text-gray-500 mb-4">
              {assignTarget.shift.name} ({hhmm(assignTarget.shift.startTime)} – {hhmm(assignTarget.shift.endTime)}) · {assignTarget.date}
            </p>
            {assignableStaff.length === 0 ? (
              <p className="text-sm text-gray-500">Every active staff member is already on this shift.</p>
            ) : (
              <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Choose a staff member</option>
                {assignableStaff.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {s.fullname}{s.position ? ` · ${s.position}` : ""}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setAssignTarget(null)} disabled={busy}
                className="flex-1 py-2 rounded-lg border border-gray-300">
                Cancel
              </button>
              <button type="button" onClick={assign} disabled={busy || !selectedStaffId}
                className="flex-1 py-2 rounded-lg !bg-blue-500 text-white disabled:opacity-50">
                {busy ? "Saving…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {shiftForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold">{shiftForm.shiftId ? "Edit shift" : "New shift"}</h3>
            <label className="block text-sm">
              Name
              <input value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Morning" />
            </label>
            <div className="flex gap-3">
              <label className="block text-sm flex-1">
                Start
                <input type="time" value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="block text-sm flex-1">
                End
                <input type="time" value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>
            <p className="text-xs text-gray-500">An end time earlier than the start time makes an overnight shift.</p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShiftForm(null)} disabled={busy}
                className="flex-1 py-2 rounded-lg border border-gray-300">
                Cancel
              </button>
              <button type="button" onClick={saveShift} disabled={busy}
                className="flex-1 py-2 rounded-lg !bg-blue-500 text-white disabled:opacity-50">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftSchedule;
