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

// Dropdown Component
const Dropdown = ({
  label,
  items,
  onSelect,
  gradientFrom,
  gradientTo,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white rounded-md shadow-sm hover:${gradientFrom.replace(
          "-400",
          "-500"
        )} hover:${gradientTo.replace(
          "-500",
          "-600"
        )} hover:scale-105 transition-all duration-200 text-sm min-w-fit`}
      >
        {icon}
        {label}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onSelect(item.value);
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RevenueManagementAdmin = () => {
  const [viewMode, setViewMode] = useState("Day");
  const [chartData, setChartData] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [dishData, setDishData] = useState([]);
  const [displayMode, setDisplayMode] = useState("Revenue");

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
      console.error("Error calling API:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      if (err.response?.status === 500 && retry) {
        console.warn("Retrying API after 500 error...");
        return fetchRevenueData(false); // Retry once
      }

      let errorMessage = "Unable to load revenue data. Please try again.";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You do not have access. Please log in with an ADMIN account.";
      } else if (err.response?.status === 500) {
        errorMessage = `Server error loading data ${viewMode.toLowerCase()}. Please check server logs or try again later.`;
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
      setError("You need ADMIN privileges to access this page.");
      return;
    }
    fetchRevenueData();
  }, [viewMode]);

  // Handle Apply button click
  const handleApplyFilter = () => {
    if (viewMode === "Day" && startDate > endDate) {
      setError("Start date must be before or equal to end date.");
      return;
    }
    fetchRevenueData();
  };

  // Handle PDF report printing
  const handlePrintReport = async (reportType) => {
    setLoading(true);
    setError(null);

    // Kiểm tra quyền ADMIN
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("You need ADMIN privileges to print reports.");
      setLoading(false);
      return;
    }

    // Check for available data
    if (
      (viewMode === "Day" || viewMode === "Month") &&
      chartData.length === 0
    ) {
      setError(
        "No data available for report printing. Please load data first."
      );
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
          setError("Unable to open print dialog. Please check your browser.");
        }
        // Cleanup after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (err) {
      console.error("Error printing report:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      let errorMessage = "Unable to create print report. Please try again.";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You do not have permission to print reports. Please log in with an ADMIN account.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Invalid input data.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Server error creating report. Please check server logs.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel report export
  const handleExportExcel = async (reportType) => {
    setLoading(true);
    setError(null);

    // Check for ADMIN privileges
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setError("You need ADMIN privileges to export reports.");
      setLoading(false);
      return;
    }

    // Check for available data
    if (
      (viewMode === "Day" || viewMode === "Month") &&
      chartData.length === 0
    ) {
      setError("No data available for report export. Please load data first.");
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

      let errorMessage = "Unable to export Excel report. Please try again.";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You do not have permission to export reports. Please log in with an ADMIN account.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Invalid input data.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Server error exporting report. Please check server logs.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Dropdown items for PDF and Excel
  const pdfItems = [
    { label: "Daily", value: "daily" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const excelItems = [
    { label: "Daily", value: "daily" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  // Add this function inside RevenueManagementAdmin component
  const fetchEmployeeData = async (retry = true) => {
    setLoading(true);
    setError(null);
    setAnimationComplete(false);
    try {
      const year = moment(selectedMonth).year();
      const month = moment(selectedMonth).month() + 1;
      const response = await api.get("/api/admin/staff/sorted-by-salary", {
        params: { year, month },
      });

      setEmployeeData(
        response.data.map((item, index) => ({
          id: item.staffId,
          name: item.fullname,
          salary: Number(item.salary),
          hoursWorked: item.totalWorkingHours || 0,
        }))
      );
    } catch (err) {
      console.error("Error fetching employee data:", {
        url: err.config?.url,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data,
      });

      if (err.response?.status === 500 && retry) {
        console.warn("Retrying API after 500 error...");
        return fetchEmployeeData(false); // Retry once
      }

      let errorMessage = "Unable to load employee data. Please try again.";
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "You do not have access. Please log in with an ADMIN account.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Server error loading employee data. Please check server logs or try again later.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimationComplete(true), 1000);
    }
  };

  // Update the Employees button click handler
  const handleEmployeeButtonClick = () => {
    setDisplayMode("Employee");
    fetchEmployeeData();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <MenuBar
        title="Revenue Management"
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/money.png"
      />
      <div className="flex-1 p-5 overflow-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-200">
            <h1 className="text-l font-medium text-gray-800 text-center">
              Statistical
            </h1>
            <div className="flex flex-wrap items-center mt-3 pb-3 border-b justify-between gap-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setDisplayMode("Revenue")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    displayMode === "Revenue"
                      ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={handleEmployeeButtonClick}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    displayMode === "Employee"
                      ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Employees
                </button>
              </div>

              {/* Filter và Export chỉ hiển thị khi ở mode Doanh Thu */}
              {displayMode === "Revenue" && (
                <div className="flex flex-wrap items-center gap-1">
                  <select
                    className="w-20 px-2 py-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
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
                    <div className="flex items-center gap-1">
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd/MM/yyyy"
                        className="w-20 px-2 py-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
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
                        className="w-20 px-2 py-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
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
                      className="w-20 px-2 py-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
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
                      className="w-20 px-2 py-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholderText="Select Year"
                    />
                  )}

                  <button
                    onClick={handleApplyFilter}
                    className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-md shadow-sm hover:from-blue-500 hover:to-blue-600 hover:scale-105 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-sm"
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Apply
                  </button>

                  <div className="flex flex-row gap-1">
                    <Dropdown
                      label="Export PDF"
                      items={pdfItems}
                      onSelect={handlePrintReport}
                      gradientFrom="from-green-400"
                      gradientTo="to-green-500"
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                          />
                        </svg>
                      }
                    />
                    <Dropdown
                      label="Export Excel"
                      items={excelItems}
                      onSelect={handleExportExcel}
                      gradientFrom="from-purple-400"
                      gradientTo="to-purple-500"
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Thông báo trạng thái */}
          {loading && <div className="text-center p-4">Đang tải...</div>}
          {error && <div className="text-center p-4 text-red-500">{error}</div>}

          {/* Section Doanh Thu */}
          {displayMode === "Revenue" && !loading && !error && (
            <>
              {chartData.length === 0 ? (
                <div className="text-center p-4">No data to display.</div>
              ) : (
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
                            <td className="py-3 px-4 text-gray-700">
                              {item.date}
                            </td>
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
                            if (viewMode === "Month")
                              return value.split("/")[0];
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
            </>
          )}

          {/* Section Thống Kê Nhân Viên */}
          {displayMode === "Employee" && !loading && !error && (
            <>
              {employeeData.length === 0 ? (
                <div className="text-center p-4">
                  No employee data available.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row p-3">
                  <div className="w-full md:w-2/5 overflow-y-auto max-h-96">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-3 px-4 text-left text-gray-600">
                            ID
                          </th>
                          <th className="py-3 px-4 text-left text-gray-600">
                            Name
                          </th>
                          <th className="py-3 px-4 text-left text-gray-600">
                            Salary
                          </th>
                          <th className="py-3 px-4 text-left text-gray-600">
                            Hours worked
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b ${
                              index % 2 === 0 ? "bg-blue-100" : "bg-gray-100"
                            } hover:bg-gray-50`}
                          >
                            <td className="py-3 px-4 text-gray-700">
                              {item.id}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.name}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              {item.salary.toLocaleString("vi-VN")} VND
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {Number(item.hoursWorked).toFixed(1)} Hour
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-full md:w-3/5 h-96 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={employeeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="name"
                          tickFormatter={(value) =>
                            value.split(" ").slice(-2).join(" ")
                          }
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${value.toLocaleString("vi-VN")} VND`,
                            "Lương",
                          ]}
                          labelFormatter={(label) => `Tên: ${label}`}
                        />
                        <Bar
                          dataKey="salary"
                          fill="#ff6384"
                          animationDuration={1000}
                          isAnimationActive={!animationComplete}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Section Thống Kê Món Ăn */}
          {displayMode === "Dish" && !loading && !error && (
            <>
              {dishData.length === 0 ? (
                <div className="text-center p-4">No dishes data available.</div>
              ) : (
                <div className="flex flex-col md:flex-row p-3">
                  <div className="w-full md:w-2/5 overflow-y-auto max-h-96">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-3 px-4 text-left text-gray-600">
                            ID
                          </th>
                          <th className="py-3 px-4 text-left text-gray-600">
                            Name
                          </th>
                          <th className="py-3 px-4 text-left text-gray-600">
                            Quantity sold
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dishData.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b ${
                              index % 2 === 0 ? "bg-blue-100" : "bg-gray-100"
                            } hover:bg-gray-50`}
                          >
                            <td className="py-3 px-4 text-gray-700">
                              {item.id}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.dishName}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-800">
                              {item.quantitySold}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-full md:w-3/5 h-96 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dishData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis dataKey="dishName" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [value, "Số Lượng Bán"]}
                          labelFormatter={(label) => `Món: ${label}`}
                        />
                        <Bar
                          dataKey="quantitySold"
                          fill="#36a2eb"
                          animationDuration={1000}
                          isAnimationActive={!animationComplete}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementAdmin;
