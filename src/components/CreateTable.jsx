import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const CreateTable = () => {
  const { tableNumber: tableNumberFromUrl } = useParams();
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = "http://localhost:8080";
  const APP_BASE_URL = "http://localhost:5173"; // URL ứng dụng frontend
  const QR_API_URL = "http://api.qrserver.com/v1/create-qr-code/";

  // Lấy số bàn từ localStorage hoặc URL khi component được tải
  useEffect(() => {
    let initialTableNumber = tableNumberFromUrl || localStorage.getItem("tableNumber") || "1";
    
    if (!isNaN(initialTableNumber) && parseInt(initialTableNumber) > 0) {
      setTableNumber(initialTableNumber);
      setQrUrl(
        `${QR_API_URL}?data=${encodeURIComponent(
          `${APP_BASE_URL}/table/${initialTableNumber}`
        )}&size=200x200`
      );
    } else {
      setError("Không tìm thấy số bàn hợp lệ!");
      setTableNumber("1");
      setQrUrl(
        `${QR_API_URL}?data=${encodeURIComponent(
          `${APP_BASE_URL}/table/1`
        )}&size=200x200`
      );
    }
  }, [tableNumberFromUrl]);

  // Xử lý khi tạo hoặc cập nhật mã QR
  const handleCreateTable = async () => {
    if (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) <= 0) {
      setError("Vui lòng nhập số bàn hợp lệ!");
      setQrUrl("");
      return;
    }

    setError(null);
    const tableUrl = `${APP_BASE_URL}/table/${tableNumber}`;
    const qrApiUrl = `${QR_API_URL}?data=${encodeURIComponent(tableUrl)}&size=200x200`;
    setQrUrl(qrApiUrl);
    localStorage.setItem("tableNumber", tableNumber); // Cập nhật localStorage

    // Lưu mã QR vào backend
    await uploadQrToBackend(qrApiUrl);
  };

  // Gửi mã QR đến backend để lưu
  const uploadQrToBackend = async (qrApiUrl) => {
    setUploading(true);
    try {
      // Tải hình ảnh QR từ api.qrserver.com
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, `table_${tableNumber}_qr.png`);
      formData.append("tableNumber", tableNumber);

      const res = await axios.post(`${API_BASE_URL}/api/qr/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status >= 200 && res.status < 300) {
        alert("Mã QR đã được lưu vào backend!");
      } else {
        throw new Error("Lỗi khi lưu mã QR!");
      }
    } catch (err) {
      console.error("Lỗi khi gửi mã QR:", err);
      setError("Không thể lưu mã QR vào backend. Vui lòng thử lại!");
    } finally {
      setUploading(false);
    }
  };

  // Xử lý tải mã QR
  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `table_${tableNumber}_qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi tải mã QR:", err);
      setError("Không thể tải mã QR. Vui lòng thử lại!");
    }
  };

  // Xử lý in mã QR
  const handlePrintQr = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <body onload="window.print()">
          <img src="${qrUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Tạo Mã QR Cho Bàn</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Số bàn:</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Nhập số bàn"
          />
        </div>

        <button
          onClick={handleCreateTable}
          disabled={uploading}
          className="w-full !bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? "Đang lưu..." : "Tạo và Lưu Mã QR"}
        </button>

        {qrUrl && (
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Mã QR cho bàn {tableNumber}
            </h3>
            <img src={qrUrl} alt={`QR Code for table ${tableNumber}`} style={{ width: "200px", height: "200px" }} />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={handleDownloadQr}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Tải Mã QR
              </button>
              <button
                onClick={handlePrintQr}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                In Mã QR
              </button>
            </div>
            <p className="mt-2 text-gray-600">
              URL: <a href={`${APP_BASE_URL}/table/${tableNumber}`} target="_blank" className="text-blue-500">{`${APP_BASE_URL}/table/${tableNumber}`}</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTable;