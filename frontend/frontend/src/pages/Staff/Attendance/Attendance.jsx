import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Attendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize camera
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        setMessage("Error accessing camera: " + err.message);
        toast.error("Error accessing camera: " + err.message);
      });

    // Verify authentication
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const userType = localStorage.getItem("userType");

    console.log("Attendance: Auth check", {
      token: !!token,
      username,
      userType,
    });

    if (!token || !username) {
      setMessage("Please log in first.");
      toast.error("Please log in first.");
      navigate("/login", { replace: true });
      return;
    }

    if (userType !== "STAFF" && userType !== "ADMIN") {
      setMessage("Only STAFF and ADMIN can access this page.");
      toast.error("Only STAFF and ADMIN can access this page.");
      navigate("/login", { replace: true });
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Cleanup
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

        // Handle notifications
        const messageLower = response.data.message.toLowerCase();
        if (
          messageLower.includes("thành công") ||
          messageLower.includes("ghi nhận")
        ) {
          toast.success(response.data.message);
        } else {
          toast.info(response.data.message);
        }

        // Navigate for STAFF
        const userType = localStorage.getItem("userType");
        console.log("Check-in response:", {
          message: response.data.message,
          userType,
          shouldNavigate:
            messageLower.includes("thành công") ||
            messageLower.includes("ghi nhận"),
        });

        if (
          (messageLower.includes("thành công") ||
            messageLower.includes("ghi nhận")) &&
          userType === "STAFF"
        ) {
          console.log("Navigating to /table-management_staff");
          navigate("/table-management_staff", { replace: true });
        } else {
          console.warn("Navigation skipped", {
            userType,
            message: response.data.message,
          });
        }
      } catch (error) {
        console.error("Check-in error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Error during check-in. Please try again.";
        setMessage(errorMessage);
        toast.error(errorMessage);
        if (error.response?.status === 403) {
          setMessage("Access denied. Please verify STAFF role.");
          toast.error("Access denied. Please verify STAFF role.");
          navigate("/login", { replace: true });
        } else if (error.response?.status === 401) {
          setMessage("Session expired. Please log in again.");
          toast.error("Session expired. Please log in again.");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }, "image/jpeg");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen p-4"
      style={{
        backgroundImage: "url('https://i.pinimg.com/736x/94/95/3b/94953b87c421ef358cad42c358876403.jpg')",
      }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-center text-black mb-6"
            style={{ fontFamily: "'Baskervville', serif", fontStyle: "italic", fontSize: "2.5rem" }}
          >Check-in with Camera</h1>
      <video
        ref={videoRef}
        autoPlay
        className="border border-gray-600 mb-4"
        width="600"
        height="480"
        style={{ borderRadius: "20px" }}
      />
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      <button
        onClick={handleCapture}
        disabled={loading}
        style={{
        background:"radial-gradient(circle at center, #5E5E5E 100%)",
      }}
        className={`px-6 py-2 !bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`
        }
      >
        {loading ? "Checking in..." : "Capture and Check-in"}
      </button>
      <img
        src="https://media.tenor.com/WN09MfEh7FAAAAAj/cute-food.gif"
        alt="Animation"
        className="mt-4 w-25 h-25"
      />
      {message && (
        <p
          className={`mt-4 ${
            message.toLowerCase().includes("thành công") ||
            message.toLowerCase().includes("ghi nhận")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Attendance;
