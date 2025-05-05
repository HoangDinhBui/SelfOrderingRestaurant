import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaTrash,
  FaMoneyBillWave,
  FaBell,
  FaUtensils,
} from "react-icons/fa";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff.jsx";
import MenuBar from "../../../components/layout/MenuBar.jsx";
import axios from "axios";

const EvaluteAdmin = () => {
  const [activeTab, setActiveTab] = useState("Notification Management");
  const [reviews, setReviews] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const tabs = [
    "Order Management",
    "Notification Management",
    "Dish Management",
  ];
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:8080";

  // Check user role on component mount
  useEffect(() => {
    const role = localStorage.getItem("userType"); // Use userType instead of userRole
    setUserRole(role);
  }, []);

  // Lấy danh sách feedback từ backend
  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
        params: {
          search: searchTerm.trim() || undefined,
          filterRating: filterRating === "All" ? undefined : filterRating,
          filterDate: filterDate === "All" ? undefined : filterDate,
        },
      });
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setError("Failed to load feedbacks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount hoặc khi search/filter thay đổi, chỉ nếu là ADMIN
  useEffect(() => {
    if (userRole === "ADMIN") {
      fetchFeedbacks();
    }
  }, [searchTerm, filterRating, filterDate, userRole]);

  // Get unique dates for the filter dropdown
  const uniqueDates = ["All", ...new Set(reviews.map((review) => review.date))];

  // Calculate the count of reviews for each star rating
  const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
    acc[star] = reviews.filter((review) => review.rating === star).length;
    return acc;
  }, {});

  const handleTabClick = (tab) => {
    if (userRole !== "ADMIN") return; // Prevent tab navigation for non-ADMIN
    if (tab === "Order Management") {
      navigate("/order-management");
    } else if (tab === "Dish Management") {
      navigate("/dish-management");
    } else {
      setActiveTab(tab);
    }
  };

  // Đánh dấu feedback là đã đọc
  const handleCheckReview = async (id) => {
    if (userRole !== "ADMIN") return; // Prevent action for non-ADMIN
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/feedback/${id}/mark-as-read`
      );
      setReviews(
        reviews.map((rev) => (rev.id === id ? { ...rev, checked: true } : rev))
      );
    } catch (error) {
      console.error("Error marking feedback as read:", error);
      setError("Failed to mark feedback as read. Please try again.");
    }
  };

  // Xóa feedback
  const handleDeleteClick = (id) => {
    if (userRole !== "ADMIN") return; // Prevent action for non-ADMIN
    setReviewToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userRole !== "ADMIN") return; // Prevent action for non-ADMIN
    if (reviewToDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/api/feedback/${reviewToDelete}`);
        setReviews(reviews.filter((rev) => rev.id !== reviewToDelete));
      } catch (error) {
        console.error("Error deleting feedback:", error);
        setError("Failed to delete feedback. Please try again.");
      }
    }
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const handleCancelDelete = () => {
    if (userRole !== "ADMIN") return; // Prevent action for non-ADMIN
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  // Function to render stars based on rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full mr-4 shadow-sm">
        <span className="text-yellow-600 font-semibold">{rating} ⭐</span>
      </div>
    );
  };

  // Function to render star rating filter with counts
  const renderStarFilter = () => {
    return (
      <div className="flex items-center space-x-2 h-12 px-3 bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() =>
              userRole === "ADMIN" && setFilterRating(star.toString())
            }
            className={`flex items-center text-2xl ${
              filterRating === star.toString()
                ? "text-yellow-500"
                : "text-gray-300"
            } hover:text-yellow-500 transition-colors`}
            disabled={userRole !== "ADMIN"}
          >
            <span className="mr-1 text-sm">{star}</span>⭐
            <span className="ml-1 text-sm text-gray-600">
              ({starCounts[star]})
            </span>
          </button>
        ))}
        <button
          onClick={() => userRole === "ADMIN" && setFilterRating("All")}
          className={`ml-4 text-sm ${
            filterRating === "All" ? "text-blue-500" : "text-gray-500"
          } hover:text-blue-500 transition-colors`}
          disabled={userRole !== "ADMIN"}
        >
          All ({reviews.length})
        </button>
      </div>
    );
  };

  // Group reviews by date
  const groupedReviews = reviews.reduce((acc, review) => {
    if (!acc[review.date]) {
      acc[review.date] = [];
    }
    acc[review.date].push(review);
    return acc;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedReviews).sort((a, b) => {
    const dateA = new Date(a.split("/").reverse().join("-"));
    const dateB = new Date(b.split("/").reverse().join("-"));
    return dateB - dateA;
  });

  // Render "Access Denied" message if user is not ADMIN
  if (userRole !== "ADMIN") {
    return (
      <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100">
        <MenuBar
          title="Evaluate"
          icon="https://img.icons8.com/ios-filled/50/FFFFFF/bookmark.png"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg text-xl">
            Access denied: Administrator privileges required.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen !bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col">
      <MenuBar
        title="Evaluate"
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/bookmark.png"
      />
      {/* Main Content */}
      <div className="flex-1 p-8 bg-transparent overflow-y-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600">Loading feedbacks...</div>
        )}

        {/* Filter and Search */}
        <div className="mb-6 flex space-x-4 items-center">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 p-3 pl-10 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md placeholder-gray-400 text-gray-700"
              disabled={userRole !== "ADMIN"}
            />
          </div>
          {renderStarFilter()}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-12 px-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md text-gray-700"
            disabled={userRole !== "ADMIN"}
          >
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {/* Review List */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {sortedDates.length === 0 && !loading ? (
            <div className="text-center text-gray-600">No feedbacks found.</div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                  {date}
                </h2>
                {groupedReviews[date].map((review) => (
                  <div
                    key={review.id}
                    className="relative flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Left Section: Rating and Info */}
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-800">
                            {review.customerName}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Time and Actions */}
                    <div className="flex flex-col items-end">
                      <span className="text-gray-500 text-sm font-medium mb-2">
                        {review.time}
                      </span>
                      <div className="flex justify-end space-x-4">
                        <button
                          className={`flex items-center px-4 py-2 text-white rounded-lg shadow-md transition-all duration-200 ${
                            review.checked
                              ? "!bg-green-600 hover:bg-green-700"
                              : "!bg-yellow-500 hover:bg-yellow-600"
                          }`}
                          onClick={() => handleCheckReview(review.id)}
                          disabled={userRole !== "ADMIN"}
                        >
                          <FaCheck className="mr-2" />{" "}
                          {review.checked ? "Checked" : "Check"}
                        </button>
                        <button
                          className="flex items-center px-4 py-2 !bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all duration-200"
                          onClick={() => handleDeleteClick(review.id)}
                          disabled={userRole !== "ADMIN"}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      oportunidades
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-96 p-8 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <img
                alt="Logo"
                className="w-24 h-24"
                src="../../src/assets/img/logoremovebg.png"
              />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              ARE YOU SURE?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-3 !bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all duration-200"
                onClick={handleConfirmDelete}
                disabled={userRole !== "ADMIN"}
              >
                YES
              </button>
              <button
                className="px-6 py-3 !bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
                onClick={handleCancelDelete}
                disabled={userRole !== "ADMIN"}
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

export default EvaluteAdmin;
