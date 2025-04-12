import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MenuProvider } from "./context/MenuContext";
import { CartProvider } from "./context/CartContext";
import "./axiosConfig";

// Customer Pages
import Home from "./pages/Customer/Home/Home";
import Menu from "./pages/Customer/Menu/Menu";
import Order from "./pages/Customer/Order/Order";
import ViewItem from "./pages/Customer/ViewItem/ViewItem";
import Note from "./pages/Customer/Note/Note";
import Payment from "./pages/Customer/PayMent/Payment";
import Evaluate from "./pages/Customer/Evaluate/Evaluate";

// Staff/Admin Pages
import Login from "./pages/Staff/Login/Login";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";
import NotificationManagement from "./pages/Staff/NotificationManagement/NotificationManagement";
import DishManagement from "./pages/Staff/DishManagement/DishManagement";
import TableManagement from "./pages/Staff/TableManagement/TableManagement";
import MenuManagement from "./pages/Admin/MenuManagement/MenuManagement";
import RevenueManagement from "./pages/Admin/RevenueManagement/RevenueManagement";
import AdminInformation from "./pages/Admin/AdminInformation/AdminInformation";
function App() {
  return (
    <CartProvider>
      <MenuProvider>
        <Router>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/order" element={<Order />} />
            <Route path="/view/:id" element={<ViewItem />} />
            <Route path="/note/:id" element={<Note />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/evaluate" element={<Evaluate />} />
            
            {/* Staff/Admin Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/staff-information" element={<StaffInformation />} />
            <Route path="/notification-management" element={<NotificationManagement />} />
            <Route path="/dish-management" element={<DishManagement />} />
            <Route path="/table-management" element={<TableManagement />} />
            <Route path="/menu-management" element={<MenuManagement />} />
            <Route path="/revenue-management" element={<RevenueManagement />} />
            <Route path="/admin-information" element={<AdminInformation />} />
          </Routes>
        </Router>
      </MenuProvider>
    </CartProvider>
  );
}

export default App;