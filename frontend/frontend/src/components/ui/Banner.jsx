import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  const banners = [
    { image: "/src/assets/img/banner2.jpg", title: "Up to 40% OFF", subtitle: "ON YOUR FIRST ORDER" },
    { image: "/src/assets/img/callstaff.jpg", title: "Free Delivery", subtitle: "FOR ORDERS OVER $50" },
    { image: "/src/assets/img/callpayment.jpg", title: "New Arrivals", subtitle: "CHECK OUT OUR LATEST MENU" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Tự động chuyển ảnh sau mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000); // 3000ms = 3 giây

    return () => clearInterval(interval); // Dọn dẹp interval khi component bị unmount
  }, [banners.length]);

  return (
    <div className="relative mb-4 overflow-hidden">
      {/* Hình ảnh banner */}
      <img
        src={banners[currentIndex].image}
        alt="Promotion Banner"
        className="w-full h-[170px] rounded-lg object-cover transform scale-110 transition-transform duration-500"
      />

      {/* Lớp phủ để tăng độ tương phản */}
      <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

      {/* Nội dung chữ và nút */}
      <div className="absolute inset-0 flex flex-col items-end justify-center p-4 text-white text-right">
        <h2 className="text-lg font-bold">{banners[currentIndex].title}</h2>
        <p className="text-xs mt-1">{banners[currentIndex].subtitle}</p>
        <button
          onClick={() => navigate("/order")} // Điều hướng đến trang Order
          className="mt-2 bg-white text-red-500 font-bold px-3 py-1 rounded-lg shadow-md hover:bg-gray-200"
        >
          ORDER NOW
        </button>
      </div>
    </div>
  );
};

export default Banner;