import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import axios from "axios";

const Note = () => {
  const { id } = useParams(); // Get dish ID from URL
  const navigate = useNavigate();
  const location = useLocation();
  const dishName = location.state?.name || `Item ${id}`;

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { cartItems, updateItemNotes } = useContext(CartContext);

  // API base URL
  const API_BASE_URL = "http://localhost:8080";

  // Load existing note when component mounts
  useEffect(() => {
    // First try to get from cart items
    const cartItem = cartItems.find((item) => item.dishId === parseInt(id));
    if (cartItem && cartItem.notes) {
      setNote(cartItem.notes);
    } else {
      // Fallback to localStorage
      const savedNote = localStorage.getItem(`note-${id}`);
      if (savedNote) {
        setNote(savedNote);
      }
    }
  }, [cartItems, id]);

  // Save note function
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Always save in localStorage as backup
      localStorage.setItem(`note-${id}`, note);

      // Check if item is in local cart state
      const itemInCart = cartItems.find(
        (item) => item.dishId === parseInt(id, 10)
      );

      if (itemInCart) {
        try {
          // Try to update on server
          await updateItemNotes(parseInt(id, 10), note);
          console.log("Note updated successfully");
          navigate(-1);
        } catch (apiError) {
          console.error("API error:", apiError);
          setError(
            `Server error: ${
              apiError.response?.data || apiError.message
            }. Note saved locally.`
          );
          // Stay on page to show error
        }
      } else {
        // Item not in cart, just store locally and inform user
        console.log("Item not in cart locally, stored note locally");
        setError("Item not found in cart. Note saved locally only.");
        setTimeout(() => navigate(-1), 2000);
      }
    } catch (err) {
      console.error("General error:", err);
      setError("Failed to save note. Your note is saved locally.");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(-1); // Go back without saving
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10 flex items-center justify-between w-full max-w-2xl px-4">
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-center flex-1">Note</h2>
        <div className="w-8"></div> {/* Spacer for balance */}
      </div>

      <div className="container mx-auto px-4 max-w-2xl mt-4">
        {/* Dish name */}
        <h3 className="text-center text-orange-500 font-bold text-xl mt-2 mb-4">
          {dishName}
        </h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {/* Note textarea */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-64 p-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          placeholder="Write your special instructions here..."
        ></textarea>

        {/* Action buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="!bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-300"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
          <button
            onClick={handleCancel}
            className="border !border-black text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-300"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default Note;
