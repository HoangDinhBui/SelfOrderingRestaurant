import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Customer/Home/Home";
// import Menu from './pages/Customer/Menu/Menu';
// import Order from './pages/Customer/Order/Order'; // Import trang Order
// import ViewItem from "./pages/Customer/ViewItem/ViewItem";
// import Note from "./pages/Customer/Note/Note";
// import Payment from "./pages/Customer/PayMent/Payment";
// import Evaluate from "./pages/Customer/Evaluate/Evaluate";
import Login from "./pages/Staff/Login/Login";
import StaffInformation from "./pages/Staff/StaffInformation/StaffInformation";
import DishManagement from "./pages/Admin/DishManagement";

function App() {
  return (
    <Router>
        <Routes>
          {/* <Route path="/" element={<Home />} />
          {/* <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} /> 
          <Route path="/view/:id" element={<ViewItem />} /> 
          <Route path="/note/:id" element={<Note />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/evaluate" element={<Evaluate />} />  */}
          {/* <Route path="/login" element={<Login />} /> 
          <Route path="/" element={<StaffInformation />} /> */}
          <Route path="/" element={<DishManagement/>}/>

        

          
        </Routes>
    </Router>
  );
}

export default App;