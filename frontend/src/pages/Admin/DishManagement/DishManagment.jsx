import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import MenuBar from "../../../components/layout/menuBar";
import axios from "axios";

const DishManagementAdmin = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [staff, setStaff] = useState([]);

  const API_BASE_URL = "http://localhost:8080";

  // Lấy token từ localStorage (hoặc hệ thống xác thực của bạn)
  const getAuthToken = () => {
    return localStorage.getItem("accessToken");
  };

  // Lấy danh sách đơn hàng từ GraphQL
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const query = {
          query: `
            query Orders {
              orders {
                orderId
                tableNumber
                items {
                  dishId
                  dishName
                  quantity
                  notes
                  status
                }
              }
            }
          `,
        };
        const response = await axios.post(`${API_BASE_URL}/graphql`, query, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`,
          },
        });
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }
        const orders = response.data.data.orders;
        const staffData = orders.flatMap((order) =>
          order.items.map((item, index) => ({
            id: `${order.orderId}-${item.dishId}-${index}`,
            table: order.tableNumber,
            name: item.dishName,
            quantity: item.quantity,
            note: item.notes || "",
          }))
        );
        setStaff(staffData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(`Lỗi lấy danh sách đơn hàng: ${err.message}`);
      }
    };
    fetchOrders();
  }, []);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowConfirmation(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setStaff(staff.filter((dish) => dish.id !== itemToDelete));
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setItemToDelete(null);
  };

  const handleAcceptOrder = async (tableId, items) => {
  try {
    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    console.log("Processing order for table:", tableId, "Items:", items);

    const mappedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/dishes/name-to-id?name=${encodeURIComponent(item.name)}`,
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`,
              },
              validateStatus: false,
            }
          );
          console.log(`Response for dish "${item.name}":`, response.data, response.status);
          if (response.status !== 200 || !Number.isInteger(response.data.dishId)) {
            throw new Error(`Invalid dishId for "${item.name}": ${JSON.stringify(response.data)}`);
          }
          if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error(`Invalid quantity for "${item.name}": ${item.quantity}`);
          }
          return {
            dishId: response.data.dishId,
            quantity: item.quantity,
          };
        } catch (error) {
          console.error(`Error fetching dishId for "${item.name}":`, error.message);
          throw error;
        }
      })
    );

    const inventoryUpdateRequest = { items: mappedItems };
    console.log("Sending inventory update request:", JSON.stringify(inventoryUpdateRequest, null, 2));

    const inventoryResponse = await axios.post(
      `${API_BASE_URL}/api/inventory/update-by-order`,
      inventoryUpdateRequest,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`,
        },
        validateStatus: false,
      }
    );
    console.log("Inventory update response:", inventoryResponse.data, inventoryResponse.status);

    if (inventoryResponse.status !== 200) {
      throw new Error(`Failed to update inventory: ${inventoryResponse.data.message || inventoryResponse.statusText}`);
    }

    setStaff((prevStaff) => prevStaff.filter((dish) => String(dish.table) !== String(tableId)));
    console.log("Updated staff:", staff.filter((dish) => String(dish.table) !== String(tableId)));
    setSuccessMessage("Cập nhật kho thành công!");
  } catch (error) {
    console.error("Error in handleAcceptOrder:", error.message, error.stack);
    setError(`Lỗi xử lý đơn hàng: ${error.message}`);
  } finally {
    setProcessing(false);
    console.log("Processing state reset to:", false);
  }
};
  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <div className={`h-full w-full ${showConfirmation ? "blur-sm" : ""}`}>
        <MenuBar
          title="Dish Management"
          icon="https://img.icons8.com/?size=50&id=6483&format=png"
        />

        <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Table</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="py-3 px-4 text-left">Table</th>
                    <th className="py-3 px-4 text-left">Dish Name</th>
                    <th className="py-3 px-4 text-left">Quantity</th>
                    <th className="py-3 px-4 text-left">Note</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((dish) => (
                    <tr key={dish.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{dish.table}</td>
                      <td className="py-3 px-4">{dish.name}</td>
                      <td className="py-3 px-4">{dish.quantity}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {dish.note || ""}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          className="delete-button mr-2"
                          onClick={() => handleDeleteClick(dish.id)}
                          aria-label="Delete"
                        >
                          <FontAwesomeIcon
                            icon={faCircleXmark}
                            className="text-red-500 hover:text-red-600 text-xl transition-colors"
                          />
                        </button>
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={() =>
                            handleAcceptOrder(
                              dish.table,
                              staff.filter((item) => item.table === dish.table)
                            )
                          }
                          disabled={processing}
                        >
                          {processing ? "Processing..." : "Accept"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <div className="mt-4 text-red-500">{error}</div>}
            {successMessage && <div className="mt-4 text-green-500">{successMessage}</div>}
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <div className="modal-content">
              <div className="flex justify-center mb-4">
                <img
                  alt="Logo"
                  className="w-24 h-24"
                  src="https://static.vecteezy.com/system/resources/previews/005/337/799/non_2x/icon-image-not-found-free-vector.jpg"
                />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-4">ARE YOU SURE?</p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
                  onClick={() => cancelDelete()}
                >
                  NO
                </button>
                <button
                  className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                  onClick={() => confirmDelete()}
                >
                  YES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishManagementAdmin;