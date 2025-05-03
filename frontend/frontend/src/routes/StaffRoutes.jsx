import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import client from "./apollo-client";
import App from "./App";
import Login from "./components/Login";
import DishManagementStaff from "./components/DishManagementStaff";
import NotificationManagementStaff from "./components/NotificationManagementStaff";
import OrderHistoryStaff from "./components/OrderHistoryStaff";
import StaffInformation from "./components/StaffInformation";
import TableManagementStaff from "./components/TableManagementStaff";

ReactDOM.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dish-management" element={<DishManagementStaff />} />
        <Route path="/notification-management" element={<NotificationManagementStaff />} />
        <Route path="/order-history" element={<OrderHistoryStaff />} />
        <Route path="/staff-information_staff" element={<StaffInformation />} />
        <Route path="/table-management_staff" element={<TableManagementStaff />} />
      </Routes>
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById("root")
);