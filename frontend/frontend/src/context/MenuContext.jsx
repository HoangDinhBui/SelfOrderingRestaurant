import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/dishes") // Đổi URL thành API của bạn
      .then((response) => {
        console.log(response.data);
        setMenuItems(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <MenuContext.Provider value={{ menuItems, loading, error }}>
      {children}
    </MenuContext.Provider>
  );
};
