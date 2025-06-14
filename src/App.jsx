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
import ProtectedRoute from "./components/ProtectedRoute";

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

import DishManagementStaff from "./pages/Staff/DishManagement/DishManagement";
import OrderHistoryStaff from "./pages/Staff/OrderHistory/OrderHistory";
import TableManagementStaff from "./pages/Staff/TableManagement/TableManagement";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";

import Attendance from "./pages/Staff/Attendance/Attendance";
import CheckOut from "./pages/Staff/CheckOut/CheckOut";

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
              <Route path="/create-table" element={<CreateTable />} />
              <Route
                path="/create-table/:tableNumber"
                element={<CreateTable />}
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
                element={<DishManagementStaff />}
              />
              <Route
                path="/notification-management"
                element={<NotificationManagementStaff />}
              />
              <Route
                path="/table-management_admin"
                element={<TableManagementAdmin />}
              />
              <Route path="/evaluate_admin" element={<EvaluateAdmin />} />
              <Route
                path="/menu-management_admin"
                element={<MenuManagementAdmin />}
              />
              <Route
                path="/revenue-management_admin"
                element={<RevenueManagement />}
              />
              <Route
                path="/staff-management_admin"
                element={<StaffManagement />}
              />
              <Route
                path="/inventory-management_admin"
                element={<InventoryManagement />}
              />
              <Route
                path="/dish-management"
                element={<DishManagementStaff />}
              />
              <Route
                path="/staff-information_staff"
                element={
                  <ProtectedRoute>
                    <StaffInformation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/table-management_staff"
                element={<TableManagementStaff />}
              />
              <Route path="/order-history" element={<OrderHistoryStaff />} />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Attendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/check-out"
                element={
                  <ProtectedRoute>
                    <CheckOut />
                  </ProtectedRoute>
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
