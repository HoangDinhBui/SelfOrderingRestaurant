import React from "react";

const DishListModal = ({ isOpen, onClose, Staff, tableId }) => {
  if (!isOpen) return null;

  // Group Staff by order id
  const orderGroups = Staff.reduce((groups, dish) => {
    if (!groups[dish.orderId]) {
      groups[dish.orderId] = [];
    }
    groups[dish.orderId].push(dish);
    return groups;
  }, {});

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate total for all Staff
  const totalAmount = Staff.reduce(
    (sum, dish) => sum + dish.price * dish.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Staff for Table {tableId}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {Object.keys(orderGroups).length === 0 ? (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xl text-gray-500">
              No Staff available for this table
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(orderGroups).map(([orderId, orderStaff]) => (
              <div key={orderId} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Order #{orderId}</span>
                    <span className="text-sm text-gray-600">
                      {orderStaff[0].status === "Complete" ? (
                        <span className="text-green-600 font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="text-yellow-600 font-medium">
                          In Progress
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="divide-y">
                  {orderStaff.map((dish, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 hover:bg-gray-50"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={dish.image || "/src/assets/img/placeholder.jpg"}
                          alt={dish.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {dish.name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {dish.quantity}
                            </p>
                          </div>
                          <p className="text-base font-medium text-gray-900">
                            {formatCurrency(dish.price * dish.quantity)}
                          </p>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              dish.status === "Complete"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {dish.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishListModal;
