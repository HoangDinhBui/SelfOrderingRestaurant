import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminInformation from "../pages/Admin/AdminInformation/AdminInformation";
import DishManagementAdmin from "../pages/Admin/DishManagement/DishManagement";
import Evaluate from "../pages/Admin/Evaluate/Evaluate";
import InventoryManagement from "../pages/Admin/InventoryManagement/InventoryManagement";
import Login from "../pages/Staff/Login/Login";
import NotificationManagementStaff from "../pages/Staff/NotificationManagement/NotificationManagement";
import OrderHistoryAdmin from "../pages/Admin/OrderHistory/OrderHistory";
import TableManagementAdmin from "../pages/Admin/TableManagement/TableManagement";
import MenuManagementAdmin from "../pages/Admin/MenuManagement/MenuManagement";
import RevenueManagement from "../pages/Admin/RevenueManagement/RevenueManagement";
import StaffManagement from "../pages/Admin/StaffManagement/StaffManagement";

const AdminRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dish-management" element={<DishManagementAdmin />} />
        <Route path="/notification-management" element={<NotificationManagementStaff />} />
        <Route path="/order-history" element={<OrderHistoryAdmin />} />
        <Route path="/admin-infomation_admin" element={<AdminInformation />} />
        <Route path="/table-management_admin" element={<TableManagementAdmin />} />
        <Route path="/evaluate_admin" element={<Evaluate />} />
        <Route path="/menu-management_admin" element={<MenuManagementAdmin />} />
        <Route path="/revenue-management_admin" element={<RevenueManagement />} />
        <Route path="/staff-management_admin" element={<StaffManagement />} />
        <Route path="/inventory-management_admin" element={<InventoryManagement />} />
      </Routes>
    </Router>
  );
};
export default AdminRoutes;
