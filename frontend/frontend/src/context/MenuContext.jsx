import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/Staff")
      .then((response) => {
        console.log("Menu context loaded:", response.data);
        setMenuItems(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error in MenuContext:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Add function to get a single dish by ID
  const getDishById = async (dishId) => {
    try {
      setLoading(true);
      console.log(`Calling API for dish ID: ${dishId}`);
      const response = await axios.get(
        `http://localhost:8080/api/Staff/${dishId}`
      );
      console.log("API Response:", response.data);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error(`Error fetching dish ${dishId}:`, error);
      setError("Failed to load dish details. Please try again!");
      setLoading(false);
      throw error;
    }
  };

  return (
    <MenuContext.Provider value={{ menuItems, loading, error, getDishById }}>
      {children}
    </MenuContext.Provider>
  );
};
