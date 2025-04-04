import React, { useState } from "react";

const OrderManagement = () => {
  const [activeTab, setActiveTab] = useState("Order Management");
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmptyTableModalOpen, setIsEmptyTableModalOpen] = useState(false);

  const tabs = ["Order Management", "Notification Management", "Dish Management"];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
  };

  const handleShowModal = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };
  
  const handleShowEmptyTableModal = () => {
    setIsEmptyTableModalOpen(true);
  };

  const tables = [
    {
      id: 1,
      status: "occupied",
      dishes: [
        { name: "Huitres Fraiches (6PCS)", quantity: 1, status: "Complete", image: "../../../../assets/img/Mon1.jpg" },
        { name: "Huitres Gratinees (6PCS)", quantity: 1, status: "Complete", image: "../../../assets/img/Mon1.jpg" },
        { name: "Tartare De Saumon", quantity: 1, status: "Complete", image: "../../../assets/img/Mon1.jpg" },
        { name: "Salad Gourmande", quantity: 1, status: "Complete", image: "../../../assets/img/Mon1.jpg" },
        { name: "Salad Landaise", quantity: 1, status: "Pending", image: "../../../assets/img/" },
        { name: "Magret De Canard", quantity: 1, status: "Pending", image: "../../../assets/img/Mon1.jpg" },
      ],
    },
    {
      id: 2,
      status: "available",
      dishes: [],
      capacity: 4
    },
    {
      id: 3,
      status: "occupied",
      dishes: [
        { name: "Dish 1", quantity: 2, status: "Pending", image: "path/to/image7.jpg" },
        { name: "Dish 2", quantity: 1, status: "Complete", image: "path/to/image8.jpg" },
      ],
    },
    {
      id: 4,
      status: "available",
      dishes: [],
      capacity: 2
    },
  ];

  // Get empty tables for the empty table list modal
  const emptyTables = tables.filter(table => table.status === "available");

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      {/* Background that will be blurred when modal is open */}
      <div className={`h-full w-full ${isModalOpen || isEmptyTableModalOpen ? "blur-sm" : ""}`}>
        {/* Header */}
        <div className="w-full bg-blue-100 flex items-center justify-between px-6 py-2">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="../../src/assets/img/logoremovebg.png"
              alt="Logo"
              className="w-12 h-12"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-grow justify-center gap-x-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 text-gray-700 font-medium flex items-center ${
                  activeTab === tab
                    ? "!bg-blue-900 text-white rounded-lg"
                    : "bg-transparent hover:bg-blue-200 rounded-lg"
                }`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Avatar */}
          <div className="flex items-center">
            <img
              src="../../src/assets/img/MyDung.jpg"
              alt="User Avatar"
              className="w-12 h-12 rounded-full border-2 border-white shadow-md cursor-pointer"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-100 flex">
          {/* Table Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                onClick={() => handleSelectTable(table)}
              >
                <div className="bg-blue-900 text-white p-3 flex justify-between items-center">
                  <h2 className="font-bold">Table {table.id}</h2>
                  <span>{table.status}</span>
                </div>
                <div className="grid grid-cols-2 bg-gray-200">
                  <div className="p-4 flex flex-col items-center justify-center">
                    <span className="text-lg">56'</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <span className="text-lg">
                      {table.dishes.length > 0 
                        ? `Dish ${table.dishes.filter(d => d.status === "Complete").length}/${table.dishes.length}` 
                        : "No dishes"}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 ${table.status === "occupied" ? "bg-gray-700" : "bg-green-500"} rounded-full mr-2`}></div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-500 mx-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div 
                      className="relative cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (table.status === "occupied") {
                          handleShowModal(table);
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {table.status === "occupied" && table.dishes.filter(d => d.status === "Pending").length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                          {table.dishes.filter(d => d.status === "Pending").length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <button 
                      className="!bg-red-500 text-white p-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add functionality for the close button if needed
                      }}
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
                </div>
              </div>
            ))}
          </div>

          {/* Right Side Information Cards */}
          <div className="ml-4 w-64 flex flex-col gap-4">
            {/* Available/Occupied Table */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p>: Available Table</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p>: Occupied Table</p>
              </div>
            </div>

            {/* Paid/Unpaid */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                <p>: Paid</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
                <p>: Unpaid</p>
              </div>
            </div>

            {/* Empty Table Button */}
            <div className="mt-2">
              <button
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                onClick={handleShowEmptyTableModal}
              >
                Empty Table List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Details Modal - positioned fixed and not blurred */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0  bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-lg p-6 w-1/2 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Table {selectedTable.id}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedTable.dishes.map((dish, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <span>{dish.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-gray-200 rounded">-</button>
                    <span>{dish.quantity}</span>
                    <button className="px-2 py-1 bg-gray-200 rounded">+</button>
                  </div>
                  <span
                    className={`px-3 py-1 rounded ${
                      dish.status === "Complete"
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {dish.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={() => setIsModalOpen(false)}
              >
                Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Table List Modal */}
      {isEmptyTableModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-opacity-50" onClick={() => setIsEmptyTableModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Empty Table List</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsEmptyTableModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-100">
                    <th className="p-2 text-left">Table</th>
                    <th className="p-2 text-left">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {emptyTables.map(table => (
                    <tr key={table.id} className="border-b">
                      <td className="p-2">{table.id}</td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {table.capacity}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;