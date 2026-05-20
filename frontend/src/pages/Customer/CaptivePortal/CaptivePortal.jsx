// CaptivePortal.js
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { publicAPI } from "../../../axiosConfig"; // Import publicAPI
import Bg1 from "../../../assets/img/CaptiveBg.jpg";
import Bg2 from "../../../assets/img/CaptiveBg2.jpg";
import logoCap from "../../../assets/img/CaptiveLogo.png";

const CaptivePortal = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const [clientIp, setClientIp] = useState("");
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const slides = [
    { id: 1, image: Bg1, altText: "Món ăn" },
    { id: 2, image: Bg2, altText: "Cảnh nhà hàng" },
  ];

  const logoSrc = logoCap;

  // Lấy tableNumber từ query parameter hoặc state
  const queryParams = new URLSearchParams(location.search);
  const tableNumber =
    queryParams.get("tableNumber") || location.state?.tableNumber || "1";

  // Kiểm tra IP khi component được tải
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userType = localStorage.getItem("userType");

    // Kiểm tra IP cho khách hàng (không có token)
    publicAPI
      .get(`/captive/check-ip?tableNumber=${tableNumber}`)
      .then((response) => {
        setClientIp(response.data.ip);
        // Chỉ chuyển hướng nếu API trả về đường dẫn hợp lệ và không phải STAFF/ADMIN
        if (
          response.data.redirect.startsWith("/table/") &&
          (!token || userType === "CUSTOMER")
        ) {
          navigate(response.data.redirect);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi kiểm tra IP:", error);
      });
  }, [navigate, tableNumber]);

  // Tự động chuyển slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Hiệu ứng dấu chấm khi loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingText = `Đang tải${".".repeat(dotCount)}`;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const deltaX = touchStartX.current - touchEndX.current;
    if (deltaX > 50) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (deltaX < -50) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleInternetConnect = (e) => {
    e.preventDefault();
    setIsLoading(true);

    publicAPI
      .post(`/captive/connect?tableNumber=${tableNumber}`)
      .then((response) => {
        setIsLoading(false);
        if (response.data.status === "connected") {
          navigate(response.data.redirect);
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Lỗi khi kết nối mạng:", error);
      });
  };

  const CarouselSlide = ({ image, altText }) => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-800 text-white relative">
      <img
        src={image}
        alt={altText}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#66666600_50%,#2A2A2A80_70%,#101010DD_80%,#000000_100%)]" />
      <div className="relative z-10 text-center pt-10">
        <img
          src={logoSrc}
          alt="Bon Appétit Logo"
          className="w-[350px] h-auto mx-auto"
        />
      </div>
      <div className="relative z-10 text-center pb-10 mt-auto">
        <p className="text-[25px] italic font-[Baskervville] text-gray-200 mb-8">
          Connect to the restaurant's
          <br /> network to order.
        </p>
        <a
          href="#"
          onClick={handleInternetConnect}
          className="block mb-7 px-6 py-2 rounded-lg text-center text-[25px] font-[Baskervville] font-normal"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(100px)",
            WebkitBackdropFilter: "blur(30px)",
            color: "#fff",
            textShadow: `
              -1px -1px 0 #797164,
               1px -1px 0 #797164,
              -1px  1px 0 #797164,
               1px  1px 0 #797164
            `,
          }}
        >
          Internet connection
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-100 bg-[#DCE5EB]/44 flex flex-col items-center justify-start relative">
      <div
        className="w-full h-screen relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100 block" : "opacity-0 hidden"
            }`}
          >
            <CarouselSlide image={slide.image} altText={slide.altText} />
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full ${
                currentSlide === index ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <img
              src="https://media0.giphy.com/media/3o7buhIQho4RsDOf8Q/giphy.gif"
              alt="Loading GIF"
              className="w-20 h-20"
            />
            <p className="text-[30px] italic font-[Baskervville] text-black-200">
              {loadingText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptivePortal;
