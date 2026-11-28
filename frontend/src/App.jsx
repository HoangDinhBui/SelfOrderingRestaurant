import { lazy, Suspense } from "react";
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
import PageLoader from "./components/ui/PageLoader";

const Home = lazy(() => import("./pages/Customer/Home/Home"));
const Menu = lazy(() => import("./pages/Customer/Menu/Menu"));
const Order = lazy(() => import("./pages/Customer/Order/Order"));
const ViewItem = lazy(() => import("./pages/Customer/ViewItem/ViewItem"));
const Note = lazy(() => import("./pages/Customer/Note/Note"));
const Payment = lazy(() => import("./pages/Customer/PayMent/Payment"));
const Evaluate = lazy(() => import("./pages/Customer/Evaluate/Evaluate"));
const CreateTable = lazy(() => import("./components/CreateTable"));
const CaptivePortal = lazy(() => import("./pages/Customer/CaptivePortal/CaptivePortal"));
const Reservation = lazy(() => import("./pages/Customer/Reservation/Reservation"));

const AdminInformation = lazy(() => import("./pages/Admin/AdminInformation/AdminInformation"));
const DishManagementAdmin = lazy(() => import("./pages/Admin/DishManagement/DishManagment"));
const EvaluateAdmin = lazy(() => import("./pages/Admin/Evaluate/Evaluate"));
const InventoryManagement = lazy(() => import("./pages/Admin/InventoryManagement/InventoryManagement"));
const Login = lazy(() => import("./pages/Staff/Login/Login"));
const NotificationManagementStaff = lazy(() => import("./pages/Staff/NotificationManagement/NotificationManagement"));
const OrderHistoryAdmin = lazy(() => import("./pages/Admin/OrderHistory/OrderHistory"));
const TableManagementAdmin = lazy(() => import("./pages/Admin/TableManagement/TableManagement"));
const MenuManagementAdmin = lazy(() => import("./pages/Admin/MenuManagement/MenuManagement"));
const RevenueManagement = lazy(() => import("./pages/Admin/RevenueManagement/RevenueManagement"));
const StaffManagement = lazy(() => import("./pages/Admin/StaffManagement/StaffManagement"));
const ShiftSchedule = lazy(() => import("./pages/Admin/ShiftSchedule/ShiftSchedule"));
const UserManagementAdmin = lazy(() => import("./pages/Admin/UserManagement/UserManagement"));

const DishManagementStaff = lazy(() => import("./pages/Staff/DishManagement/DishManagement"));
const OrderHistoryStaff = lazy(() => import("./pages/Staff/OrderHistory/OrderHistory"));
const TableManagementStaff = lazy(() => import("./pages/Staff/TableManagement/TableManagement"));
const StaffInformation = lazy(() => import("./pages/Staff/StaffInformation/StaffInformation"));

const Attendance = lazy(() => import("./pages/Staff/Attendance/Attendance"));

function App() {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <MenuProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/reservation" element={<Reservation />} />

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
              <Route path="/evaluate_admin" element={<RequireRole roles={["ADMIN", "STAFF"]}><EvaluateAdmin /></RequireRole>} />
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
                path="/shift-schedule_admin"
                element={<RequireRole roles={["ADMIN"]}><ShiftSchedule /></RequireRole>}
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
            </Suspense>
          </Router>
          <ToastContainer
            position="top-center"
            autoClose={3500}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={3}
          />
        </MenuProvider>
      </CartProvider>
    </ApolloProvider>
  );
}

export default App;
