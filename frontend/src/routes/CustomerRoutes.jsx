import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Customer/Home/Home";
import Menu from "../pages/Customer/Menu/Menu";
import Order from "../pages/Customer/Order/Order"; // Import trang Order
import ViewItem from "../pages/Customer/ViewItem/ViewItem";
import Note from "../pages/Customer/Note/Note";
import Payment from "../pages/Customer/PayMent/Payment";
import Evaluate from "../pages/Customer/Evaluate/Evaluate";

const CustomerRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home_cus" element={<Home />} />
        <Route path="/menu_cus" element={<Menu />} />
        <Route path="/order_cus" element={<Order />} />
        <Route path="/viewitem/:id" element={<ViewItem />} />
        <Route path="/note_cus/:id" element={<Note />} />
        <Route path="/payment_cus" element={<Payment />} />
        <Route path="/evaluate_cus" element={<Evaluate />} />
      </Routes>
    </Router>
  );
};
export default CustomerRoutes;
