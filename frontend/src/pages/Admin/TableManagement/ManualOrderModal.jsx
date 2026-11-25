import React, { useState, useEffect, useMemo } from "react";

// Dữ liệu thực đơn mẫu phong phú, chuẩn nhà hàng
const DEFAULT_MENU_ITEMS = [
  {
    id: 1,
    code: "APP-02",
    name: "Salad Landaise Vịt Xông Khói",
    category: "khai_vi",
    categoryLabel: "KHAI VỊ",
    price: 185000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Xà lách Frisée, ức vịt xông khói, gan ngỗng áp chảo & sốt mâm xôi.",
  },
  {
    id: 2,
    code: "MAIN-05",
    name: "Magret De Canard Rôtie",
    category: "mon_chinh",
    categoryLabel: "MÓN CHÍNH",
    price: 320000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Ức vịt đút lò sốt cam mật ong thảo mộc, cà rốt nghiền bơ thơm.",
  },
  {
    id: 3,
    code: "SEA-01",
    name: "Tartare De Saumon Sauvage",
    category: "hai_san",
    categoryLabel: "HẢI SẢN",
    price: 250000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Cá hồi Na Uy tươi cắt hạt lựu, quả bơ, trứng cá tầm và bánh mì nướng.",
  },
  {
    id: 4,
    code: "SEA-04",
    name: "Huîtres Fraîches (Hàu Pháp)",
    category: "hai_san",
    categoryLabel: "HẢI SẢN",
    price: 450000,
    status: "limited",
    statusLabel: "Còn 4 phần",
    description: "Hàu nhập khẩu tươi sống kèm chanh vàng & sốt mignonette giấm vang đỏ.",
  },
  {
    id: 5,
    code: "MAIN-09",
    name: "Súp Bào Ngư Thượng Hạng",
    category: "mon_chinh",
    categoryLabel: "MÓN CHÍNH",
    price: 380000,
    status: "chef",
    statusLabel: "Đầu bếp khuyên",
    description: "Nước dùng gà hầm đông trùng thảo mộc, nấm truffle tươi quý phái.",
  },
  {
    id: 6,
    code: "DES-03",
    name: "Lemon Macarons & Sorbet",
    category: "trang_mieng",
    categoryLabel: "TRÁNG MIỆNG",
    price: 85000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Bánh macaron nhân kem chanh vàng Amalfi kèm sorbet dâu tây tươi.",
  },
  {
    id: 7,
    code: "MAIN-01",
    name: "Bò Wagyu Nướng Đá Nóng",
    category: "mon_chinh",
    categoryLabel: "MÓN CHÍNH",
    price: 520000,
    status: "chef",
    statusLabel: "Đầu bếp khuyên",
    description: "Thịt bò Wagyu vân mỡ đút lò than hoa ăn kèm khoai tây nghiền tỏi nướng.",
  },
  {
    id: 8,
    code: "APP-01",
    name: "Súp Bí Đỏ Hạt Dẻ Cười",
    category: "khai_vi",
    categoryLabel: "KHAI VỊ",
    price: 120000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Bí đỏ bơ nấu nhuyễn kem béo Pháp, phủ hạt dẻ cười nướng giòn.",
  },
  {
    id: 9,
    code: "SEA-02",
    name: "Tôm Hùm Bông Đút Lò Phô Mai",
    category: "hai_san",
    categoryLabel: "HẢI SẢN",
    price: 680000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Tôm hùm Nha Trang tươi sống nướng sốt kem phô mai Mozzarella đút lò.",
  },
  {
    id: 10,
    code: "DES-01",
    name: "Panna Cotta Sốt Chanh Dây",
    category: "trang_mieng",
    categoryLabel: "TRÁNG MIỆNG",
    price: 75000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Panna cotta kem tươi vani Madagascar phủ sốt chanh leo chua thanh dịu mát.",
  },
  {
    id: 11,
    code: "BEV-01",
    name: "Trà Đào Cam Sả Tươi",
    category: "do_uong",
    categoryLabel: "ĐỒ UỐNG",
    price: 55000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Trà đào ủ lạnh tự nhiên kết hợp cam vàng mọng nước và hương sả thơm mát.",
  },
  {
    id: 12,
    code: "BEV-05",
    name: "Rượu Vang Đỏ Bordeaux 2020",
    category: "do_uong",
    categoryLabel: "ĐỒ UỐNG",
    price: 750000,
    status: "ready",
    statusLabel: "Sẵn sàng",
    description: "Vang đỏ nhập khẩu nguyên chai vùng Bordeaux Pháp, đậm đà vị quả mọng.",
  },
];

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "khai_vi", label: "Khai vị (Appetizers)" },
  { id: "mon_chinh", label: "Món chính (Mains)" },
  { id: "hai_san", label: "Hải sản cao cấp" },
  { id: "trang_mieng", label: "Tráng miệng" },
  { id: "do_uong", label: "Đồ uống & Rượu" },
];

const formatVND = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0đ";
  return Number(value).toLocaleString("vi-VN") + "đ";
};

export default function ManualOrderModal({
  isOpen,
  onClose,
  tables = [],
  selectedTable = null,
  onOrderCreated,
}) {
  // Đồng hồ hiển thị thời gian thực
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  // Mã đơn hàng ngẫu nhiên mô phỏng POS
  const [orderCode] = useState(() => `#ORD-${Math.floor(1000 + Math.random() * 9000)}`);

  // State tìm kiếm và lọc danh mục
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // State hình thức phục vụ: "dine_in" hoặc "takeaway"
  const [serviceType, setServiceType] = useState("dine_in");

  // State bàn phục vụ được chọn
  const [targetTableId, setTargetTableId] = useState(() => {
    if (selectedTable && selectedTable.id) return String(selectedTable.id);
    if (tables.length > 0) return String(tables[0].id);
    return "1";
  });

  // State giỏ món đang chọn: [{ id, code, name, price, quantity, ... }]
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      code: "APP-02",
      name: "Salad Landaise Vịt Xông Khói",
      price: 185000,
      quantity: 1,
    },
    {
      id: 2,
      code: "MAIN-05",
      name: "Magret De Canard Rôtie",
      price: 320000,
      quantity: 2,
    },
    {
      id: 5,
      code: "MAIN-09",
      name: "Súp Bào Ngư Thượng Hạng",
      price: 380000,
      quantity: 1,
    },
  ]);

  // Ghi chú cho bếp/bar
  const [kitchenNote, setKitchenNote] = useState("");

  // Thông báo popup nhanh
  const [toastMessage, setToastMessage] = useState(null);

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Đồng bộ lại bàn khi selectedTable thay đổi
  useEffect(() => {
    if (selectedTable && selectedTable.id) {
      setTargetTableId(String(selectedTable.id));
    }
  }, [selectedTable]);

  // Tự tắt thông báo sau 2.5s
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Lọc món ăn theo danh mục và từ khóa tìm kiếm
  const filteredDishes = useMemo(() => {
    return DEFAULT_MENU_ITEMS.filter((dish) => {
      const matchCat =
        selectedCategory === "all" || dish.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        dish.name.toLowerCase().includes(q) ||
        dish.code.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Map số lượng món trong giỏ để hiển thị nhanh trên card
  const cartQuantityMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item.quantity;
    });
    return map;
  }, [cartItems]);

  // Tính toán tổng tiền
  const totalPortions = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.quantity, 0),
    [cartItems],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0),
    [cartItems],
  );

  const vat = useMemo(() => Math.round(subtotal * 0.08), [subtotal]);
  const grandTotal = subtotal + vat;

  // Thêm món vào giỏ
  const handleAddToCart = (dish) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === dish.id);
      if (existing) {
        return prev.map((it) =>
          it.id === dish.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          code: dish.code,
          name: dish.name,
          price: dish.price,
          quantity: 1,
        },
      ];
    });
  };

  // Tăng giảm số lượng trong giỏ
  const handleUpdateQuantity = (dishId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((it) => {
          if (it.id === dishId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean);
    });
  };

  // Xóa món khỏi giỏ
  const handleRemoveFromCart = (dishId) => {
    setCartItems((prev) => prev.filter((it) => it.id !== dishId));
  };

  // Làm mới đơn
  const handleResetOrder = () => {
    setCartItems([]);
    setKitchenNote("");
    setSearchQuery("");
    setToastMessage("Đã làm mới đơn hàng.");
  };

  // Xử lý nút 1: Đặt món vào bàn (Gửi Bếp)
  const handlePlaceOrderToTable = () => {
    if (cartItems.length === 0) {
      setToastMessage("Vui lòng chọn ít nhất 1 món ăn trước khi đặt.");
      return;
    }
    const tableInfo =
      serviceType === "dine_in"
        ? `Bàn ${String(targetTableId).padStart(2, "0")}`
        : "Khách mang về";
    setToastMessage(
      `Đã chuyển tiếp ${totalPortions} phần ăn của ${tableInfo} vào hệ thống Bếp & Bar thành công!`,
    );
    setTimeout(() => {
      if (onOrderCreated) onOrderCreated();
      onClose();
    }, 1200);
  };

  // Xử lý nút 2: Thanh toán & In Bill
  const handleCheckoutAndPrintBill = () => {
    if (cartItems.length === 0) {
      setToastMessage("Vui lòng chọn ít nhất 1 món ăn trước khi thanh toán.");
      return;
    }
    setToastMessage(
      `Đã xác nhận thanh toán ${formatVND(grandTotal)} và in hóa đơn ${orderCode} thành công!`,
    );
    setTimeout(() => {
      if (onOrderCreated) onOrderCreated();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2118]/45 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#3A2E22] text-[#FFF9F2] px-5 py-2.5 rounded-xl shadow-xl text-xs font-medium border border-[#EBD4B0]/30 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Container chính của Modal */}
      <div className="bg-[#FAF7F2] border border-[#F2DFC2] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-[#3A2E22]">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-white border-b border-[#F0DEC0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#3A2E22] tracking-tight">
                  Tạo Đơn & Đặt Món Nhanh
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF0E0] text-[#C2410C] border border-[#FBC998] text-[10px] font-bold">
                  POS Order Hub
                </span>
              </div>
              <p className="text-[11px] text-[#7D6B55]">
                Chọn món và chuyển tiếp vào hệ thống bếp hoặc thanh toán xuất
                hóa đơn ngay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-[#F5EFE6] border border-[#E8DDCD] text-[#5C4A3C] font-semibold text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                {orderCode}
              </span>
              <span className="text-[#A89882] flex items-center gap-1 text-[11px]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6l4 2"
                  />
                </svg>
                {currentTime}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#EBDCC8] text-[#6E5A44] flex items-center justify-center transition-colors cursor-pointer text-sm"
              title="Đóng cửa sổ"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Thân 2 cột: Cột trái chọn món + Cột phải tóm tắt đơn & thanh toán */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* CỘT TRÁI: Tìm kiếm, lọc danh mục & danh sách món (7 cột) */}
          <div className="lg:col-span-7 p-4 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[#F0DEC0] overflow-y-auto">
            {/* Thanh tìm kiếm */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89378]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tên món ăn, mã món (ví dụ: SAL-01, Macaron...)"
                className="w-full pl-9 pr-16 py-2 rounded-xl border border-[#EBD4B0] bg-white text-xs text-[#3A2E22] placeholder-[#A89882] focus:outline-none focus:border-[#EA580C] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#A89882] hover:text-[#3A2E22] bg-[#FAF2E6] px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Các tab danh mục */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const count =
                  cat.id === "all"
                    ? DEFAULT_MENU_ITEMS.length
                    : DEFAULT_MENU_ITEMS.filter((d) => d.category === cat.id)
                        .length;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? "bg-[#3A2E22] text-[#FFF9F2] shadow-xs"
                        : "bg-white text-[#6E5A44] hover:bg-[#FFF6E8] border border-[#EED8B4]"
                    }`}
                  >
                    {cat.label} {cat.id === "all" ? `(${count})` : ""}
                  </button>
                );
              })}
            </div> 

            {/* Lưới thẻ món ăn */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {filteredDishes.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#8A775E] bg-white rounded-xl border border-[#F2DFC2]">
                  Không tìm thấy món ăn nào phù hợp với từ khóa.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDishes.map((dish) => {
                    const qtyInCart = cartQuantityMap[dish.id] || 0;
                    return (
                      <div
                        key={dish.id}
                        className={`bg-white rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                          qtyInCart > 0
                            ? "border-[#F6BA88] shadow-sm ring-1 ring-[#EA580C]/20 bg-[#FFFDF9]"
                            : "border-[#F2DFC2] hover:border-[#E8CBA3]"
                        }`}
                      >
                        <div>
                          {/* Tags: Danh mục & trạng thái */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[10px] font-bold tracking-wider text-[#A84B14] bg-[#FFF2E0] px-2 py-0.5 rounded-md border border-[#FBD2A8]">
                              {dish.categoryLabel} #{dish.code}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                dish.status === "ready"
                                  ? "bg-[#D1FAE5] text-[#047857]"
                                  : dish.status === "limited"
                                    ? "bg-[#E0F2FE] text-[#0369A1]"
                                    : "bg-[#FEF3C7] text-[#B45309]"
                              }`}
                            >
                              {dish.statusLabel}
                            </span>
                          </div>

                          {/* Tên món */}
                          <h4 className="text-xs font-bold text-[#3A2E22] mb-1 leading-snug">
                            {dish.name}
                          </h4>

                          {/* Mô tả ngắn */}
                          <p className="text-[11px] text-[#7D6B55] line-clamp-2 leading-relaxed mb-3">
                            {dish.description}
                          </p>
                        </div>

                        {/* Giá và nút tăng giảm số lượng */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F7EAD7]">
                          <div>
                            <span className="text-[10px] text-[#8C7A65] block leading-none">
                              Đơn giá
                            </span>
                            <span className="text-xs font-bold text-[#3A2E22]">
                              {formatVND(dish.price)}
                            </span>
                          </div>

                          {qtyInCart === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish)}
                              className="px-3 py-1 rounded-lg border border-[#EBD4B0] bg-[#FFFBF5] hover:bg-[#FFEED8] hover:border-[#EA580C] text-[#C2410C] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              + Thêm
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-[#FFF4E5] border border-[#F5C293] rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(dish.id, -1)
                                }
                                className="w-5 h-5 rounded bg-white hover:bg-[#FCE8D0] text-[#A84B14] font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                              >
                                -
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-[#EA580C]">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(dish.id, 1)}
                                className="w-5 h-5 rounded bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Hình thức phục vụ, chọn bàn, giỏ hàng & hóa đơn (5 cột) */}
          <div className="lg:col-span-5 p-4 bg-[#FFFDFB] flex flex-col justify-between min-h-0 overflow-y-auto">
            <div className="space-y-3.5">
              {/* 1. HÌNH THỨC PHỤC VỤ */}
              <div>
                <label className="text-[11px] font-bold tracking-wider text-[#6E4B18] uppercase block mb-1.5">
                  Hình thức phục vụ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType("dine_in")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      serviceType === "dine_in"
                        ? "bg-[#FFF4E5] text-[#C2410C] border-[#F6B680] shadow-2xs"
                        : "bg-white text-[#6E5A44] border-[#EED8B4] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <span>🪑</span>
                    <span>Dùng tại bàn (Dine-In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType("takeaway")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      serviceType === "takeaway"
                        ? "bg-[#FFF4E5] text-[#C2410C] border-[#F6B680] shadow-2xs"
                        : "bg-white text-[#6E5A44] border-[#EED8B4] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <span>🛍️</span>
                    <span>Mang về (Takeaway)</span>
                  </button>
                </div>
              </div>

              {/* 2. VỊ TRÍ BÀN PHỤC VỤ (Khi dùng tại bàn) */}
              {serviceType === "dine_in" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold tracking-wider text-[#6E4B18] uppercase">
                      Vị trí bàn phục vụ
                    </label>
                    <span className="text-[10px] text-[#8C7A65]">
                      NV: Thu ngân | Ca trực
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={targetTableId}
                      onChange={(e) => setTargetTableId(e.target.value)}
                      className="w-full py-2 pl-3 pr-8 rounded-xl border border-[#EBD4B0] bg-white text-xs font-semibold text-[#3A2E22] focus:outline-none focus:border-[#EA580C] shadow-2xs appearance-none cursor-pointer"
                    >
                      {tables && tables.length > 0 ? (
                        tables.map((t) => (
                          <option key={t.id} value={String(t.id)}>
                            Bàn {String(t.id).padStart(2, "0")} —{" "}
                            {t.location || "Sảnh chính"} (
                            {t.status === "available"
                              ? "Sẵn sàng"
                              : "Đang phục vụ"}{" "}
                            • {t.capacity || 4} chỗ)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="1">
                            Bàn 01 — Sảnh chính (Sẵn sàng • 4 chỗ)
                          </option>
                          <option value="2">
                            Bàn 02 — Sảnh chính (Đang phục vụ • 4 chỗ)
                          </option>
                          <option value="3">
                            Bàn 03 — Cửa sổ (Sẵn sàng • 2 chỗ)
                          </option>
                          <option value="4">
                            Bàn 04 — VIP Room (Sẵn sàng • 8 chỗ)
                          </option>
                        </>
                      )}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A89882] text-xs">
                      ▼
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#FFF6EB] border border-[#FAD6B4] text-xs text-[#9E4912] flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    Đơn mang về sẽ được đóng gói và xuất hóa đơn mang đi.
                  </span>
                </div>
              )}

              {/* 3. MÓN ĐÃ CHỌN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-wider text-[#6E4B18] uppercase">
                    Món đã chọn ({cartItems.length} món • {totalPortions} phần)
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCartItems([])}
                      className="text-[11px] text-[#DC2626] hover:underline font-semibold cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#9E8B75] bg-white rounded-xl border border-dashed border-[#E8D4BA]">
                      Chưa chọn món nào. Nhấn "+ Thêm" ở danh sách bên trái.
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-2.5 rounded-xl border border-[#F2DFC2] flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-[#3A2E22] truncate">
                            {item.name}
                          </h5>
                          <span className="text-[11px] text-[#8C7A65]">
                            {formatVND(item.price)} / phần
                          </span>
                        </div>

                        {/* Bộ tăng giảm số lượng */}
                        <div className="flex items-center gap-1.5 bg-[#FAF4ED] border border-[#ECD1B3] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded bg-white hover:bg-[#F7E5CF] text-[#6E5A44] font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[#3A2E22]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 rounded bg-white hover:bg-[#F7E5CF] text-[#6E5A44] font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Tổng tiền món và nút xóa */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3A2E22] min-w-[70px] text-right">
                            {formatVND(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-[#B39D87] hover:text-[#DC2626] transition-colors cursor-pointer text-xs p-1"
                            title="Xóa món"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. GHI CHÚ BẾP & BAR */}
              <div>
                <label className="text-[11px] font-bold text-[#6E4B18] block mb-1">
                  Ghi chú cho Bếp & Bar:
                </label>
                <input
                  type="text"
                  value={kitchenNote}
                  onChange={(e) => setKitchenNote(e.target.value)}
                  placeholder="Ví dụ: ít cay, không hành, làm món nhanh..."
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EBD4B0] bg-white text-xs text-[#3A2E22] placeholder-[#A89882] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              {/* 5. TÍNH TOÁN HÓA ĐƠN */}
              <div className="pt-2 border-t border-[#F0DEC0] space-y-1.5 text-xs text-[#6E5A44]">
                <div className="flex items-center justify-between">
                  <span>Tạm tính (Subtotal)</span>
                  <span className="font-semibold text-[#3A2E22]">
                    {formatVND(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Thuế VAT (8%)</span>
                  <span className="font-semibold text-[#3A2E22]">
                    {formatVND(vat)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-[#F0DEC0]">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#3A2E22] block leading-tight">
                      Tổng cộng
                    </span>
                    <span className="text-[10px] text-[#8C7A65]">
                      (Đã gồm thuế & phí)
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#C85319]">
                    {formatVND(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hàng nút bấm cuối cùng ở cột phải */}
            <div className="mt-4 pt-3 border-t border-[#F0DEC0] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetOrder}
                className="px-3.5 py-2 rounded-xl border border-[#EBD4B0] bg-white hover:bg-[#FAF4ED] text-[#6E5A44] text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Làm mới đơn</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Nút 1: Đặt món vào bàn (Gửi Bếp) */}
                <button
                  type="button"
                  onClick={handlePlaceOrderToTable}
                  className="px-4 py-2 rounded-xl border border-[#E08A3C] bg-white hover:bg-[#FFF6EB] text-[#C2410C] text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 px-1.5 py-1.5">
                    <span>📋</span>
                    <span>Đặt món vào bàn (Gửi Bếp)</span>
                  </div>
                </button>

                {/* Nút 2: Thanh toán & In Bill */}
                <button
                  type="button"
                  onClick={handleCheckoutAndPrintBill}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:opacity-95 text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <div className="flex items-center gap-1.5 px-1.5 py-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    <span>Thanh toán & In Bill • {formatVND(grandTotal)}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
