import { useState, useEffect, useRef } from "react";
import Bg1 from "../../../assets/img/CaptiveBg.jpg";
import Bg2 from "../../../assets/img/CaptiveBg2.jpg";
import logoCap from "../../../assets/img/CaptiveLogo.png";

const CaptivePortal = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dotCount, setDotCount] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const slides = [
    { id: 1, image: Bg1, altText: "Food Dish" },
    { id: 2, image: Bg2, altText: "Restaurant Scene" },
  ];

  const logoSrc = logoCap;

  // Auto slide every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Loading dot animation
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingText = `Loading${".".repeat(dotCount)}`;

  // Swipe detection
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

    setTimeout(() => {
      setIsLoading(false);
      // Chuyển trang hoặc xử lý khác tại đây nếu cần
      // window.location.href = "https://your-redirect-url.com";
    }, 3000);
  };

  const CarouselSlide = ({ image, altText }) => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-800 text-white relative">
      <img
        src={image}
        alt={altText}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#66666600_50%,#2A2A2A80_70%,#101010DD_80%,#000000_100%)]" />

      {/* Top Section: Logo */}
      <div className="relative z-10 text-center pt-10">
        <img src={logoSrc} alt="Bon Appétit Logo" className="w-[350px] h-auto mx-auto" />
      </div>

      {/* Bottom Section: Text and Button */}
      <div className="relative z-10 text-center pb-10 mt-auto">
        <p className="text-[25px] italic font-[Baskervville] text-gray-200 mb-8">
          Connect to the restaurant's<br /> network to order.
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

        {/* Slide Dots */}
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <img
              src="https://media0.giphy.com/media/3o7buhIQho4RsDOf8Q/giphy.gif"
              alt="Loading GIF"
              className="w-20 h-20"
            />
            <p className="text-[30px] italic font-[Baskervville] text-black-200">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptivePortal;
