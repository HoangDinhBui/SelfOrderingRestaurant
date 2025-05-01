import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu items on component mount
  useEffect(() => {
    // Get all dishes from the API
    axios
      .get("http://localhost:8080/api/dishes")
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

  // Function to get a single dish by ID
  // This is used in ViewItem component when navigating from menu
  const getDishById = async (dishId) => {
    try {
      // Set loading state
      setLoading(true);

      // Check if we can use cached data first
      const cachedDishStr = localStorage.getItem("currentDish");
      if (cachedDishStr) {
        try {
          const parsedDish = JSON.parse(cachedDishStr);
          // Check if the cached dish matches the requested ID
          if (
            parsedDish.dishId === parseInt(dishId) ||
            parsedDish.id === parseInt(dishId)
          ) {
            console.log("Using cached dish data:", parsedDish);
            setLoading(false);
            return parsedDish;
          }
        } catch (parseErr) {
          console.error("Error parsing cached dish:", parseErr);
          // Continue to API call if parse fails
        }
      }

      // If not in cache or not matching, call the API
      console.log(`Calling API for dish ID: ${dishId}`);
      const response = await axios.get(
        `http://localhost:8080/api/dishes/${dishId}`
      );
      console.log("API Response:", response.data);

      // Cache the result for future use
      localStorage.setItem("currentDish", JSON.stringify(response.data));

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

export default MenuProvider;
