import { useEffect, useState } from "react";
import { listReservations } from "../../services/reservationAPI";

/** Số yêu cầu đặt bàn đang chờ duyệt, tự làm mới định kỳ để hiện badge trên nút mở. */
export default function usePendingReservationCount(refreshKey, pollMs = 30000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const fetchCount = () =>
      listReservations({ status: "SCHEDULED" })
        .then((list) => alive && setCount(list.length))
        .catch(() => {});
    fetchCount();
    const timer = setInterval(fetchCount, pollMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [refreshKey, pollMs]);
  return count;
}
