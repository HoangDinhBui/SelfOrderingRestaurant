import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Customer/Home/Home";
// import Menu from './pages/Customer/Menu/Menu';
// import Order from './pages/Customer/Order/Order';
// import ViewItem from "./pages/Customer/ViewItem/ViewItem";
// import Note from "./pages/Customer/Note/Note";
// import Payment from "./pages/Customer/PayMent/Payment";
// import Evaluate from "./pages/Customer/Evaluate/Evaluate";

import Login from "./pages/Staff/Login/Login";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";
import OrderManagement from "./pages/Staff/OrderManagement/OrderManagement";
import NotificationManagement from "./pages/Staff/NotificationManagement/NotificationManagement";
import DishManagement from "./pages/Admin/DishManagement";

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer routes (commented out) */}
        {/* <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/order" element={<Order />} />
        <Route path="/view/:id" element={<ViewItem />} />
        <Route path="/note/:id" element={<Note />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/evaluate" element={<Evaluate />} /> */}

        {/* Staff/Admin routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/staff-information" element={<StaffInformation />} />
        <Route path="/order-management" element={<OrderManagement />} />
        <Route path="/notification-management" element={<NotificationManagement />} />
        <Route path="/dish-management" element={<DishManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
