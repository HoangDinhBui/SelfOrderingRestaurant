import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTrash, FaMoneyBillWave, FaBell, FaUtensils } from 'react-icons/fa';

const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState("Notification Management");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      table: "Table 1",
      type: "Payment request",
      message: "I need to pay.",
      time: "18:30:00",
      date: "Today",
      checked: false
    },
    {
      id: 2,
      table: "Table 1",
      type: "Call staff",
      message: "I need more sauce for my dish, please bring me another chili, thank you.",
      time: "18:10:00",
      date: "Today",
      checked: false
    },
    {
      id: 3,
      table: "Table 2",
      type: "Payment request",
      message: "I need to pay!",
      time: "17:30:00",
      date: "Today",
      checked: false
    },
    {
      id: 4,
      table: "Table 2",
      type: "Other",
      message: "Please bring me a spoon, thank you.",
      time: "17:30:00",
      date: "Today",
      checked: false
    },
    {
      id: 5,
      table: "Table 1",
      type: "Payment request",
      message: "I need to pay",
      time: "21:14:00",
      date: "12/04/2025",
      checked: false
    }
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  
  const tabs = ["Order Management", "Notification Management", "Dish Management"];
  const navigate = useNavigate();

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.date]) {
      acc[notification.date] = [];
    }
    acc[notification.date].push(notification);
    return acc;
  }, {});

  const handleTabClick = (tab) => {
    if (tab === "Order Management") {
      navigate('/order-management');
    } else if (tab === "Dish Management") {
      // Thêm route cho Dish Management nếu cần
      navigate('/dish-management');
    } else {
      setActiveTab(tab);
    }
  };

  const handleCheckNotification = (id) => {
    setNotifications(notifications.map(noti => 
      noti.id === id ? {...noti, checked: true} : noti
    ));
  };

  const handleDeleteClick = (id) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (notificationToDelete) {
      setNotifications(notifications.filter(noti => noti.id !== notificationToDelete));
    }
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };
  // Function to get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'Payment request':
        return <FaMoneyBillWave className="text-green-500 mr-2" />;
      case 'Call staff':
        return <FaBell className="text-blue-500 mr-2" />;
      case 'Other':
        return <FaUtensils className="text-orange-500 mr-2" />;
      default:
        return <FaBell className="text-gray-500 mr-2" />;
    }
  };

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      {/* Header */}
      <div className="w-full bg-blue-100 flex items-center justify-between px-6 py-2">
        {/* Logo */}
        <div className="flex items-center">
          <img alt="Logo" class="w-12 h-12" src="../../src/assets/img/logoremovebg.png"></img>
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
          <img alt="User Avatar" class="w-12 h-12 rounded-full border-2 border-white shadow-md cursor-pointer" src="../../src/assets/img/MyDung.jpg"></img>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date} className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">{date}</h2>
              {dateNotifications.map((notification) => (
                <div key={notification.id} className="mb-6 border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {getNotificationIcon(notification.type)}
                      <div>
                        <h3 className="font-bold">{notification.table}</h3>
                        <p className="text-gray-600">- {notification.type}</p>
                      </div>
                    </div>
                    <span className="text-gray-500">{notification.time}</span>
                  </div>
                  <p className="mb-4 pl-8">{notification.message}</p>
                  <div className="flex justify-end space-x-4">
                    <button 
                      className="flex items-center px-3 py-1 !bg-green-500 text-white rounded hover:bg-green-600"
                      onClick={() => handleCheckNotification(notification.id)}
                    >
                      <FaCheck className="mr-1" /> Check
                    </button>
                    <button 
                      className="flex items-center px-3 py-1 !bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDeleteClick(notification.id)}
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="relative bg-white rounded-xl shadow-2xl w-96 p-8 mx-4">
          {/* Thêm logo nhà hàng */}
          <div className="flex justify-center mb-4">
            <img alt="Logo" class="w-24 h-24" src="../../src/assets/img/logoremovebg.png"></img>
          </div>
          <h3 className="text-xl font-bold mb-4 text-center">ARE YOU SURE?</h3>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 !bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleConfirmDelete}
            >
              YES
            </button>
            <button
              className="px-4 py-2 !bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={handleCancelDelete}
            >
              NO
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default NotificationManagement;