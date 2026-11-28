import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { BACKEND_URL } from "../../../config";
const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const positiveTags = ["Nhân viên nhiệt tình", "Món ăn ngon", "Sạch sẽ", "Không gian thoáng"];
  const negativeTags = ["Nhân viên chưa thân thiện", "Phục vụ chậm", "Chưa sạch sẽ", "Món ăn chưa ngon"];
  const tags = rating >= 4 ? positiveTags : negativeTags;

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    // Guests have no customer account: the backend takes the customer from the order
    const customerInfo = JSON.parse(localStorage.getItem("customerInfo") || "null");
    const orderId =
      new URLSearchParams(location.search).get("orderId") || localStorage.getItem("orderId");

    if (!rating) {
      setError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    if (!orderId && !customerInfo?.id) {
      setError("Không tìm thấy đơn hàng để đánh giá.");
      return;
    }

    const payload = {
      ...(customerInfo?.id ? { customerId: parseInt(customerInfo.id) } : {}),
      orderId: orderId ? parseInt(orderId) : null,
      rating: rating,
      feedback: feedback,
      selectedTags: selectedTags,
    };

    try {
      // Gửi yêu cầu POST tới backend
      const response = await axios.post(
        `${BACKEND_URL}/api/feedback`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Kiểm tra phản hồi từ backend
      if (response.status === 201) {
        console.log("Feedback submitted successfully:", response.data);
        setIsSubmitted(true); // Chuyển sang giao diện cảm ơn
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError(error.response?.data?.message || "Không gửi được đánh giá. Vui lòng thử lại.");
    }
  };

  const handleDone = () => {
    const savedTableNumber = localStorage.getItem("tableNumber") || "1";
    navigate(`/table/${savedTableNumber}`);
  };

  const handleBack = () => {
    setIsSubmitted(false);
    setError(null);
    navigate("/menu_cus");
  };

  const ratingLabel =
    ["Bạn thấy chúng tôi phục vụ thế nào?", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"][
      rating
    ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-card/95 backdrop-blur border-b border-line sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center px-2 h-14">
          <button
            onClick={handleBack}
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-soft transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-ink pr-11">Đánh giá chất lượng phục vụ</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 page-enter">
        {isSubmitted ? (
          <div className="flex flex-col items-center text-center bg-card border border-line rounded-3xl p-6 shadow-sm">
            <img src="/img/logoremovebg.png" alt="" width="500" height="500" className="w-28 h-28" />
            <h2 className="mt-2 text-xl font-bold text-ink">Chân thành cảm ơn quý khách!</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Chúng tôi sẽ không ngừng cố gắng để phục vụ bạn ngày một tốt hơn.
            </p>
            <img src="/img/thanks.png" alt="" width="640" height="493" className="mt-4 w-56 h-auto" />
            <button
              onClick={handleDone}
              className="mt-6 w-full h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition"
            >
              Về trang chủ
            </button>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-3xl p-5 shadow-sm">
            {/* Rating */}
            <div className="text-center">
              <p className="text-base font-semibold text-ink min-h-[24px]" aria-live="polite">
                {ratingLabel}
              </p>
              <div className="mt-3 flex justify-center gap-1" role="radiogroup" aria-label="Số sao">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} sao`}
                    onClick={() => {
                      setRating(star);
                      setError(null);
                    }}
                    className={`w-12 h-12 text-4xl leading-none transition-transform active:scale-90 ${
                      rating >= star ? "text-amber-500" : "text-line"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {rating > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-ink text-center">
                  {rating >= 4 ? "Bạn hài lòng điều gì?" : "Chúng tôi cần cải thiện điều gì?"}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        aria-pressed={active}
                        className={`min-h-[40px] px-4 rounded-full border text-sm transition ${
                          active
                            ? "bg-brand-soft border-brand text-brand font-semibold"
                            : "bg-white border-line text-ink hover:border-brand/40"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            <label htmlFor="feedback" className="block mt-6 text-sm font-semibold text-ink">
              Góp ý thêm <span className="font-normal text-ink-muted">(không bắt buộc)</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Chia sẻ thêm để chúng tôi phục vụ tốt hơn"
              className="mt-2 w-full p-3 border border-line bg-white rounded-xl text-sm h-28 resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              className="mt-5 w-full h-12 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover active:scale-[0.99] transition"
            >
              Gửi đánh giá
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Evaluate;
