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
import UpdateNotifier from "./components/UpdateNotifier";
import NoStaffNotice from "./components/NoStaffNotice";

// After a deploy the old hashed page chunks are gone, so opening another page in a tab that was
// loaded before the deploy fails to download. Instead of crashing, show the update popup.
const lazyWithReload = (load) =>
  lazy(() =>
    load().catch((err) => {
      console.error("Failed to load page chunk:", err);
      window.dispatchEvent(new Event("app:update-available"));
      return { default: PageLoader };
    })
  );

const Home = lazyWithReload(() => import("./pages/Customer/Home/Home"));
const Menu = lazyWithReload(() => import("./pages/Customer/Menu/Menu"));
const Order = lazyWithReload(() => import("./pages/Customer/Order/Order"));
const ViewItem = lazyWithReload(() => import("./pages/Customer/ViewItem/ViewItem"));
const Note = lazyWithReload(() => import("./pages/Customer/Note/Note"));
const Payment = lazyWithReload(() => import("./pages/Customer/PayMent/Payment"));
const Evaluate = lazyWithReload(() => import("./pages/Customer/Evaluate/Evaluate"));
const CreateTable = lazyWithReload(() => import("./components/CreateTable"));
const CaptivePortal = lazyWithReload(() => import("./pages/Customer/CaptivePortal/CaptivePortal"));
const Reservation = lazyWithReload(() => import("./pages/Customer/Reservation/Reservation"));

const AdminInformation = lazyWithReload(() => import("./pages/Admin/AdminInformation/AdminInformation"));
const DishManagementAdmin = lazyWithReload(() => import("./pages/Admin/DishManagement/DishManagment"));
const EvaluateAdmin = lazyWithReload(() => import("./pages/Admin/Evaluate/Evaluate"));
const InventoryManagement = lazyWithReload(() => import("./pages/Admin/InventoryManagement/InventoryManagement"));
const Login = lazyWithReload(() => import("./pages/Staff/Login/Login"));
const NotificationManagementStaff = lazyWithReload(() => import("./pages/Staff/NotificationManagement/NotificationManagement"));
const OrderHistoryAdmin = lazyWithReload(() => import("./pages/Admin/OrderHistory/OrderHistory"));
const TableManagementAdmin = lazyWithReload(() => import("./pages/Admin/TableManagement/TableManagement"));
const MenuManagementAdmin = lazyWithReload(() => import("./pages/Admin/MenuManagement/MenuManagement"));
const RevenueManagement = lazyWithReload(() => import("./pages/Admin/RevenueManagement/RevenueManagement"));
const StaffManagement = lazyWithReload(() => import("./pages/Admin/StaffManagement/StaffManagement"));
const ShiftSchedule = lazyWithReload(() => import("./pages/Admin/ShiftSchedule/ShiftSchedule"));
const UserManagementAdmin = lazyWithReload(() => import("./pages/Admin/UserManagement/UserManagement"));

const DishManagementStaff = lazyWithReload(() => import("./pages/Staff/DishManagement/DishManagement"));
const OrderHistoryStaff = lazyWithReload(() => import("./pages/Staff/OrderHistory/OrderHistory"));
const TableManagementStaff = lazyWithReload(() => import("./pages/Staff/TableManagement/TableManagement"));
const StaffInformation = lazyWithReload(() => import("./pages/Staff/StaffInformation/StaffInformation"));

const Attendance = lazyWithReload(() => import("./pages/Staff/Attendance/Attendance"));

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
          <UpdateNotifier />
          <NoStaffNotice />
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
