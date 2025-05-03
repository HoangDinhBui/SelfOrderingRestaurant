import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faRedo } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import MenuBar from "../../../components/layout/MenuBar";

// GraphQL Queries and Mutations
const GET_ORDERS = gql`
  query GetOrders {
    orders {
      orderId
      tableNumber
      status
      paymentStatus
      items {
        dishId
        dishName
        quantity
        notes
        price
      }
    }
  }
`;

const REMOVE_ORDER_ITEM = gql`
  mutation RemoveOrderItem($orderId: ID!, $dishId: ID!) {
    removeOrderItem(orderId: $orderId, dishId: $dishId) {
      orderId
      tableNumber
      status
      paymentStatus
      items {
        dishId
        dishName
        quantity
        notes
        price
      }
    }
  }
`;

const DishManagement = () => {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch unpaid orders
  const { loading, error, data, refetch } = useQuery(GET_ORDERS, {
    onCompleted: (data) => {
      console.log("Query completed with data:", data);
      if (!data?.orders?.length) {
        toast.warn("No unpaid orders found");
      }
    },
    onError: (error) => {
      console.log("Query error:", error);
      toast.error(`Failed to fetch orders: ${error.message}`);
    },
  });

  // Log query state
  console.log("Query state:", { loading, error, data });

  // Filter items for the selected order
  const selectedOrder = data?.orders?.find(
    (order) => order.orderId === selectedOrderId
  );
  const orderItems = selectedOrder
    ? selectedOrder.items.map((item, index) => ({
        id: `${selectedOrder.orderId}-${item.dishId}-${index}`,
        orderId: selectedOrder.orderId,
        dishId: item.dishId,
        table: selectedOrder.tableNumber,
        name: item.dishName,
        quantity: item.quantity,
        note: item.notes || "",
        status: selectedOrder.status || "UNKNOWN",
      }))
    : [];

  // Log orderItems
  console.log("Selected order:", selectedOrder);
  console.log("Transformed orderItems:", orderItems);

  // Delete order item
  const [removeOrderItem] = useMutation(REMOVE_ORDER_ITEM, {
    update(cache, { data: { removeOrderItem } }) {
      const { orders } = cache.readQuery({ query: GET_ORDERS });
      cache.writeQuery({
        query: GET_ORDERS,
        data: {
          orders: orders.map((order) =>
            order.orderId === removeOrderItem.orderId ? removeOrderItem : order
          ),
        },
      });
    },
    onCompleted: () => {
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      console.log("Mutation error:", error);
      toast.error("Failed to delete item: " + error.message);
    },
  });

  // Handle delete click
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowConfirmation(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (itemToDelete) {
      const item = orderItems.find((i) => i.id === itemToDelete);
      if (item) {
        try {
          await removeOrderItem({
            variables: {
              orderId: item.orderId.toString(),
              dishId: item.dishId.toString(),
            },
          });
        } catch (err) {
          console.error("Error deleting item:", err);
        }
      }
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowConfirmation(false);
    setItemToDelete(null);
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      await refetch();
      toast.info("Retrying query...");
    } catch (err) {
      toast.error("Retry failed: " + err.message);
    }
  };

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <div className={`h-full w-full ${showConfirmation ? "blur-sm" : ""}`}>
        <MenuBar
          title="Dish Management"
          icon="https://img.icons8.com/?size=100&id=99345&format=png&color=FFFFFF"
        />
        <div className="flex-1 p-6 bg-rgb(141, 158, 197)-100 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Unpaid Order Items</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Select an Order:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                disabled={loading || !!error}
              >
                <option value="" disabled>
                  Choose an order
                </option>
                {data?.orders?.map((order) => (
                  <option key={order.orderId} value={order.orderId}>
                    Order {order.orderId} (Table {order.tableNumber}, Status:{" "}
                    {order.status || "UNKNOWN"})
                  </option>
                ))}
              </select>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-red-500">
                <p>Error: {error.message}</p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleRetry}
                >
                  <FontAwesomeIcon icon={faRedo} className="mr-2" />
                  Retry
                </button>
              </div>
            ) : !data?.orders?.length ? (
              <p className="text-gray-500">No unpaid orders found.</p>
            ) : !selectedOrderId ? (
              <p className="text-gray-500">
                Please select an order to view items.
              </p>
            ) : !orderItems.length ? (
              <p className="text-gray-500">No items found for this order.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="py-3 px-4 text-left">Order ID</th>
                      <th className="py-3 px-4 text-left">Table</th>
                      <th className="py-3 px-4 text-left">Dish Name</th>
                      <th className="py-3 px-4 text-left">Quantity</th>
                      <th className="py-3 px-4 text-left">Note</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{item.orderId}</td>
                        <td className="py-3 px-4">{item.table}</td>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.quantity}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {item.note || "-"}
                        </td>
                        <td className="py-3 px-4">{item.status}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            className="focus:outline-none"
                            onClick={() => handleDeleteClick(item.id)}
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
            )}
          </div>
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"></div>
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 relative z-50">
            <div className="flex flex-col items-center mb-4">
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

export default DishManagement;
