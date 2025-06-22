import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { toast } from "react-toastify";
import MenuBar from "../../../components/layout/menuBar";

// GraphQL Queries and Mutations
const GET_ORDERS = gql`
  query GetOrders {
    orders {
      orderId
      tableNumber
      status
      paymentStatus
      totalAmount
      items {
        dishId
        dishName
        quantity
        notes
        price
        status
      }
    }
  }
`;

const UPDATE_ORDER_ITEM_STATUS = gql`
  mutation UpdateOrderItemStatus(
    $orderId: ID!
    $dishId: ID!
    $status: String!
  ) {
    updateOrderItemStatus(orderId: $orderId, dishId: $dishId, status: $status) {
      orderId
      tableNumber
      status
      paymentStatus
      totalAmount
      items {
        dishId
        dishName
        quantity
        notes
        price
        status
      }
    }
  }
`;

const DishManagementStaff = () => {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemStatuses, setItemStatuses] = useState({});

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

  const [updateOrderItemStatus] = useMutation(UPDATE_ORDER_ITEM_STATUS, {
    update(cache, { data: { updateOrderItemStatus } }) {
      const { orders } = cache.readQuery({ query: GET_ORDERS });
      cache.writeQuery({
        query: GET_ORDERS,
        data: {
          orders: orders.map((order) =>
            order.orderId === updateOrderItemStatus.orderId
              ? updateOrderItemStatus
              : order
          ),
        },
      });
    },
    onCompleted: () => {
      toast.success("Item status updated successfully");
      refetch(); // Force refetch to ensure latest data
    },
    onError: (error) => {
      console.log("Mutation error:", error);
      toast.error("Failed to update item status: " + error.message);
    },
  });

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
        status: item.status || "PENDING",
      }))
    : [];

  const handleStatusChange = async (item, newStatus) => {
    const validTransitions = {
      PENDING: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["COMPLETED", "CANCELLED"],
    };
    if (!validTransitions[item.status]?.includes(newStatus)) {
      toast.error(
        `Invalid status transition from ${item.status} to ${newStatus}`
      );
      return;
    }
    console.log(
      `Updating item ${item.dishId} in order ${item.orderId} from ${item.status} to ${newStatus}`
    );
    try {
      await updateOrderItemStatus({
        variables: {
          orderId: item.orderId.toString(),
          dishId: item.dishId.toString(),
          status: newStatus,
        },
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Added function to handle retry on error
  const handleRetry = () => {
    refetch();
  };

  // Added function to cancel deletion and close confirmation dialog
  const cancelDelete = () => {
    setShowConfirmation(false);
    setItemToDelete(null);
  };

  // Added function to confirm deletion by updating status to CANCELLED
  const confirmDelete = async () => {
    if (itemToDelete) {
      await handleStatusChange(itemToDelete, "CANCELLED");
      setShowConfirmation(false);
      setItemToDelete(null);
    }
  };

  // Modified Cancel button to trigger confirmation dialog
  const handleCancelClick = (item) => {
    setItemToDelete(item);
    setShowConfirmation(true);
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
                        <td className="py-3 px-4 text-center flex justify-center space-x-2">
                          {item.status === "PENDING" ? (
                            <button
                              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              onClick={() =>
                                handleStatusChange(item, "PROCESSING")
                              }
                              style={{ backgroundColor: "#8DD8FF" }}
                            >
                              Nhận
                            </button>
                          ) : item.status === "PROCESSING" ? (
                            <button
                              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              onClick={() =>
                                handleStatusChange(item, "COMPLETED")
                              }
                              style={{ backgroundColor: "#4CAF50" }}
                            >
                              Xong
                            </button>
                          ) : null}
                          {item.status !== "CANCELLED" &&
                            item.status !== "COMPLETED" && (
                              <button
                                className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={() => handleCancelClick(item)} // Modified to trigger confirmation
                                style={{ backgroundColor: "#F44336" }}
                              >
                                Cancel
                              </button>
                            )}
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
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
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

export default DishManagementStaff;