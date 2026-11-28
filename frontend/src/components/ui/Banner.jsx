import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import CartContext with the correct path
import { CartContext } from "../../context/CartContext";

import { BACKEND_URL, authHeaders } from "../../config";
const Banner = () => {
  const navigate = useNavigate();
  // Access CartContext safely with destructuring and default empty object
  const cartContext = useContext(CartContext) || {};
  const { fetchCartData, refreshCart } = cartContext;

  const banners = [
    {
      image: "/img/banner2.jpg",
      title: "Giảm đến 40%",
      subtitle: "CHO ĐƠN ĐẦU TIÊN",
    },
    {
      image: "/img/promofood.jpg",
      title: "Miễn phí nước uống",
      subtitle: "CHO HÓA ĐƠN TỪ 500.000Đ",
    },
    {
      image: "/img/promo.jpg",
      title: "Món mới",
      subtitle: "KHÁM PHÁ THỰC ĐƠN MỚI NHẤT",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatically change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000); // 3000ms = 3 seconds

    return () => clearInterval(interval); // Clean up interval when component unmounts
  }, [banners.length]);

  // Handler for Order Now button
  const handleOrderNow = async () => {
    try {
      console.log("Order Now button clicked");

      // Unified approach to fetch cart data - first try context methods
      let cartFetched = false;

      // Try fetchCartData first
      if (typeof fetchCartData === "function") {
        console.log("Fetching cart data via fetchCartData");
        try {
          await fetchCartData();
          cartFetched = true;
        } catch (err) {
          console.error("fetchCartData failed:", err);
        }
      }

      // If that failed, try refreshCart as fallback
      if (!cartFetched && typeof refreshCart === "function") {
        console.log("Fetching cart data via refreshCart");
        try {
          await refreshCart();
          cartFetched = true;
        } catch (err) {
          console.error("refreshCart failed:", err);
        }
      }

      // If both context methods failed, try direct API calls
      if (!cartFetched) {
        console.log(
          "Context functions not available or failed, using direct API calls"
        );
        const API_BASE_URL = BACKEND_URL;

        // First try GraphQL
        try {
          const query = `
            query GetOrderCart {
              orderCart {
                items {
                  dishId
                  dishName
                  dishImage
                  price
                  quantity
                  notes
                }
                totalAmount
              }
            }
          `;

          const response = await axios.post(
            `${API_BASE_URL}/graphql`,
            { query },
            {
              headers: {
                "Content-Type": "application/json", ...authHeaders(),
              },
              withCredentials: true, // Important for session cookies
            }
          );

          console.log("GraphQL cart response:", response.data);

          if (
            response.data &&
            response.data.data &&
            response.data.data.orderCart
          ) {
            // Store in localStorage
            localStorage.setItem(
              "cartData",
              JSON.stringify(response.data.data.orderCart)
            );
            cartFetched = true;
          }
        } catch (graphqlError) {
          console.error("GraphQL cart fetch failed:", graphqlError);

          // Try REST API as last resort
          try {
            const restResponse = await axios.get(
              `${API_BASE_URL}/api/orders/cart`,
              { withCredentials: true }
            );

            console.log("REST cart response:", restResponse.data);

            if (restResponse.data) {
              localStorage.setItem(
                "cartData",
                JSON.stringify({
                  items: restResponse.data.items || restResponse.data,
                  totalAmount: restResponse.data.totalAmount || 0,
                })
              );
              cartFetched = true;
            }
          } catch (restError) {
            console.error("REST cart fetch also failed:", restError);
          }
        }
      }

      console.log("Navigating to order page");
      // Navigate to Order page even if all fetching methods fail
      navigate("/order_cus");
    } catch (err) {
      console.error("Error in Order Now flow:", err);
      // Still navigate even if there's an error
      navigate("/order_cus");
    }
  };

  return (
    // Fixed height + all slides stacked: images load once and cross-fade, so nothing jumps
    <div className="relative mb-4 h-[170px] overflow-hidden rounded-2xl bg-line">
      {banners.map((banner, index) => (
        <img
          key={banner.image}
          src={banner.image}
          alt=""
          aria-hidden={index !== currentIndex}
          fetchPriority={index === 0 ? "high" : "low"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Overlay layer for contrast */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/65 via-black/35 to-black/10" />

      {/* Text content and button */}
      <div className="absolute inset-0 flex flex-col items-end justify-center p-4 text-white text-right">
        <h2 className="text-xl font-bold">{banners[currentIndex].title}</h2>
        <p className="text-xs mt-1 tracking-wide">{banners[currentIndex].subtitle}</p>
        <button
          onClick={handleOrderNow}
          className="mt-3 min-h-[40px] bg-white text-brand font-bold px-4 py-2 rounded-xl shadow-md hover:bg-brand-soft active:scale-[0.97] transition"
        >
          Đặt món ngay
        </button>
      </div>

      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((banner, index) => (
          <button
            key={banner.image}
            type="button"
            aria-label={`Khuyến mãi ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
