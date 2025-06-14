import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authAPI, logout } from "../../../axiosConfig";

const CheckOut = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("CheckOut: Mounting, initial localStorage:", {
      accessToken: localStorage.getItem("accessToken"),
      username: localStorage.getItem("username"),
      userType: localStorage.getItem("userType"),
      staffId: localStorage.getItem("staffId"),
    });

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

    // Verify user authentication
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const userType = localStorage.getItem("userType");

    console.log("CheckOut: Auth check", { token: !!token, username, userType });

    if (!token || !username) {
      setMessage("Please log in first.");
      toast.warn("Authentication issue detected. You can skip check-out.");
      setAuthError(true);
    } else if (userType && userType !== "STAFF" && userType !== "ADMIN") {
      setMessage("Access restricted to STAFF and ADMIN only.");
      toast.warn("Restricted access. You can skip check-out.");
      setAuthError(true);
    }

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1];
        const payload = { image: base64data };

        console.log("Check-out payload:", payload);

        try {
          // Call check-out API
          const checkOutResponse = await authAPI.post(
            "/attendance/check-out",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          setMessage(checkOutResponse.data.message);

          // Handle notifications
          if (checkOutResponse.data.message.includes("Warning")) {
            toast.warn(checkOutResponse.data.message);
          } else if (checkOutResponse.data.message.includes("successful")) {
            toast.success(checkOutResponse.data.message);
          } else {
            toast.info(checkOutResponse.data.message);
          }

          // If check-out is successful or "spam", proceed to logout
          if (
            checkOutResponse.data.message.includes("successful") ||
            checkOutResponse.data.message.includes("spam")
          ) {
            console.log("Check-out processed, proceeding to logout");
            try {
              const logoutResponse = await logout();
              console.log("Logout API response:", logoutResponse);
              toast.success("Logged out successfully.");
            } catch (logoutError) {
              console.error("Logout error:", logoutError);
              toast.warn(
                "Check-out completed but failed to log out from server."
              );
            }

            // Clear localStorage and navigate
            console.log("Clearing localStorage");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("username");
            localStorage.removeItem("userType");
            localStorage.removeItem("staffId");
            navigate("/login", { replace: true });
          }
        } catch (error) {
          console.error("Check-out error:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Error during check-out. Please try again.";
          setMessage(errorMessage);
          toast.error(errorMessage);
          if (error.response?.status === 403) {
            setMessage("Access denied. Please verify STAFF or ADMIN role.");
            toast.error("Access denied. Please verify STAFF or ADMIN role.");
            setAuthError(true);
          } else if (error.response?.status === 401) {
            setMessage("Session expired. Please try again or skip check-out.");
            toast.error("Session expired. Please try again or skip check-out.");
            setAuthError(true);
          }
        } finally {
          setLoading(false);
        }
      };
    }, "image/jpeg");
  };

  const handleSkipCheckOut = () => {
    console.log("Skipping check-out, clearing localStorage");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    localStorage.removeItem("staffId");
    toast.info("Check-out skipped. You have been logged out.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-4">Check-out with Camera</h1>
      <video
        ref={videoRef}
        autoPlay
        className="border border-gray-400 mb-4"
        width="640"
        height="480"
      />
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      <div className="flex space-x-4">
        <button
          onClick={handleCapture}
          disabled={loading}
          className={`px-6 py-2 !bg-red-600 text-white rounded-lg hover:bg-red-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Checking out..." : "Capture and Check-out"}
        </button>
        <button
          onClick={handleSkipCheckOut}
          disabled={loading}
          className={`px-6 py-2 !bg-gray-600 text-white rounded-lg hover:bg-gray-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Skip Check-out
        </button>
      </div>
      {message && (
        <p
          className={`mt-4 ${
            message.includes("successful")
              ? "text-green-600"
              : message.includes("Warning")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
      {authError && (
        <p className="mt-4 text-yellow-600">
          Authentication issue detected. You can retry check-out or skip to log
          out.
        </p>
      )}
    </div>
  );
};

export default CheckOut;
