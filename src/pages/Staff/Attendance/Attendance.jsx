import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Attendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        setMessage("Error accessing camera: " + err.message);
      });

    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const userType = localStorage.getItem("userType");

    if (!token || !username) {
      setMessage("Please log in first.");
      navigate("/login", { replace: true });
      return;
    }

    if (userType !== "STAFF" && userType !== "ADMIN") {
      setMessage("Access restricted to STAFF and ADMIN only.");
      navigate("/login", { replace: true });
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [navigate]);

  const handleCapture = async () => {
    setLoading(true);
    setMessage("");

    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    canvasRef.current.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      try {
        const response = await axios.post(
          "http://localhost:8080/api/attendance/check-in-camera",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setMessage(response.data.message);
        const userType = localStorage.getItem("userType");
        if (
          response.data.message.includes("successful") &&
          userType === "STAFF"
        ) {
          navigate("/table-management_staff", { replace: true });
        }
      } catch (error) {
        console.error("Check-in error:", error);
        setMessage(
          error.response?.data?.message ||
            "Error during check-in. Please try again."
        );
        if (error.response?.status === 403) {
          setMessage(
            "Access denied. Ensure your token is valid and you have STAFF role."
          );
        } else if (error.response?.status === 401) {
          setMessage("Session expired. Please log in again.");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }, "image/jpeg");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Check-in with Camera</h1>
      <video
        ref={videoRef}
        autoPlay
        className="border border-gray-400 mb-4"
        width="640"
        height="480"
      />
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      <button
        onClick={handleCapture}
        disabled={loading}
        className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Checking in..." : "Capture and Check-in"}
      </button>
      {message && (
        <p
          className={`mt-4 ${
            message.includes("successful") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Attendance;
