import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import ReservationForm from "../../../components/reservation/ReservationForm";
import {
  createReservation,
  errorMessage,
  getMenuDishes,
  getPublicTables,
} from "../../../services/reservationAPI";
import { formatReservationTime, normalizeDish } from "../../../utils/reservation";

export default function Reservation() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    Promise.all([getPublicTables(), getMenuDishes().catch(() => [])])
      .then(([tableList, dishList]) => {
        setTables(tableList);
        setDishes((dishList || []).map(normalizeDish));
      })
      .catch((err) => setLoadError(errorMessage(err, "Không tải được danh sách bàn, vui lòng thử lại.")))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (body) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      setBooked(await createReservation(body));
    } catch (err) {
      setSubmitError(errorMessage(err, "Không gửi được yêu cầu đặt bàn, vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="w-full max-w-md px-4 pb-10">
        <Header />
        <button onClick={() => navigate(-1)} className="mt-2 text-sm text-slate-500 hover:text-[#B73512]">
          ← Quay lại
        </button>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Đặt bàn trước</h1>

        {booked ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5 text-slate-700">
            <p className="text-lg font-semibold text-green-800">Đã gửi yêu cầu đặt bàn!</p>
            <p className="mt-3 text-base">
              Mã lịch hẹn: <strong>#{booked.orderId}</strong>
            </p>
            <p className="mt-1">Thời gian: {formatReservationTime(booked.reservationTime)}</p>
            <p className="mt-1">
              Bàn {booked.tableNumber} · {booked.guestCount} khách
            </p>
            <p className="mt-3">Nhà hàng sẽ liên hệ xác nhận qua số {booked.contactPhone}.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-5 w-full rounded-lg bg-[#B73512] py-3 text-base font-semibold text-white"
            >
              Về trang chủ
            </button>
          </div>
        ) : loading ? (
          <p className="mt-6 text-slate-500">Đang tải...</p>
        ) : loadError ? (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-red-700">{loadError}</p>
        ) : (
          <>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              Chọn ngày giờ, số khách và bàn. Bạn có thể đặt món trước nếu muốn.
            </p>
            <ReservationForm
              tables={tables}
              dishes={dishes}
              submitting={submitting}
              error={submitError}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}
