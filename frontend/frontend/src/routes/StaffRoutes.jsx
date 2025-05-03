import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import client from "./apollo-client";
import DishManagementStaff from "./components/DishManagementStaff";
import App from "./App";

ReactDOM.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/dish-management/:orderId"
          element={<DishManagementStaff />}
        />
      </Routes>
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById("root")
);
