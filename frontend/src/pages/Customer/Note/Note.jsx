import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";

import { BACKEND_URL } from "../../../config";
const Note = () => {
  const { id } = useParams(); // Get dish ID from URL
  const navigate = useNavigate();
  const location = useLocation();
  const dishName = location.state?.name || `Item ${id}`;

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Get cart context with all methods
  const { cartItems, updateItemNotes, fetchCartData } = useContext(CartContext);

  // API base URL
  const API_BASE_URL = BACKEND_URL;

  // Ensure cart data is loaded
  useEffect(() => {
    // Try to fetch cart data when component mounts
    try {
      console.log("Fetching cart data...");
      fetchCartData();
    } catch (err) {
      console.error("Failed to fetch cart data:", err);
    }
  }, [fetchCartData]);

  // Load existing note when component mounts
  useEffect(() => {
    console.log("Current cart items:", cartItems);
    console.log("Looking for dish ID:", id, "type:", typeof id);

    // Try different formats of ID to find the item
    const cartItem = cartItems.find(
      (item) =>
        item.dishId === parseInt(id) || // Try as integer
        item.dishId === id || // Try direct comparison
        item.dishId === String(id) || // Try as string
        String(item.dishId) === String(id) // Convert both to string
    );

    console.log("Found cart item:", cartItem);

    if (cartItem && cartItem.notes) {
      console.log("Using notes from cart item:", cartItem.notes);
      setNote(cartItem.notes);
    } else {
      // Fallback to localStorage
      const savedNote = localStorage.getItem(`note-${id}`);
      if (savedNote) {
        console.log("Using notes from localStorage:", savedNote);
        setNote(savedNote);
      }
    }
  }, [cartItems, id]);

  // Save note function using GraphQL
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Always save in localStorage as backup
      localStorage.setItem(`note-${id}`, note);

      // Check if item is in local cart state - try multiple ID formats
      const itemInCart = cartItems.find(
        (item) =>
          item.dishId === parseInt(id, 10) ||
          item.dishId === id ||
          String(item.dishId) === String(id)
      );

      if (itemInCart) {
        try {
          // Try to update using GraphQL mutation
          const graphqlMutation = {
            query: `
              mutation UpdateItemNotes($dishId: ID!, $input: UpdateItemNotesInput!) {
                updateItemNotes(dishId: $dishId, input: $input) {
                  items {
                    dishId
                    dishName
                    quantity
                    price
                    notes
                  }
                  totalAmount
                }
              }
            `,
            variables: {
              dishId: id,
              input: {
                notes: note,
              },
            },
          };

          const response = await fetch(`${API_BASE_URL}/graphql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Important for session cookies
            body: JSON.stringify(graphqlMutation),
          });

          const result = await response.json();

          if (result.errors) {
            throw new Error(result.errors[0].message || "Lỗi khi cập nhật ghi chú");
          }

          // Call context method to update local state
          await updateItemNotes(parseInt(id, 10), note);

          console.log("Note updated successfully");
          navigate(-1);
        } catch (apiError) {
          console.error("API error:", apiError);
          setError(
            `Lỗi máy chủ: ${
              apiError.message || "không rõ"
            }. Ghi chú đã được lưu trên máy.`
          );
          // Stay on page to show error
        }
      } else {
        // Item not in cart, just store locally and inform user
        console.log("Item not in cart locally, stored note locally");
        setError("Món không có trong giỏ. Ghi chú chỉ được lưu trên máy.");
        setTimeout(() => navigate(-1), 2000);
      }
    } catch (err) {
      console.error("General error:", err);
      setError("Không lưu được ghi chú lên máy chủ. Ghi chú đã được lưu trên máy.");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(-1); // Go back without saving
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-card/95 backdrop-blur border-b border-line sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center px-2 h-14">
          <button
            onClick={handleCancel}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
            aria-label="Quay lại"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-ink pr-11">Ghi chú cho bếp</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 page-enter">
        <p className="text-sm text-ink-muted">Món</p>
        <h2 className="text-xl font-bold text-ink">{dishName}</h2>

        {error && (
          <div role="alert" className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <label htmlFor="dish-note" className="sr-only">
          Yêu cầu đặc biệt
        </label>
        <textarea
          id="dish-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-4 w-full h-48 p-4 bg-white border border-line rounded-2xl text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="VD: ít cay, không hành, mang ra sau..."
        />

        <div className="mt-2 flex flex-wrap gap-2">
          {["Ít cay", "Không hành", "Không đá", "Ít đường"].map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setNote((prev) => (prev ? `${prev}, ${hint.toLowerCase()}` : hint))}
              className="min-h-[36px] px-3 rounded-full border border-line bg-white text-sm text-ink hover:border-brand/40 transition"
            >
              + {hint}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleCancel}
            className="h-12 rounded-xl border border-line bg-white font-semibold text-ink hover:bg-brand-soft transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover transition disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu ghi chú"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Note;
