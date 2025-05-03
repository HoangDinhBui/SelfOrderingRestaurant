import React, { useState } from "react";
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

const EvaluteAdmin = () => {
  const [activeTab, setActiveTab] = useState("Notification Management");
  const [reviews, setReviews] = useState([
    {
      id: 1,
      customer: "Customer 1",
      rating: 5,
      comment: "Very good",
      time: "18:30:00",
      date: "Today",
      checked: false,
    },
    {
      id: 2,
      customer: "Customer 2",
      rating: 5,
      comment: "Significant",
      time: "18:10:00",
      date: "Today",
      checked: true,
    },
    {
      id: 3,
      customer: "Customer 3",
      rating: 3,
      comment: "Everything ok but music too loud",
      time: "17:30:00",
      date: "Today",
      checked: true,
    },
    {
      id: 4,
      customer: "Customer 4",
      rating: 4,
      comment: "Delicious dish",
      time: "17:30:00",
      date: "Today",
      checked: true,
    },
    {
      id: 5,
      customer: "Customer 5",
      rating: 2,
      comment: "I like the food here, but it's a bit cold and the dishes take a bit long to be served.",
      time: "21:14:00",
      date: "12/04/2025",
      checked: true,
    },
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("All");
  const [filterDate, setFilterDate] = useState("All");

  const tabs = [
    "Order Management",
    "Notification Management",
    "Dish Management",
  ];
  const navigate = useNavigate();

  // Get unique dates for the filter dropdown
  const uniqueDates = ["All", ...new Set(reviews.map((review) => review.date))];

  // Calculate the count of reviews for each star rating
  const starCounts = [1, 2, 3, 4, 5].reduce((acc, star) => {
    acc[star] = reviews.filter((review) => review.rating === star).length;
    return acc;
  }, {});

  // Group reviews by date with filters applied
  const groupedReviews = reviews
    .filter((review) =>
      review.customer.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    .filter((review) =>
      filterRating === "All" ? true : review.rating === parseInt(filterRating)
    )
    .filter((review) =>
      filterDate === "All" ? true : review.date === filterDate
    )
    .reduce((acc, review) => {
      if (!acc[review.date]) {
        acc[review.date] = [];
      }
      acc[review.date].push(review);
      return acc;
    }, {});

  const handleTabClick = (tab) => {
    if (tab === "Order Management") {
      navigate("/order-management");
    } else if (tab === "Dish Management") {
      navigate("/dish-management");
    } else {
      setActiveTab(tab);
    }
  };

  const handleCheckReview = (id) => {
    setReviews(
      reviews.map((rev) =>
        rev.id === id ? { ...rev, checked: true } : rev
      )
    );
  };

  const handleDeleteClick = (id) => {
    setReviewToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (reviewToDelete) {
      setReviews(
        reviews.filter((rev) => rev.id !== reviewToDelete)
      );
    }
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const handleCancelDelete = () => {
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
            onClick={() => setFilterRating(star.toString())}
            className={`flex items-center text-2xl ${
              filterRating === star.toString() ? "text-yellow-500" : "text-gray-300"
            } hover:text-yellow-500 transition-colors`}
          >
            <span className="mr-1 text-sm">{star}</span>⭐
            <span className="ml-1 text-sm text-gray-600">({starCounts[star]})</span>
          </button>
        ))}
        <button
          onClick={() => setFilterRating("All")}
          className={`ml-4 text-sm ${
            filterRating === "All" ? "text-blue-500" : "text-gray-500"
          } hover:text-blue-500 transition-colors`}
        >
          All ({reviews.length})
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen !bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col">
      <MenuBar 
        title="Evalute   "
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/bookmark.png"/>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-transparent overflow-y-auto">
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
            />
          </div>
          {renderStarFilter()}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-12 px-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md text-gray-700"
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
          {Object.entries(groupedReviews).map(([date, dateReviews]) => (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">{date}</h2>
              {dateReviews.map((review) => (
                <div
                  key={review.id}
                  className="relative flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Phần bên trái: Rating và thông tin */}
                  <div className="flex items-center">
                    {/* Rating */}
                    {renderStars(review.rating)}

                    {/* Thông tin khách hàng và đánh giá */}
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{review.customer}</h3>
                      <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                    </div>
                  </div>

                  {/* Thời gian và nút hành động */}
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-sm font-medium mb-2">
                      {review.time}
                    </span>
                    <div className="flex justify-end space-x-4">
                      <button
                        className={`flex items-center px-4 py-2 text-white rounded-lg shadow-md transition-all duration-200 ${
                          review.checked ? "!bg-green-600 hover:bg-green-700" : "!bg-yellow-500 hover:bg-yellow-600"
                        }`}
                        onClick={() => handleCheckReview(review.id)}
                      >
                        <FaCheck className="mr-2" /> {review.checked ? "Checked" : "Check"}
                      </button>
                      <button
                        className="flex items-center px-4 py-2 !bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all duration-200"
                        onClick={() => handleDeleteClick(review.id)}
                      >
                        <FaTrash className="mr-2" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-96 p-8 mx-4 transform transition-all duration-300 scale-100">
            {/* Thêm logo nhà hàng */}
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
              >
                YES
              </button>
              <button
                className="px-6 py-3 !bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
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

export default EvaluteAdmin;