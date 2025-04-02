import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Evaluate = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0); // Lưu trạng thái đánh giá sao
  const [selectedTags, setSelectedTags] = useState([]); // Lưu trạng thái các tag được chọn
  const [feedback, setFeedback] = useState(""); // Lưu trạng thái nội dung feedback

  // Tags cho từng trường hợp
  const positiveTags = ["Enthusiastic staff", "Delicious food", "Clean", "Airy space"];
  const negativeTags = ["Unfriendly staff", "Orthes", "Not hygienic", "The food is not delicious"];

  // Xác định danh sách tag dựa trên số sao
  const tags = rating >= 4 ? positiveTags : negativeTags;

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag)); // Bỏ chọn tag
    } else {
      setSelectedTags([...selectedTags, tag]); // Chọn tag
    }
  };

  const handleSubmit = () => {
    // Xử lý logic gửi đánh giá
    console.log("Rating:", rating);
    console.log("Selected Tags:", selectedTags);
    console.log("Feedback:", feedback);

    // Điều hướng về trang chính hoặc trang khác
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {/* Header */}
      <div className="text-xl font-bold mb-6">Service quality assessment</div>

      {/* Rating */}
      <div className="text-center mb-6">
        <p className="text-lg font-semibold mb-2">
          {rating === 5
            ? "Very satisfied"
            : rating === 4
            ? "Satisfied"
            : rating === 3
            ? "Neutral"
            : rating === 2
            ? "Dissatisfied"
            : rating === 1
            ? "Very dissatisfied"
            : "Rate our service"}
        </p>
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              tabIndex="-1"
              className={`text-2xl !bg-transparent  ${
                rating >= star ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="text-center mb-6">
        <p className="text-lg font-semibold mb-2">
          {rating >= 4
            ? "What do you like about the service?"
            : "What don't you like about the service?"}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-4 py-2 rounded-full border ${
                selectedTags.includes(tag)
                  ? "!bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Help us understand better"
        className="w-full max-w-md p-2 border rounded-lg mb-6"
      ></textarea>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="!bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
      >
        SUBMIT
      </button>
    </div>
  );
};

export default Evaluate;