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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Cấu hình Axios
const API_BASE_URL = "http://localhost:8080";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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
  const [animationComplete, setAnimationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho filter
  const [startDate, setStartDate] = useState(
    moment().subtract(7, "days").toDate()
  );
  const [endDate, setEndDate] = useState(moment().toDate());
  const [selectedMonth, setSelectedMonth] = useState(moment().toDate());
  const [selectedYear, setSelectedYear] = useState(moment().year());

  const fetchRevenueData = async (retry = true) => {
    setLoading(true);
    setError(null);
    setAnimationComplete(false);
    try {
      let response;

      if (viewMode === "Day") {
        const start = moment(startDate).format("YYYY-MM-DD");
        const end = moment(endDate).format("YYYY-MM-DD");
        response = await api.get("/api/admin/revenue/daily", {
          params: { startDate: start, endDate: end },
        });

        setChartData(
          (response.data || []).map((item, index) => ({
            id: index + 1,
            date: moment(item.date).format("DD/MM/YYYY"),
            revenue: Number(item.totalRevenue),
            revenueId: item.revenueId,
          }))
        );
      } else if (viewMode === "Month") {
        const year = moment(selectedMonth).year();
        const month = moment(selectedMonth).month() + 1;
        response = await api.get("/api/admin/revenue/monthly", {
          params: { year, month },
        });

        setChartData(
          (response.data?.dailyRevenues || []).map((item, index) => ({
            id: index + 1,
            date: moment(item.date).format("DD/MM/YYYY"),
            revenue: Number(item.totalRevenue),
            revenueId: item.revenueId,
          }))
        );
      } else if (viewMode === "Year") {
        response = await api.get("/api/admin/revenue/yearly", {
          params: { year: selectedYear },
        });

        setChartData(
          Object.entries(response.data?.monthlyRevenues || {}).map(
            ([month, revenue], index) => ({
              id: index + 1,
              date: `${month} ${selectedYear}`,
              revenue: Number(revenue),
            })
          )
        );
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      if (err.response?.status === 500 && retry) {
        console.warn("Thử lại API sau lỗi 500...");
        return fetchRevenueData(false); // Thử lại một lần
      }

      let errorMessage = "Không thể tải dữ liệu doanh thu. Vui lòng thử lại.";
      if (err.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản ADMIN.";
      } else if (err.response?.status === 500) {
        errorMessage = `Lỗi máy chủ khi tải dữ liệu ${viewMode.toLowerCase()}. Vui lòng kiểm tra log server hoặc thử lại sau.`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimationComplete(true), 1000);
    }
  };

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("Bạn cần quyền ADMIN để truy cập trang này.");
      return;
    }
    fetchRevenueData();
  }, [viewMode]);

  // Xử lý khi nhấn nút Apply
  const handleApplyFilter = () => {
    if (viewMode === "Day" && startDate > endDate) {
      setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    fetchRevenueData();
  };

  // Xử lý in báo cáo PDF
  const handlePrintReport = async (reportType) => {
    setLoading(true);
    setError(null);

    // Kiểm tra quyền ADMIN
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("Bạn cần quyền ADMIN để in báo cáo.");
      setLoading(false);
      return;
    }

    // Kiểm tra dữ liệu có sẵn
    if (
      (viewMode === "Day" || viewMode === "Month") &&
      chartData.length === 0
    ) {
      setError("Không có dữ liệu để in báo cáo. Vui lòng tải dữ liệu trước.");
      setLoading(false);
      return;
    }

    try {
      let payload = {
        reportType,
        exportFormat: "pdf",
      };

      if (viewMode === "Day") {
        payload.startDate = moment(startDate).format("YYYY-MM-DD");
        payload.endDate = moment(endDate).format("YYYY-MM-DD");
        payload.revenueIds = chartData.map((item) => item.revenueId);
      } else if (viewMode === "Month") {
        payload.startDate = moment(selectedMonth)
          .startOf("month")
          .format("YYYY-MM-DD");
        payload.endDate = moment(selectedMonth)
          .endOf("month")
          .format("YYYY-MM-DD");
        payload.revenueIds = chartData.map((item) => item.revenueId);
      } else if (viewMode === "Year") {
        payload.startDate = `${selectedYear}-01-01`;
        payload.endDate = `${selectedYear}-12-31`;
      }

      const response = await api.post("/api/admin/revenue/export", payload, {
        responseType: "blob",
      });

      // Tạo blob
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Tùy chọn tải PDF
      const link = document.createElement("a");
      link.href = url;
      link.download = `revenue_report_${reportType}_${moment().format(
        "YYYY-MM-DD"
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Tùy chọn in PDF
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          setError("Không thể mở hộp thoại in. Vui lòng kiểm tra trình duyệt.");
        }
        // Dọn dẹp sau khi in
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (err) {
      console.error("Lỗi khi in báo cáo:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      let errorMessage = "Không thể tạo báo cáo in. Vui lòng thử lại.";
      if (err.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "Bạn không có quyền in báo cáo. Vui lòng đăng nhập với tài khoản ADMIN.";
      } else if (err.response?.status === 400) {
        errorMessage =
          err.response.data?.message || "Dữ liệu đầu vào không hợp lệ.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Lỗi máy chủ khi tạo báo cáo. Vui lòng kiểm tra log server.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xuất báo cáo Excel
  const handleExportExcel = async (reportType) => {
    setLoading(true);
    setError(null);

    // Kiểm tra quyền ADMIN
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("Bạn cần quyền ADMIN để xuất báo cáo.");
      setLoading(false);
      return;
    }

    // Kiểm tra dữ liệu có sẵn
    if (
      (viewMode === "Day" || viewMode === "Month") &&
      chartData.length === 0
    ) {
      setError("Không có dữ liệu để xuất báo cáo. Vui lòng tải dữ liệu trước.");
      setLoading(false);
      return;
    }

    try {
      let payload = {
        reportType,
        exportFormat: "excel",
      };

      if (viewMode === "Day") {
        payload.startDate = moment(startDate).format("YYYY-MM-DD");
        payload.endDate = moment(endDate).format("YYYY-MM-DD");
        payload.revenueIds = chartData.map((item) => item.revenueId);
      } else if (viewMode === "Month") {
        payload.startDate = moment(selectedMonth)
          .startOf("month")
          .format("YYYY-MM-DD");
        payload.endDate = moment(selectedMonth)
          .endOf("month")
          .format("YYYY-MM-DD");
        payload.revenueIds = chartData.map((item) => item.revenueId);
      } else if (viewMode === "Year") {
        payload.startDate = `${selectedYear}-01-01`;
        payload.endDate = `${selectedYear}-12-31`;
      }

      const response = await api.post("/api/admin/revenue/export", payload, {
        responseType: "blob",
      });

      // Tạo blob và tải file Excel
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `revenue_report_${reportType}_${moment().format(
        "YYYY-MM-DD"
      )}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Dọn dẹp
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất báo cáo Excel:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      let errorMessage = "Không thể xuất báo cáo Excel. Vui lòng thử lại.";
      if (err.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "Bạn không có quyền xuất báo cáo. Vui lòng đăng nhập với tài khoản ADMIN.";
      } else if (err.response?.status === 400) {
        errorMessage =
          err.response.data?.message || "Dữ liệu đầu vào không hợp lệ.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Lỗi máy chủ khi xuất báo cáo. Vui lòng kiểm tra log server.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <MenuBar title="Revenue Management" />
      <div className="flex-1 p-5 overflow-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h1 className="text-xl font-medium text-gray-800 text-center">
              Revenue
            </h1>
            <div className="flex flex-wrap items-center mt-3 pb-3 border-b justify-end gap-2">
              <select
                className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  setError(null);
                }}
              >
                <option value="Day">Day</option>
                <option value="Month">Month</option>
                <option value="Year">Year</option>
              </select>

              {/* Filter theo Day */}
              {viewMode === "Day" && (
                <div className="flex items-center gap-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                    placeholderText="Start Date"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                    placeholderText="End Date"
                  />
                </div>
              )}

              {/* Filter theo Month */}
              {viewMode === "Month" && (
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholderText="Select Month"
                />
              )}

              {/* Filter theo Year */}
              {viewMode === "Year" && (
                <DatePicker
                  selected={moment().year(selectedYear).toDate()}
                  onChange={(date) => setSelectedYear(moment(date).year())}
                  dateFormat="yyyy"
                  showYearPicker
                  className="w-32 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400"
                  placeholderText="Select Year"
                />
              )}

              <button
                onClick={handleApplyFilter}
                className="px-4 py-2 !bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                Apply
              </button>

              {/* Nút in PDF */}
              <button
                onClick={() => handlePrintReport("daily")}
                className="px-4 py-2 !bg-green-500 text-white rounded hover:bg-green-600"
                disabled={loading}
              >
                Print Daily PDF
              </button>
              <button
                onClick={() => handlePrintReport("monthly")}
                className="px-4 py-2 !bg-green-500 text-white rounded hover:bg-green-600"
                disabled={loading}
              >
                Print Monthly PDF
              </button>
              <button
                onClick={() => handlePrintReport("yearly")}
                className="px-4 py-2 !bg-green-500 text-white rounded hover:bg-green-600"
                disabled={loading}
              >
                Print Yearly PDF
              </button>

              {/* Nút xuất Excel */}
              <button
                onClick={() => handleExportExcel("daily")}
                className="px-4 py-2 !bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={loading}
              >
                Export Daily Excel
              </button>
              <button
                onClick={() => handleExportExcel("monthly")}
                className="px-4 py-2 !bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={loading}
              >
                Export Monthly Excel
              </button>
              <button
                onClick={() => handleExportExcel("yearly")}
                className="px-4 py-2 !bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={loading}
              >
                Export Yearly Excel
              </button>
            </div>
          </div>

          {/* Thông báo trạng thái */}
          {loading && <div className="text-center p-4">Đang tải...</div>}
          {error && <div className="text-center p-4 text-red-500">{error}</div>}
          {!loading && !error && chartData.length === 0 && (
            <div className="text-center p-4">Không có dữ liệu để hiển thị.</div>
          )}

          {/* Bảng & biểu đồ */}
          {!loading && !error && chartData.length > 0 && (
            <div className="flex flex-col md:flex-row p-3">
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
                    {chartData.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-blue-100" : "bg-gray-100"
                        } hover:bg-gray-50`}
                      >
                        <td className="py-3 px-4 text-gray-700">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {item.revenue.toLocaleString()} VND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="w-full md:w-3/5 h-96 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        if (viewMode === "Day") return value.split("/")[0];
                        if (viewMode === "Month") return value.split("/")[0];
                        return value.split(" ")[0];
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `${value.toLocaleString()} VND`,
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
