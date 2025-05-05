import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import MenuBarStaff from "../../../components/layout/menuBar";
import MenuBar from "../../../components/layout/menuBar";

const DishManagementAdmin = () => {
  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Dữ liệu mẫu đơn giản
  const [Staff, setStaff] = useState([
    { id: 1, table: 1, name: "Salad Landaise", quantity: 1, note: "" },
    { id: 2, table: 1, name: "Magret De Canard", quantity: 1, note: "" },
    {
      id: 3,
      table: 3,
      name: "Tartare De Saumon",
      quantity: 2,
      note: "Add lemon",
    },
    {
      id: 4,
      table: 3,
      name: "Huitres Gratinées (6PCS)",
      quantity: 1,
      note: "",
    },
  ]);

  // Function to open confirmation dialog
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowConfirmation(true);
  };

  // Function to confirm deletion
  const confirmDelete = () => {
    if (itemToDelete) {
      setStaff(Staff.filter((dish) => dish.id !== itemToDelete));
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setShowConfirmation(false);
    setItemToDelete(null);
  };

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      {/* Background blur khi modal mở */}
      <div className={`h-full w-full ${showConfirmation ? "blur-sm" : ""}`}>
        {/* Thay thế Header bằng MenuBar */}
        <MenuBar
          title="Dish Management"
          icon="https://img.icons8.com/?size=100&id=99345&format=png&color=FFFFFF"
        />

        {/* Main Content - Đơn giản hóa */}
        <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Current Staff</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="py-3 px-4 text-left">Table</th>
                    <th className="py-3 px-4 text-left">Dish name</th>
                    <th className="py-3 px-4 text-left">Quantity</th>
                    <th className="py-3 px-4 text-left">Note</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Staff.map((dish) => (
                    <tr key={dish.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{dish.table}</td>
                      <td className="py-3 px-4">{dish.name}</td>
                      <td className="py-3 px-4">{dish.quantity}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {dish.note || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          className="focus:outline-none"
                          onClick={() => handleDeleteClick(dish.id)}
                          aria-label="Delete"
                        >
                          <FontAwesomeIcon
                            icon={faCircleXmark}
                            className="text-red-500 hover:text-red-600 text-xl transition-colors"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay với blur */}
          <div className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"></div>

          {/* Modal content */}
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 relative z-50">
            <div className="flex flex-col items-center mb-4">
              {/* Thêm flex và items-center để căn giữa theo chiều ngang */}
              <div className="flex justify-center mb-2">
                <img
                  alt="Logo"
                  className="w-24 h-24"
                  src="../../src/assets/img/logoremovebg.png"
                />
              </div>
              <p className="text-gray-600 mb-4">ARE YOU SURE?</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                onClick={cancelDelete}
              >
                NO
              </button>
              <button
                className="px-6 py-2 !bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                onClick={confirmDelete}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishManagementAdmin;
