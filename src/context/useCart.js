import { useContext } from "react";
import { CartContext } from "./CartContext";

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
