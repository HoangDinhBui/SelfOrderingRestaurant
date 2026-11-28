import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTrash, FaEdit } from "react-icons/fa";
import MenuBar from "../../../components/layout/MenuBar";
import axios from "axios";

import { BACKEND_URL } from "../../../config";
const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredientId: "",
    quantity: "",
    unit: "",
    customUnit: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();
  const API_BASE_URL = BACKEND_URL;

  // Check user role on component mount
  useEffect(() => {
    const role = localStorage.getItem("userType"); // Use userType instead of userRole
    setUserRole(role);
    if (role !== "ADMIN") {
      setErrorMessage("Không có quyền truy cập: cần quyền quản trị viên.");
    }
  }, []);

  // Fetch all inventories, suppliers, and ingredients on mount
  useEffect(() => {
  if (userRole !== "ADMIN") return;
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await Promise.all([fetchSuppliers(), fetchIngredients()]);
      await fetchInventories();
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Không tải được dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();

  // Lắng nghe sự kiện từ WebSocket hoặc context (nếu có)
  // Ví dụ: window.addEventListener('inventoryUpdated', fetchInventories);
}, [userRole]);

  const fetchInventories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/inventory`, {
        headers: getAuthHeaders(),
        params: {
          search: searchTerm.trim() || undefined,
          filterUnit: filterUnit === "All" ? undefined : filterUnit,
        },
      });
      const data = response.data || [];
      const mappedData = data.map((item) => ({
        id: item.inventoryId,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName || "Unknown",
        supplierName: item.supplierName || "Unknown",
        quantity: item.quantity,
        unit: item.unit,
        lastUpdate: new Date(item.lastUpdated).toLocaleDateString("en-US"),
      }));
      setInventory(mappedData);
      setFilteredInventory(mappedData);
    } catch (error) {
      await handleApiError(error, "Không tải được danh sách kho");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/suppliers`, {
        headers: getAuthHeaders(),
      });
      setSuppliers(response.data || []);
    } catch (error) {
      await handleApiError(error, "Không tải được danh sách nhà cung cấp");
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/ingredient`, {
        headers: getAuthHeaders(),
      });
      setIngredients(response.data || []);
    } catch (error) {
      await handleApiError(error, "Không tải được danh sách nguyên liệu");
    }
  };

  // Get auth headers with Bearer token
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
        refreshToken: localStorage.getItem("refreshToken"),
      });
      const { accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      return accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      localStorage.clear();
      navigate("/login");
      return null;
    }
  };

  // Handle API errors with token refresh
  const handleApiError = async (error, defaultMessage) => {
    console.error(defaultMessage, error, {
      status: error.response?.status,
      data: error.response?.data,
    });
    const status = error.response?.status;
    let message = error.response?.data?.message || defaultMessage;
    if (status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        try {
          const retryResponse = await axios.request({
            ...error.config,
            headers: {
              ...error.config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
          if (error.config.url.includes("inventory")) {
            const data = retryResponse.data || [];
            const mappedData = data.map((item) => ({
              id: item.inventoryId,
              ingredientId: item.ingredientId,
              ingredientName: item.ingredientName || "Unknown",
              supplierName: item.supplierName || "Unknown",
              quantity: item.quantity,
              unit: item.unit,
              lastUpdate: new Date(item.lastUpdated).toLocaleDateString(
                "en-US"
              ),
            }));
            setInventory(mappedData);
            setFilteredInventory(mappedData);
          } else if (error.config.url.includes("suppliers")) {
            setSuppliers(retryResponse.data || []);
          } else if (error.config.url.includes("ingredient")) {
            setIngredients(retryResponse.data || []);
          }
          return;
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }
      message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      localStorage.clear();
      navigate("/login");
    } else if (status === 403) {
      message = "Bạn không có quyền truy cập chức năng này!";
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else if (status === 404) {
      message = `Không tìm thấy API: ${error.config.url}`;
    } else if (status === 400) {
      message =
        error.response?.data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!";
    }
    setErrorMessage(message);
  };

  // Handle search and filter
  useEffect(() => {
    if (userRole !== "ADMIN") return;
    fetchInventories();
  }, [searchTerm, filterUnit, userRole]);

  // Unique units for filter dropdown
  const uniqueUnits = ["All", ...new Set(inventory.map((item) => item.unit))];

  // Handle delete inventory
  const handleDeleteClick = (item) => {
    if (userRole !== "ADMIN") return;
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userRole !== "ADMIN" || !itemToDelete) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/inventory/${itemToDelete.id}`,
        {
          headers: getAuthHeaders(),
        }
      );
      const updatedInventory = inventory.filter(
        (item) => item.id !== itemToDelete.id
      );
      setInventory(updatedInventory);
      setFilteredInventory(updatedInventory);
    } catch (error) {
      await handleApiError(error, "Không xóa được nguyên liệu");
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleCancelDelete = () => {
    if (userRole !== "ADMIN") return;
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Handle edit inventory
  const handleEditClick = (item) => {
    if (userRole !== "ADMIN") return;
    setItemToEdit(item);
    setNewItem({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      customUnit: "",
    });
    setShowEditForm(true);
  };

  const confirmEditItem = async () => {
    if (userRole !== "ADMIN") return;
    if (!newItem.quantity || !newItem.unit) {
      setErrorMessage("Vui lòng nhập số lượng và đơn vị!");
      return;
    }
    const parsedQuantity = parseFloat(newItem.quantity);
    const finalUnit =
      newItem.unit === "new" ? newItem.customUnit : newItem.unit;
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage("Số lượng phải là số dương!");
      return;
    }
    if (!finalUnit) {
      setErrorMessage("Đơn vị không hợp lệ!");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/inventory/${itemToEdit.id}`,
        {
          quantity: parsedQuantity,
          unit: finalUnit,
          lastUpdated: new Date().toISOString().split("T")[0],
        },
        { headers: getAuthHeaders() }
      );
      await fetchInventories();
      setShowEditForm(false);
      setItemToEdit(null);
      setNewItem({ ingredientId: "", quantity: "", unit: "", customUnit: "" });
      setErrorMessage("");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      await handleApiError(error, "Không cập nhật được nguyên liệu");
    }
  };

  // Handle add inventory
  const validateAndAddItem = async () => {
    if (userRole !== "ADMIN") return;
    if (!newItem.ingredientId || !newItem.quantity || !newItem.unit) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    const parsedIngredientId = parseInt(newItem.ingredientId);
    const parsedQuantity = parseFloat(newItem.quantity);
    const finalUnit =
      newItem.unit === "new" ? newItem.customUnit : newItem.unit;
    if (isNaN(parsedIngredientId) || parsedIngredientId <= 0) {
      setErrorMessage("Mã nguyên liệu phải là số dương!");
      return;
    }
    if (ingredients.length === 0) {
      setErrorMessage("Không tải được nguyên liệu. Vui lòng thử lại!");
      return;
    }
    const ingredient = ingredients.find(
      (ing) => ing.ingredientId === parsedIngredientId
    );
    if (!ingredient) {
      setErrorMessage(
        `Nguyên liệu có mã ${parsedIngredientId} không tồn tại!`
      );
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage("Số lượng phải là số dương!");
      return;
    }
    if (!finalUnit) {
      setErrorMessage("Đơn vị không hợp lệ!");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/inventory`,
        {
          ingredientId: parsedIngredientId,
          quantity: parsedQuantity,
          unit: finalUnit,
          lastUpdated: new Date().toISOString().split("T")[0],
        },
        { headers: getAuthHeaders() }
      );
      await fetchInventories();
      setShowAddForm(false);
      setNewItem({ ingredientId: "", quantity: "", unit: "", customUnit: "" });
      setErrorMessage("");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      await handleApiError(error, "Không thêm được nguyên liệu");
    }
  };

  // Render "Access Denied" message if user is not ADMIN
  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-screen w-full flex flex-col bg-cream">
        <MenuBar
          title="Quản lý kho"
          icon="https://img.icons8.com/?size=100&id=4NUeu__UwtXf&format=png&color=FFFFFF"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg text-xl">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-cream">
      <MenuBar
        title="Quản lý kho"
        icon="https://img.icons8.com/?size=100&id=4NUeu__UwtXf&format=png&color=FFFFFF"
      />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-transparent overflow-y-auto">
        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-gray-600">Đang tải kho...</div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex space-x-4 items-center">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên nguyên liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 p-3 pl-10 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300 hover:shadow-md placeholder-gray-400 text-gray-700"
              disabled={userRole !== "ADMIN"}
            />
          </div>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="h-12 px-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300 hover:shadow-md text-gray-700"
            disabled={userRole !== "ADMIN"}
          >
            {uniqueUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit === "All" ? "Tất cả" : unit}
              </option>
            ))}
          </select>
          <button
            className="h-12 px-6 bg-brand text-white font-semibold rounded-xl shadow-md hover:bg-brand-hover transition-all duration-200"
            onClick={() => setShowAddForm(true)}
            disabled={ingredients.length === 0 || userRole !== "ADMIN"}
          >
            Thêm nguyên liệu
          </button>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {filteredInventory.length === 0 && !isLoading ? (
            <div className="text-center text-gray-600">
              Kho chưa có nguyên liệu nào.
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div
                key={item.id}
                className="relative flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Left Section: Ingredient Info */}
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-brand to-brand-hover rounded-full mr-4 shadow-sm">
                    <span className="text-brand font-semibold">
                      {item.quantity}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">
                      {item.ingredientName}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Supplier: {item.supplierName}
                    </p>
                    <p className="text-gray-600 text-sm">Unit: {item.unit}</p>
                  </div>
                </div>

                {/* Right Section: Last Update and Actions */}
                <div className="flex flex-col items-end">
                  <span className="text-gray-500 text-sm font-medium mb-2">
                    {item.lastUpdate}
                  </span>
                  <div className="flex justify-end space-x-4">
                    <button
                      className="flex items-center px-4 py-2 !bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-200"
                      onClick={() => handleEditClick(item)}
                      disabled={userRole !== "ADMIN"}
                    >
                      <FaEdit className="mr-2" /> Sửa
                    </button>
                    <button
                      className="flex items-center px-4 py-2 !bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all duration-200"
                      onClick={() => handleDeleteClick(item)}
                      disabled={userRole !== "ADMIN"}
                    >
                      <FaTrash className="mr-2" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && !isLoading && ingredients.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <img alt="Logo" className="w-24 h-24" src="/img/logoremovebg.png" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Thêm nguyên liệu vào kho
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nguyên liệu <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.ingredientId}
                  onChange={(e) =>
                    setNewItem({ ...newItem, ingredientId: e.target.value })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                >
                  <option value="">Chọn nguyên liệu</option>
                  {ingredients.map((ingredient) => (
                    <option
                      key={ingredient.ingredientId}
                      value={ingredient.ingredientId}
                    >
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: e.target.value })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                  placeholder="Nhập số lượng (VD: 25.5)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đơn vị <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.unit === "new" ? "" : newItem.unit}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit: e.target.value || "new" })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                >
                  <option value="">Chọn đơn vị</option>
                  {uniqueUnits
                    .filter((u) => u !== "All")
                    .map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  <option value="new">Thêm đơn vị mới</option>
                </select>
                {newItem.unit === "new" && (
                  <input
                    type="text"
                    value={newItem.customUnit || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        customUnit: e.target.value,
                        unit: e.target.value,
                      })
                    }
                    className="w-full h-12 p-3 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                    placeholder="Nhập đơn vị mới (VD: lít)"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cập nhật lần cuối
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-US")}
                  disabled
                  className="w-full h-12 p-3 bg-gray-100 border border-gray-200 rounded-xl shadow-sm"
                />
              </div>
            </div>
            {errorMessage && (
              <p className="text-red-500 mt-4 text-center">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all duration-200"
                onClick={validateAndAddItem}
              >
                Thêm
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
                onClick={() => setShowAddForm(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <img alt="Logo" className="w-24 h-24" src="/img/logoremovebg.png" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Sửa nguyên liệu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nguyên liệu <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.ingredientId}
                  onChange={(e) =>
                    setNewItem({ ...newItem, ingredientId: e.target.value })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                  disabled
                >
                  <option value="">Chọn nguyên liệu</option>
                  {ingredients.map((ingredient) => (
                    <option
                      key={ingredient.ingredientId}
                      value={ingredient.ingredientId}
                    >
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: e.target.value })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                  placeholder="Nhập số lượng (VD: 25.5)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đơn vị <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.unit === "new" ? "" : newItem.unit}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit: e.target.value || "new" })
                  }
                  className="w-full h-12 p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                >
                  <option value="">Chọn đơn vị</option>
                  {uniqueUnits
                    .filter((u) => u !== "All")
                    .map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  <option value="new">Thêm đơn vị mới</option>
                </select>
                {newItem.unit === "new" && (
                  <input
                    type="text"
                    value={newItem.customUnit || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        customUnit: e.target.value,
                        unit: e.target.value,
                      })
                    }
                    className="w-full h-12 p-3 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent transition-all duration-300"
                    placeholder="Nhập đơn vị mới (VD: lít)"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cập nhật lần cuối
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-US")}
                  disabled
                  className="w-full h-12 p-3 bg-gray-100 border border-gray-200 rounded-xl shadow-sm"
                />
              </div>
            </div>
            {errorMessage && (
              <p className="text-red-500 mt-4 text-center">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all duration-200"
                onClick={confirmEditItem}
              >
                Lưu
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
                onClick={() => setShowEditForm(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-96 p-8 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <img alt="Logo" className="w-24 h-24" src="/img/logoremovebg.png" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Thành công
            </h3>
            <div className="flex justify-center">
              <FaCheck className="text-4xl text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-96 p-8 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <img alt="Logo" className="w-24 h-24" src="/img/logoremovebg.png" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
              BẠN CÓ CHẮC CHẮN?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-all duration-200"
                onClick={handleConfirmDelete}
              >
                YES
              </button>
              <button
                className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
                onClick={handleCancelDelete}
              >
                KHÔNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
