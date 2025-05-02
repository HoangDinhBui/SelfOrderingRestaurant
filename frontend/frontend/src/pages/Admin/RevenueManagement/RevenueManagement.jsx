import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import MenuBar from "../../../components/layout/menuBar";
import axios from "axios";
import moment from "moment";

// Cấu hình Axios
const API_BASE_URL = "http://localhost:8080"; // Thay đổi nếu backend chạy trên cổng khác
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để thêm token từ localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Lấy accessToken từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const RevenueManagementAdmin = () => {
  const [viewMode, setViewMode] = useState("Day");
  const [chartData, setChartData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy dữ liệu doanh thu theo từng chế độ xem
  const fetchRevenueData = async () => {
    setLoading(true);
    setError(null);
    setAnimationComplete(false);
    try {
      let response;
      const year = moment().year();

      if (viewMode === "Day") {
        const endDate = moment().format("YYYY-MM-DD");
        const startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
        response = await api.get("/api/admin/revenue/daily", {
          params: { startDate, endDate },
        });

        setChartData(
          (response.data || []).map((item, index) => ({
            id: index + 1,
            date: moment(item.date).format("DD/MM/YYYY"),
            revenue: Number(item.totalRevenue),
          }))
        );
      } else if (viewMode === "Month") {
        response = await api.get("/api/admin/revenue/monthly", {
          params: { year, month: moment().month() + 1 }, // month từ 1-12
        });

        setChartData(
          (response.data?.dailyRevenues || []).map((item, index) => ({
            id: index + 1,
            date: moment(item.date).format("MMM YYYY"),
            revenue: Number(item.totalRevenue),
          }))
        );
      } else if (viewMode === "Year") {
        response = await api.get("/api/admin/revenue/yearly", {
          params: { year },
        });

        setChartData(
          Object.entries(response.data?.monthlyRevenues || {}).map(
            ([month, revenue], index) => ({
              id: index + 1,
              date: `${month} ${year}`,
              revenue: Number(revenue),
            })
          )
        );
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 403) {
        setError(
          "Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản ADMIN."
        );
      } else {
        setError("Không thể tải dữ liệu doanh thu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setAnimationComplete(true), 1000);
    }
  };

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập và có quyền ADMIN không
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("Bạn cần quyền ADMIN để truy cập trang này.");
      return;
    }
    fetchRevenueData();
  }, [viewMode]);

  const filteredData = chartData.filter(
    (item) =>
      item.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.revenue.toString().includes(searchQuery)
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <MenuBar title="Revenue Management" />
      <div className="flex-1 p-5 overflow-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h1 className="text-xl font-medium text-gray-800 text-center">
              Revenue
            </h1>
            <div className="flex items-center mt-3 pb-3 border-b justify-end gap-2">
              <select
                className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="Day">Day</option>
                <option value="Month">Month</option>
                <option value="Year">Year</option>
              </select>
              <input
                className="w-40 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                type="text"
                placeholder="Find"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Thông báo trạng thái */}
          {loading && <div className="text-center p-4">Đang tải...</div>}
          {error && <div className="text-center p-4 text-red-500">{error}</div>}
          {!loading && !error && filteredData.length === 0 && (
            <div className="text-center p-4">Không có dữ liệu để hiển thị.</div>
          )}

          {/* Bảng & biểu đồ */}
          {!loading && !error && filteredData.length > 0 && (
            <div className="flex flex-col md:flex-row p-3">
              {/* Bảng */}
              <div className="w-full md:w-2/5 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-3 px-4 text-left text-gray-600">
                        Date
                      </th>
                      <th className="py-3 px-4 text-left text-gray-600">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-blue-100" : "bg-gray-100"
                        } hover:bg-gray-50`}
                      >
                        <td className="py-3 px-4 text-gray-700">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          ${item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Biểu đồ */}
              <div className="w-full md:w-3/5 h-96 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        if (viewMode === "Day") return value.split("/")[0];
                        if (viewMode === "Month") return value.split(" ")[0];
                        return value;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#4adede"
                      animationDuration={1000}
                      isAnimationActive={!animationComplete}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementAdmin;
