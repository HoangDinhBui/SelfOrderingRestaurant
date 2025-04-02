import Header from "../../../components/layout/Header";
import Banner from "../../../components/ui/Banner";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const specialDishes = [
    { name: "Lemon Macarons", price: "10.99", image: "/src/assets/img/TodaySpeacial1.jpg", type: "Cake" },
    { name: "Beef-steak", price: "10.99", image: "/src/assets/img/TodaySpecial2.jpg", type: "Meat" }
  ];

  const navigate = useNavigate(); // Sử dụng useNavigate để chuyển hướng

  return (
    <div className="px-2 py-4">
      <Header />
      <Banner />

      {/* Bố cục 2 cột */}
      <section className="mt-4 grid grid-cols-2 gap-4">
        {/* Cột bên trái */}
        <div>
          {/* Thông tin khách hàng */}
          <div className="text-center mb-4">
            <p className="text-lg">
              Good Morning <span className="text-blue-500 font-semibold">Customer!</span>
            </p>
            <p className="text-gray-600">
              We will deliver your food to your table: <strong>A6</strong>
            </p>
          </div>

          {/* Nút Login */}
          <div className="relative">
            <img
              src="/src/assets/img/homelogin.jpg"
              alt="Login"
              className="w-full h-[100px] object-cover rounded-lg"
            />
            <a
              href="/login"
              className="absolute inset-0 flex items-center justify-center bg-black/20 font-bold rounded-lg"
            >
              Login
            </a>
          </div>
        </div>

        {/* Cột bên phải */}
        <div className="grid grid-cols-2 gap-4">
          {/* Nút Call Staff */}
          <div className="relative">
            <button
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/callstaff.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              Call Staff
            </button>
          </div>

          {/* Nút Call Payment */}
          <div className="relative">
            <button
              onClick={() => navigate("/payment")} // Chuyển hướng đến trang Payment
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/callpayment.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              Call Payment
            </button>
          </div>

          {/* Nút View Menu - Order */}
          <div className="relative col-span-2">
            <button
              onClick={() => navigate("/menu")} // Chuyển hướng đến trang Menu
              className="absolute inset-0 flex items-center justify-center text-black font-bold rounded-lg"
              style={{
                backgroundImage: "url('/src/assets/img/viewmenu.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              View menu - Order
            </button>
          </div>
        </div>
      </section>

      {/* Danh sách món ăn đặc biệt */}
      <section className="mt-6">
        {/* Tiêu đề và nút mũi tên */}
        <div className="flex items-center space-x-2 mb-3">
          <h2 className="text-xl font-bold">Today's Special</h2>
          <button className="text-black text-sm font-semibold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 ml-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Danh sách món ăn */}
        <div className="grid grid-cols-2 gap-4">
          {specialDishes.map((dish, index) => (
            <div key={index} className="flex flex-col items-start">
              {/* Hình ảnh món ăn */}
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-[150px] object-cover rounded-lg mb-2"
              />
              {/* Loại món ăn */}
              <p className="text-sm text-gray-500">{dish.type}</p>
              {/* Tên món ăn */}
              <p className="text-lg font-semibold">{dish.name}</p>
              {/* Giá món ăn */}
              <p className="text-sm font-bold text-gray-800">${dish.price}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;