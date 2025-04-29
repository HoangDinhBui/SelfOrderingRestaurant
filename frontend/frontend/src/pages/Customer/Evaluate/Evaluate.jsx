import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Evaluate = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const positiveTags = [
    "Enthusiastic staff",
    "Delicious food",
    "Clean",
    "Airy space",
  ];
  const negativeTags = [
    "Unfriendly staff",
    "Orthes",
    "Not hygienic",
    "The food is not delicious",
  ];
  const tags = rating >= 4 ? positiveTags : negativeTags;

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    console.log("Rating:", rating);
    console.log("Selected Tags:", selectedTags);
    console.log("Feedback:", feedback);
    setIsSubmitted(true);
  };

  const handleDone = () => {
    navigate("/home");
  };

  const handleBack = () => {
    setIsSubmitted(false); 
  };

  if (isSubmitted) {
    return (
      <div className="min-w-96 min-h-screen bg-[#DCE5EB]/44 flex flex-col items-center justify-start">
        {/* Header */}
        <div className="w-full max-w-sm bg-white flex items-center justify-between p-4 border-b border-gray-200">
          <button onClick={handleBack} className="text-gray-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-base font-semibold text-center flex-1">
            Service quality assessment
          </div>
        </div>

        <div>
          <img
            src="./src/assets/img/logoremovebg.png"
            alt="Thank You"
            className="w-40 h-40 mt-2"
          />
        </div>
        {/* Tags */}

        <div className="text-center text-xl mb-2 w-full max-w-sm p-2">
          <h3>
            <b>We sincerely thank our customers!</b>
          </h3>
        </div>

        <div className="text-center text-l mb-1 w-full max-w-sm p-2 text-gray-400">
          <h3>
            We will continue to strive to serve you <br></br>better and better.
          </h3>
        </div>

        <div className="text-center mb-4 w-60 max-w-sm p-4">
          <img src="./src/assets/img/thanks.png" alt="Thanks" />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleDone}
          className="text-white text-l mt-3"
          style={{
            backgroundColor: "#000",
            padding: "10px 20px",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DCE5EB]/44 flex flex-col items-center justify-start">
      {/* Header */}
      <div className="w-full max-w-sm bg-white flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={handleBack} className="text-gray-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-base font-semibold text-center flex-1">
          Service quality assessment
        </div>
      </div>

      {/* Rating */}
      <div className="text-center mb-4 w-full max-w-sm p-4">
        <p className="text-l font-semibold mb-2 mt-4">
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
        <div className="mt-7 flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              tabIndex="-1"
              className={`text-xl bg-transparent ${
                rating >= star ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="text-center mb-4 w-full max-w-sm">
        <p className="text-sm font-semibold mb-5">
          {rating >= 4
            ? "What do you like about the service?"
            : "What don't you like about the service?"}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-full border text-xs ${
                selectedTags.includes(tag)
                  ? "bg-blue-100 text-green-500"
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
        className="w-90 max-w-sm p-2 mt-5 border rounded-lg mb-4 text-xs h-24 resize-none"
      ></textarea>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="text-white text-l mt-3"
        style={{
          backgroundColor: "#000",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default Evaluate;
