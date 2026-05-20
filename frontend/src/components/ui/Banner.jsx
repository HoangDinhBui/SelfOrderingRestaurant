import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import CartContext with the correct path
import { CartContext } from "../../context/CartContext";

const Banner = () => {
  const navigate = useNavigate();
  // Access CartContext safely with destructuring and default empty object
  const cartContext = useContext(CartContext) || {};
  const { fetchCartData, refreshCart } = cartContext;

  const banners = [
    {
      image: "/src/assets/img/banner2.jpg",
      title: "Up to 40% OFF",
      subtitle: "ON YOUR FIRST ORDER",
    },
    {
      image: "/src/assets/img/promofood.jpg",
      title: "Free Delivery",
      subtitle: "FOR ORDERS OVER $50",
    },
    {
      image: "/src/assets/img/promo.jpg",
      title: "New Arrivals",
      subtitle: "CHECK OUT OUR LATEST MENU",
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
        const API_BASE_URL = "http://localhost:8080";

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
                "Content-Type": "application/json",
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
    <div className="relative mb-4 overflow-hidden">
      {/* Banner image */}
      <img
        src={banners[currentIndex].image}
        alt="Promotion Banner"
        className="w-full h-[170px] rounded-lg object-cover transform scale-110 transition-transform duration-500"
      />

      {/* Overlay layer for contrast */}
      <div className="absolute inset-0 bg-black/40 rounded-lg"></div>

      {/* Text content and button */}
      <div className="absolute inset-0 flex flex-col items-end justify-center p-4 text-white text-right">
        <h2 className="text-lg font-bold">{banners[currentIndex].title}</h2>
        <p className="text-xs mt-1">{banners[currentIndex].subtitle}</p>
        <button
          onClick={handleOrderNow}
          className="mt-2 bg-white text-red-500 font-bold px-3 py-1 rounded-lg shadow-md hover:bg-gray-200"
        >
          ORDER NOW
        </button>
      </div>
    </div>
  );
};

export default Banner;
