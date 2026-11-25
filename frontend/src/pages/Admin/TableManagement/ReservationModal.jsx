import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const initialRequests = [
  {
    id: "REQ-883",
    name: "Nguyễn Văn An",
    phone: "0901 234 567",
    guests: 4,
    time: "18:30",
    date: "Hôm nay",
    dateISO: "2026-11-25",
    table: "T-05",
    amount: 2450000,
    items: [
      { name: "Salad Hy Lạp Cao Cấp", quantity: 1, price: 380000 },
      { name: "Súp Bào Ngư Thượng Hạng", quantity: 2, price: 680000 },
      { name: "Lemon Macarons Tráng Miệng", quantity: 1, price: 420000 },
      { name: "Trà Hoa Cúc Mật Ong Rừng", quantity: 1, price: 290000 },
    ],
    note: "Tiệc sinh nhật, cần ghế trẻ em và bánh kem lúc 19:30.",
    status: "Chờ duyệt",
    vip: true,
  },
  {
    id: "REQ-884",
    name: "Trần Thị Hoa",
    phone: "0987 654 321",
    guests: 2,
    time: "19:15",
    date: "Hôm nay",
    dateISO: "2026-11-25",
    table: "Chưa đặt món",
    amount: 0,
    items: [],
    note: "Cần bàn cạnh cửa sổ hoặc khu vực yên tĩnh tiếp đối tác.",
    status: "Mới nhận",
    vip: false,
  },
  {
    id: "REQ-885",
    name: "Lê Hoàng Nam",
    phone: "0912 889 900",
    guests: 6,
    time: "20:00",
    date: "Hôm nay",
    dateISO: "2026-11-25",
    table: "T-12",
    amount: 1820000,
    items: [{ name: "Set menu gia đình", quantity: 1, price: 1820000 }],
    note: "Bàn sinh nhật, ưu tiên không gian riêng.",
    status: "Đến trễ (20:00)",
    vip: false,
  },
];

const initialBookings = [
  {
    id: "BK-101",
    dateISO: "2026-11-25",
    table: "T-01",
    floor: "Tầng 1",
    name: "Hoàng Minh Quân",
    phone: "0938 112 233",
    guests: 4,
    time: "18:00",
    status: "Xác nhận",
    amount: 780000,
    items: "Salad Hy Lạp, Súp nấm truffle, Bò Úc, Tiramisu",
    note: "Đổi bàn",
  },
  {
    id: "BK-102",
    dateISO: "2026-11-25",
    table: "T-04",
    floor: "Sân vườn",
    name: "Nguyễn Lan Anh",
    phone: "0909 445 566",
    guests: 6,
    time: "19:00",
    status: "Cọc 500k",
    amount: 0,
    items: "Set Menu Âu",
    note: "Bàn sinh nhật • Yêu cầu nến & hoa",
  },
  {
    id: "BK-103",
    dateISO: "2026-11-25",
    table: "T-08",
    floor: "Tầng 1",
    name: "Đỗ Gia Bảo",
    phone: "0977 223 344",
    guests: 2,
    time: "19:30",
    status: "Xác nhận",
    amount: 0,
    items: "Gọi tại bàn",
    note: "Bàn 2 người cạnh cửa sổ",
  },
  {
    id: "BK-104",
    dateISO: "2026-11-25",
    table: "VIP1",
    floor: "Phòng riêng",
    name: "Phạm Nhật Nam",
    phone: "0918 999 888",
    guests: 8,
    time: "20:00",
    status: "VIP • Cọc 2.000k",
    amount: 4200000,
    items: "10 món thượng hạng kèm 2 chai vang đỏ Grand Cru",
    note: "Đổi bàn",
  },
];

const menuSamples = [
  { id: 1, name: "Salad Hy Lạp Cao Cấp", price: 125000 },
  { id: 2, name: "Súp Bào Ngư Thượng Hạng", price: 450000 },
  { id: 3, name: "Lemon Macarons", price: 85000 },
  { id: 4, name: "Bò Úc sốt tiêu đen", price: 390000 },
  { id: 5, name: "Trà Hoa Cúc Mật Ong", price: 95000 },
];

const tablesSample = [
  { id: "T-01", label: "Bàn 01 (4 khách)", capacity: 4 },
  { id: "T-02", label: "Bàn 02 (2 khách)", capacity: 2 },
  { id: "T-05", label: "Bàn 05 (4-6 khách)", capacity: 6 },
  { id: "T-08", label: "Bàn 08 (2 khách)", capacity: 2 },
  { id: "T-12", label: "Bàn 12 (6 khách)", capacity: 6 },
  { id: "VIP 1", label: "Phòng VIP 1 (8 khách)", capacity: 8 },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-[#F0F5FD] px-3 py-2 text-xs text-slate-800 outline-none focus:border-orange-500";
const labelClass = "mb-1.5 block text-[11px] font-medium text-slate-600";

export default function ReservationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState(initialRequests);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedRequestId, setSelectedRequestId] = useState("REQ-883");
  const [selectedRecord, setSelectedRecord] = useState({
    type: "request",
    id: "REQ-883",
  });
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTime, setSelectedTime] = useState("18:30");
  const [customerName, setCustomerName] = useState("Trần Đình Khang");
  const [phone, setPhone] = useState("0982 774 889");
  const [guestCount, setGuestCount] = useState("4");
  const [tableId, setTableId] = useState("T-05");
  const [bookingDate, setBookingDate] = useState("2026-11-25");
  const [quantities, setQuantities] = useState({ 1: 1, 2: 2, 3: 3 });
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [showMenuPicker, setShowMenuPicker] = useState(false);

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) || requests[0];

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter(
      (item) =>
        `${item.name} ${item.phone} ${item.id}`.toLowerCase().includes(query) &&
        (!filterDate || item.dateISO === filterDate),
    );
  }, [requests, search, filterDate]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter(
      (item) =>
        `${item.name} ${item.phone} ${item.table}`
          .toLowerCase()
          .includes(query) &&
        (!filterDate || item.dateISO === filterDate),
    );
  }, [bookings, search, filterDate]);

  const currentRecord =
    selectedRecord.type === "request"
      ? requests.find((item) => item.id === selectedRecord.id)
      : bookings.find((item) => item.id === selectedRecord.id);

  useEffect(() => {
    if (!currentRecord) return;
    setCustomerName(currentRecord.name || "");
    setPhone(currentRecord.phone || "");
    setGuestCount(String(currentRecord.guests || 1));
    setTableId(
      tablesSample.some((table) => table.id === currentRecord.table)
        ? currentRecord.table
        : "T-05",
    );
    setSelectedTime(currentRecord.time || "18:30");
    setBookingDate(currentRecord.dateISO || "2026-11-25");
    setNote(currentRecord.note || "");
    const sourceItems = Array.isArray(currentRecord.items)
      ? currentRecord.items
      : [];
    const nextQuantities = {};
    sourceItems.forEach((entry) => {
      const match = menuSamples.find((menu) => menu.name === entry.name);
      if (match) nextQuantities[match.id] = Number(entry.quantity) || 1;
    });
    setQuantities(nextQuantities);
  }, [selectedRecord, requests, bookings]);

  const selectRecord = (type, item) => {
    setSelectedRecord({ type, id: item.id });
    if (type === "request") setSelectedRequestId(item.id);
  };

  const selectedItems = menuSamples
    .filter((item) => (quantities[item.id] || 0) > 0)
    .map((item) => ({ ...item, quantity: quantities[item.id] || 0 }));
  const total = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (!isOpen) return null;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const changeQuantity = (id, value) => {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(99, Number(value) || 0)),
    }));
  };

  const createBooking = () => {
    if (!customerName.trim() || !phone.trim() || !guestCount || !tableId) {
      showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    const table = tablesSample.find((item) => item.id === tableId);
    if (Number(guestCount) > (table?.capacity || 99)) {
      showToast("Số khách vượt quá sức chứa của bàn đã chọn.");
      return;
    }
    const newBooking = {
      id: `BK-${Date.now().toString().slice(-5)}`,
      table: tableId,
      floor: tableId === "VIP 1" ? "Phòng riêng" : "Tầng 1",
      name: customerName.trim(),
      phone: phone.trim(),
      guests: Number(guestCount),
      time: selectedTime,
      dateISO: bookingDate,
      status: "Mới tạo",
      amount: total,
      items: selectedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      note: note.trim() || "Không có ghi chú",
    };
    setBookings((current) => [newBooking, ...current]);
    setSelectedRecord({ type: "booking", id: newBooking.id });
    setActiveTab("bookings");
    showToast("Đã tạo đặt bàn mẫu thành công.");
  };

  const updateRequest = (id, status) => {
    setRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    showToast(
      status === "Đã xác nhận"
        ? "Đã xác nhận yêu cầu đặt bàn."
        : "Đã từ chối yêu cầu.",
    );
  };

  const confirmRequest = () => {
    if (!selectedRequest) return;
    const newBookingId = `BK-${Date.now().toString().slice(-5)}`;
    setRequests((current) =>
      current.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, status: "Đã xác nhận" }
          : item,
      ),
    );
    setBookings((current) => [
      {
        id: newBookingId,
        table:
          selectedRequest.table === "Chưa đặt món"
            ? "Chưa xếp bàn"
            : selectedRequest.table,
        dateISO: selectedRequest.dateISO || "2026-11-25",
        floor: "Tầng 1",
        name: selectedRequest.name,
        phone: selectedRequest.phone,
        guests: selectedRequest.guests,
        time: selectedRequest.time,
        status: "Xác nhận",
        amount: selectedRequest.amount,
        items: selectedRequest.items,
        note: selectedRequest.note,
      },
      ...bookings,
    ]);
    setSelectedRecord({ type: "booking", id: newBookingId });
    setActiveTab("bookings");
    showToast("Đã xác nhận và chuyển yêu cầu sang danh sách bàn đã đặt.");
  };

  const openCreateFromRequest = () => {
    if (!selectedRequest) return;
    setCustomerName(selectedRequest.name);
    setPhone(selectedRequest.phone);
    setGuestCount(String(selectedRequest.guests));
    setSelectedTime(selectedRequest.time);
    setNote(selectedRequest.note);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[96vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-[#EEF4FD] px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quản lý Đặt bàn & Yêu cầu
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white px-3 py-1.5 text-[10px] text-slate-500 sm:inline">
              Dữ liệu mẫu • Chưa kết nối API
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </header>

        <nav className="flex gap-7 border-b border-slate-100 bg-[#EEF4FD] px-5">
          <button
            onClick={() => setActiveTab("requests")}
            className={`border-b-2 px-1 pb-3 pt-1 text-xs font-semibold ${activeTab === "requests" ? "border-[#B73512] text-[#B73512]" : "border-transparent text-slate-500"}`}
          >
            Yêu cầu đặt bàn chờ duyệt (
            {
              requests.filter(
                (item) => !["Đã xác nhận", "Đã từ chối"].includes(item.status),
              ).length
            }
            )
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`border-b-2 px-1 pb-3 pt-1 text-xs font-semibold ${activeTab === "bookings" ? "border-[#B73512] text-[#B73512]" : "border-transparent text-slate-500"}`}
          >
            Danh sách bàn đã đặt ({bookings.length})
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#F0F5FD] p-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="⌕  Tìm theo tên khách, SĐT..."
              className="w-full max-w-[250px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500"
            />
            <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[11px] text-slate-600">
              Ngày
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-[11px] outline-none"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="text-[#B73512]"
                >
                  Xóa
                </button>
              )}
            </label>
            <span className="rounded-lg bg-white px-3 py-2 text-[11px] text-slate-600">
              ◷ Tất cả ca
            </span>
            <span className="rounded-lg bg-white px-3 py-2 text-[11px] text-slate-600">
              ● {bookings.length} bàn đã đặt
            </span>
            <button
              onClick={() => {
                setCustomerName("");
                setPhone("");
                setGuestCount("2");
                setNote("");
                setActiveTab("bookings");
              }}
              className="ml-auto rounded-xl bg-[#E89255] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#D9783A]"
            >
              ＋ Tạo đặt bàn mới
            </button>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.9fr)]">
            <section className="min-w-0">
              {activeTab === "requests" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Yêu cầu đặt bàn chờ duyệt
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {filteredRequests.length} yêu cầu • Khách đặt trước
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-[10px] font-semibold text-[#B73512]">
                      Cần xử lý
                    </span>
                  </div>
                  {filteredRequests.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => selectRecord("request", item)}
                      className={`cursor-pointer rounded-xl border bg-white p-3 transition ${selectedRecord.type === "request" && selectedRecord.id === item.id ? "border-[#D65A32] shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <strong className="text-slate-900">
                            {item.name}
                          </strong>
                          <span className="text-slate-500">{item.phone}</span>
                          {item.vip && (
                            <span className="text-[10px] font-bold text-[#B73512]">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="rounded bg-[#FFF5E8] px-2 py-1 text-[10px] font-semibold text-[#A65B00]">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 sm:grid-cols-4">
                        <span>
                          {item.time} {item.date}
                        </span>
                        <span>• {item.guests} khách</span>
                        <span>• Đề xuất: {item.table}</span>
                        <span>
                          • {item.amount ? money(item.amount) : "Chưa đặt món"}
                        </span>
                      </div>
                      <p className="mt-2 rounded-lg bg-[#F7FAFE] px-2.5 py-2 text-[11px] text-slate-600">
                        Ghi chú: {item.note}
                      </p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            updateRequest(item.id, "Đã từ chối");
                          }}
                          className="rounded-lg px-3 py-1.5 text-[11px] text-slate-500 hover:bg-slate-100"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            selectRecord("request", item);
                          }}
                          className="rounded-xl bg-[#E89255] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#D9783A]"
                        >
                          Xác nhận & Xếp bàn
                        </button>
                      </div>
                    </article>
                  ))}
                  {filteredRequests.length === 0 && (
                    <p className="rounded-xl border border-dashed p-8 text-center text-xs text-slate-500">
                      Không tìm thấy yêu cầu phù hợp.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Bàn đã đặt hôm nay
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {filteredBookings.length} lượt đặt bàn • Ca tối (17:30 –
                        22:00)
                      </p>
                    </div>
                    <span className="rounded-full bg-[#EEF3FA] px-3 py-1.5 text-[10px] text-slate-600">
                      Kin 75% công suất
                    </span>
                  </div>
                  {filteredBookings.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => selectRecord("booking", item)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${selectedRecord.type === "booking" && selectedRecord.id === item.id ? "border-[#D65A32] bg-white shadow-sm" : "border-slate-200 bg-[#F8FAFE]"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-2">
                          <div className="rounded-lg bg-[#E9EEF7] px-2 py-2 text-center text-[10px] font-bold text-slate-700">
                            {item.table}
                            <span className="block text-[9px] font-normal text-slate-500">
                              {item.floor}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800">
                              {item.name}{" "}
                              <span className="text-[10px] font-normal text-emerald-700">
                                • {item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {item.phone} • {item.guests} khách •{" "}
                              <b className="text-[#B73512]">{item.time}</b>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <strong className="text-xs text-[#B73512]">
                            {item.amount
                              ? money(item.amount)
                              : "Set menu / gọi món"}
                          </strong>
                          <p className="mt-1 text-[9px] text-slate-500">
                            {item.id}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[10px] text-slate-600">
                        <span>
                          {Array.isArray(item.items)
                            ? item.items
                                .map(
                                  (entry) => `${entry.name} x${entry.quantity}`,
                                )
                                .join(", ")
                            : item.items}
                        </span>
                        <span>{item.note}</span>
                      </div>
                    </article>
                  ))}
                  {filteredBookings.length === 0 && (
                    <p className="rounded-xl border border-dashed p-8 text-center text-xs text-slate-500">
                      Chưa có bàn đặt phù hợp.
                    </p>
                  )}
                </div>
              )}
            </section>

            <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tạo Đặt Bàn Mới
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Điền thông tin và chọn món đặt trước
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCustomerName("");
                    setPhone("");
                    setGuestCount("2");
                    setNote("");
                    setQuantities({});
                  }}
                  className="text-xs text-slate-500 hover:text-[#B73512]"
                  title="Làm mới form"
                >
                  ↻
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <label>
                  <span className={labelClass}>Tên khách hàng *</span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={inputClass}
                    placeholder="Nhập tên khách"
                  />
                </label>
                <label>
                  <span className={labelClass}>Số điện thoại *</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="09xx xxx xxx"
                  />
                </label>
                <label>
                  <span className={labelClass}>Bàn chỉ định</span>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className={inputClass}
                  >
                    {tablesSample.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Ngày dùng bữa</span>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="mt-3">
                <span className={labelClass}>Giờ đón khách</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {["18:00", "18:30", "19:00", "19:30"].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-md py-2 text-[10px] font-semibold ${selectedTime === time ? "bg-[#B73512] text-white" : "bg-[#EAF0F9] text-slate-700 hover:bg-slate-200"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-3 block">
                <span className={labelClass}>Số lượng khách</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Món đặt trước ({selectedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMenuPicker((value) => !value)}
                    className="rounded-lg bg-[#B73512] px-2.5 py-1.5 text-[10px] font-semibold text-white"
                  >
                    ＋ Thêm món ăn
                  </button>
                </div>
                {selectedItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#F0F5FD] px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-slate-700">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {money(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              changeQuantity(item.id, item.quantity - 1)
                            }
                            className="h-6 w-6 rounded bg-white text-slate-600"
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-[10px] font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              changeQuantity(item.id, item.quantity + 1)
                            }
                            className="h-6 w-6 rounded bg-white text-slate-600"
                          >
                            ＋
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 p-3 text-center text-[10px] text-slate-400">
                    Chưa chọn món ăn
                  </p>
                )}
                {showMenuPicker && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {menuSamples.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-[10px] font-medium text-slate-700">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {money(item.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            changeQuantity(
                              item.id,
                              (quantities[item.id] || 0) + 1,
                            );
                          }}
                          className="rounded-md border border-[#B73512] px-2.5 py-1 text-[10px] font-semibold text-[#B73512]"
                        >
                          Thêm
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="mt-3 block">
                <span className={labelClass}>Ghi chú</span>
                <textarea
                  rows="2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={inputClass}
                  placeholder="Yêu cầu đặc biệt của khách..."
                />
              </label>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-600">
                  Tạm tính món ăn:
                </span>
                <strong className="text-sm text-[#B73512]">
                  {money(total)}
                </strong>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                onClick={() => {
                  const patch = {
                    name: customerName,
                    phone,
                    guests: Number(guestCount),
                    table: tableId,
                    time: selectedTime,
                    dateISO: bookingDate,
                    note,
                    amount: total,
                    items: selectedItems.map((item) => ({
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                  };
                  if (selectedRecord.type === "request") {
                    setRequests((list) =>
                      list.map((entry) =>
                        entry.id === selectedRecord.id
                          ? { ...entry, ...patch }
                          : entry,
                      ),
                    );
                  } else {
                    setBookings((list) =>
                      list.map((entry) =>
                        entry.id === selectedRecord.id
                          ? { ...entry, ...patch }
                          : entry,
                      ),
                    );
                  }
                  showToast("Đã cập nhật thông tin đặt bàn mẫu.");
                }}
                className={`rounded-xl bg-[#E89255] p-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#D9783A] ${activeTab === "requests" ? "flex-1" : "w-full"}`}
              >
                Lưu thay đổi đặt bàn ✓
                </button>
                {activeTab === "requests" && selectedRequest && (
                  <button
                    onClick={confirmRequest}
                    className="flex-1 rounded-xl bg-[#E89255] p-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#D9783A]"
                  >
                    Xác nhận yêu cầu đang chọn
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[9px] text-slate-400">
                Đây là dữ liệu mock, chưa gửi lên máy chủ.
              </p>
            </aside>
          </div>
        </div>
        {toast && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
