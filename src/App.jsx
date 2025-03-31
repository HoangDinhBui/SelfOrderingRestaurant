import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Menu from './pages/Menu/Menu';
import Order from './pages/Order/Order'; // Import trang Order

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/order" element={<Order />} /> {/* Thêm route cho trang Order */}
      </Routes>
    </Router>
  );
}

export default App;