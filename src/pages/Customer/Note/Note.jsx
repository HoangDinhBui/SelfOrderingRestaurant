import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const Note = () => {
  const { id } = useParams(); // Lấy id món ăn từ URL
  const navigate = useNavigate();
  const location = useLocation(); // Lấy state được truyền khi điều hướng
  const itemName = location.state?.name || `Item ${id}`; // Lấy tên món ăn từ state hoặc hiển thị mặc định

  // Lấy ghi chú từ localStorage nếu có
  const [note, setNote] = useState(() => localStorage.getItem(`note-${id}`) || "");

  // Hàm xử lý lưu ghi chú
  const handleSave = () => {
    // Lưu ghi chú vào localStorage
    localStorage.setItem(`note-${id}`, note);
    navigate(-1); // Quay lại trang trước đó
  };

  // Hàm xử lý hủy bỏ
  const handleCancel = () => {
    navigate(-1); // Quay lại trang trước đó
  };

  return (
    <div className="min-h-screen bg-gray-100 p-15 flex flex-col items-center">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10 flex items-center justify-between w-full max-w-2xl px-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-left flex-1 ml-2">Note</h2>
        <div className="w-4"></div> {/* Để giữ cân bằng với nút quay lại */}
      </div>

      {/* Tên món ăn */}
      <h3 className="text-center text-orange-500 font-bold text-xl mt-4">
        {itemName} {/* Hiển thị tên món ăn */}
      </h3>

      {/* Ghi chú */}
        <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full max-w-3xl h-[500px] mt-4 p-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Write your note here..."
        ></textarea>

      {/* Nút Save và Cancel */}
      <div className="flex justify-between w-full max-w-2xl mt-6">
        <button
          onClick={handleSave}
          className="!bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          SAVE
        </button>
        <button
          onClick={handleCancel}
          className="border border-black text-black px-6 py-2 rounded-lg hover:bg-gray-200"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default Note;