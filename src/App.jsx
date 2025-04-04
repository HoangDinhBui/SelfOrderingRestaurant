import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import { MenuProvider } from "./context/MenuContext";
import { CartProvider } from "./context/CartContext"; // Đã thêm CartProvider
import Home from "./pages/Customer/Home/Home";
import Menu from "./pages/Customer/Menu/Menu";
import Order from "./pages/Customer/Order/Order";
import ViewItem from "./pages/Customer/ViewItem/ViewItem";
import Note from "./pages/Customer/Note/Note";
import Payment from "./pages/Customer/PayMent/Payment";
import Evaluate from "./pages/Customer/Evaluate/Evaluate";
import Login from "./pages/Staff/Login";
import "./axiosConfig";

function App() {
  return (
    <CartProvider>
      {" "}
      {/* Bọc toàn bộ ứng dụng trong CartProvider */}
      <MenuProvider>
        {" "}
        {/* MenuProvider vẫn được giữ nguyên */}
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/order" element={<Order />} />
            <Route path="/view/:id" element={<ViewItem />} />
            <Route path="/note/:id" element={<Note />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/evaluate" element={<Evaluate />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </MenuProvider>
    </CartProvider>
=======
// import Home from "./pages/Customer/Home/Home";
// import Menu from './pages/Customer/Menu/Menu';
// import Order from './pages/Customer/Order/Order'; // Import trang Order
// import ViewItem from "./pages/Customer/ViewItem/ViewItem";
// import Note from "./pages/Customer/Note/Note";
// import Payment from "./pages/Customer/PayMent/Payment";
// import Evaluate from "./pages/Customer/Evaluate/Evaluate";
import Login from "./pages/Staff/Login/Login";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";

function App() {
  return (
    <Router>
        <Routes>
          {/* <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} /> 
          <Route path="/view/:id" element={<ViewItem />} /> 
          <Route path="/note/:id" element={<Note />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/evaluate" element={<Evaluate />} />  */}
          <Route path="/login" element={<Login />} /> 
          <Route path="/staff-information" element={<StaffInformation />} />

        

          
        </Routes>
    </Router>
>>>>>>> 6933bb965cf169a3d8759887f2ede830d8f52708
  );
}

export default App;
