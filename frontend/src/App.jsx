import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { MenuProvider } from "./context/MenuContext";
import { CartProvider } from "./context/CartContext";
import client from "./apollo-client";
import "./axiosConfig";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RequireRole from "./components/RequireRole";

import Home from "./pages/Customer/Home/Home";
import Menu from "./pages/Customer/Menu/Menu";
import Order from "./pages/Customer/Order/Order";
import ViewItem from "./pages/Customer/ViewItem/ViewItem";
import Note from "./pages/Customer/Note/Note";
import Payment from "./pages/Customer/PayMent/Payment";
import Evaluate from "./pages/Customer/Evaluate/Evaluate";
import CreateTable from "./components/CreateTable";
import CaptivePortal from "./pages/Customer/CaptivePortal/CaptivePortal";

import AdminInformation from "./pages/Admin/AdminInformation/AdminInformation";
import DishManagementAdmin from "./pages/Admin/DishManagement/DishManagment";
import EvaluateAdmin from "./pages/Admin/Evaluate/Evaluate";
import InventoryManagement from "./pages/Admin/InventoryManagement/InventoryManagement";
import Login from "./pages/Staff/Login/Login";
import NotificationManagementStaff from "./pages/Staff/NotificationManagement/NotificationManagement";
import OrderHistoryAdmin from "./pages/Admin/OrderHistory/OrderHistory";
import TableManagementAdmin from "./pages/Admin/TableManagement/TableManagement";
import MenuManagementAdmin from "./pages/Admin/MenuManagement/MenuManagement";
import RevenueManagement from "./pages/Admin/RevenueManagement/RevenueManagement";
import StaffManagement from "./pages/Admin/StaffManagement/StaffManagement";
import UserManagementAdmin from "./pages/Admin/UserManagement/UserManagement";

import DishManagementStaff from "./pages/Staff/DishManagement/DishManagement";
import OrderHistoryStaff from "./pages/Staff/OrderHistory/OrderHistory";
import TableManagementStaff from "./pages/Staff/TableManagement/TableManagement";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";

import Attendance from "./pages/Staff/Attendance/Attendance";

function App() {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <MenuProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/captive-portal" replace />}
              />
              <Route path="/table/:tableNumber" element={<Home />} />
              <Route path="/create-table" element={<RequireRole roles={["ADMIN"]}><CreateTable /></RequireRole>} />
              <Route
                path="/create-table/:tableNumber"
                element={<RequireRole roles={["ADMIN"]}><CreateTable /></RequireRole>}
              />
              <Route path="/menu_cus" element={<Menu />} />
              <Route path="/order_cus" element={<Order />} />
              <Route path="/viewitem/:id" element={<ViewItem />} />
              <Route path="/note_cus/:id" element={<Note />} />
              <Route path="/payment_cus" element={<Payment />} />
              <Route path="/evaluate_cus" element={<Evaluate />} />
              <Route path="/captive-portal" element={<CaptivePortal />} />

              <Route path="/login" element={<Login />} />
              <Route
                path="/dish-management_staff"
                element={<RequireRole roles={["STAFF", "ADMIN"]}><DishManagementStaff /></RequireRole>}
              />
              <Route
                path="/notification-management"
                element={<RequireRole roles={["STAFF", "ADMIN"]}><NotificationManagementStaff /></RequireRole>}
              />
              <Route
                path="/table-management_admin"
                element={<RequireRole roles={["ADMIN"]}><TableManagementAdmin /></RequireRole>}
              />
              <Route path="/evaluate_admin" element={<RequireRole roles={["ADMIN"]}><EvaluateAdmin /></RequireRole>} />
              <Route
                path="/menu-management_admin"
                element={<RequireRole roles={["ADMIN"]}><MenuManagementAdmin /></RequireRole>}
              />
              <Route
                path="/revenue-management_admin"
                element={<RequireRole roles={["ADMIN"]}><RevenueManagement /></RequireRole>}
              />
              <Route
                path="/staff-management_admin"
                element={<RequireRole roles={["ADMIN"]}><StaffManagement /></RequireRole>}
              />
              <Route
                path="/user-management_admin"
                element={<RequireRole roles={["ADMIN"]}><UserManagementAdmin /></RequireRole>}
              />
              <Route
                path="/admin-information_admin"
                element={
                  <RequireRole roles={["ADMIN"]}><AdminInformation /></RequireRole>
                }
              />
              <Route
                path="/dish-management_admin"
                element={<RequireRole roles={["ADMIN"]}><DishManagementAdmin /></RequireRole>}
              />
              <Route
                path="/order-history_admin"
                element={<RequireRole roles={["ADMIN"]}><OrderHistoryAdmin /></RequireRole>}
              />
              <Route
                path="/inventory-management_admin"
                element={<RequireRole roles={["ADMIN"]}><InventoryManagement /></RequireRole>}
              />
              <Route
                path="/dish-management"
                element={<RequireRole roles={["STAFF", "ADMIN"]}><DishManagementStaff /></RequireRole>}
              />
              <Route
                path="/staff-information_staff"
                element={
                  <RequireRole roles={["STAFF", "ADMIN"]}><StaffInformation /></RequireRole>
                }
              />
              <Route
                path="/table-management_staff"
                element={<RequireRole roles={["STAFF", "ADMIN"]}><TableManagementStaff /></RequireRole>}
              />
              <Route path="/order-history" element={<RequireRole roles={["STAFF", "ADMIN"]}><OrderHistoryStaff /></RequireRole>} />
              <Route
                path="/attendance"
                element={
                  <RequireRole roles={["STAFF"]}><Attendance /></RequireRole>
                }
              />
            </Routes>
          </Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </MenuProvider>
      </CartProvider>
    </ApolloProvider>
  );
}

export default App;
