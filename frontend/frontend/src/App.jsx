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

// Customer Pages
import Home from "./pages/Customer/Home/Home";
import Menu from "./pages/Customer/Menu/Menu";
import Order from "./pages/Customer/Order/Order";
import ViewItem from "./pages/Customer/ViewItem/ViewItem";
import Note from "./pages/Customer/Note/Note";
import Payment from "./pages/Customer/PayMent/Payment";
import Evaluate from "./pages/Customer/Evaluate/Evaluate";
import CreateTable from "./components/CreateTable";

// Admin Pages
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

// Staff Pages
import DishManagementStaff from "./pages/Staff/DishManagement/DishManagement";
import OrderHistoryStaff from "./pages/Staff/OrderHistory/OrderHistory";
import TableManagementStaff from "./pages/Staff/TableManagement/TableManagement";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";

function App() {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <MenuProvider>
          <Router>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Navigate to="/table/1" replace />} />
              <Route path="/table/:tableNumber" element={<Home />} />
              <Route path="/create-table" element={<CreateTable />} />
              <Route path="/create-table/:tableNumber" element={<CreateTable />} />
              <Route path="/menu_cus" element={<Menu />} />
              <Route path="/order_cus" element={<Order />} />
              <Route path="/viewitem/:id" element={<ViewItem />} />
              <Route path="/note_cus/:id" element={<Note />} />
              <Route path="/payment_cus" element={<Payment />} />
              <Route path="/evaluate_cus" element={<Evaluate />} />

              {/* Admin Routes */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/dish-management"
                element={<DishManagementAdmin />}
              />
              <Route
                path="/notification-management"
                element={<NotificationManagementStaff />}
              />
              <Route
                path="/admin-infomation_admin"
                element={<AdminInformation />}
              />
              <Route
                path="/table-management_admin"
                element={<TableManagementAdmin />}
              />
              <Route path="/evaluate_admin" element={<EvaluateAdmin />} />
              <Route path="/menu-management_admin" element={<MenuManagementAdmin />}/>
              <Route path="/revenue-management_admin" element={<RevenueManagement />}/>
              <Route path="/staff-management_admin" element={<StaffManagement />}/>
              <Route path="/inventory-management_admin" element={<InventoryManagement />}/>

              {/* Staff Routes */}
              <Route
                path="/dish-management_staff"
                element={<DishManagementStaff />}
              />
              <Route
                path="/staff-information_staff"
                element={<StaffInformation />}
              />
              <Route
                path="/table-management_staff"
                element={<TableManagementStaff />}
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
