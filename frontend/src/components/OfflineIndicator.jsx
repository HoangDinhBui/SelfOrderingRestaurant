import React, { useState, useEffect, useContext } from "react";
import { CartContext } from "../context/CartContext";

const OfflineIndicator = () => {
  const { apiStatus, toggleOfflineMode } = useContext(CartContext);
  const [offlineMode, setOfflineMode] = useState(false);

  // Monitor API status and toggle offline mode when needed
  useEffect(() => {
    if (!apiStatus.online && !offlineMode) {
      // Server went offline while we were online
      setOfflineMode(true);
      toggleOfflineMode(true);
    } else if (apiStatus.online && offlineMode) {
      // Server came back online
      // Don't auto-switch back to online mode, let user decide
    }
  }, [apiStatus, offlineMode, toggleOfflineMode]);

  const handleModeToggle = () => {
    const newMode = !offlineMode;
    setOfflineMode(newMode);
    toggleOfflineMode(newMode);
  };

  if (apiStatus.online && !offlineMode) {
    return null; // Don't show anything when online
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-2 text-center text-sm ${
        offlineMode ? "bg-yellow-500" : "bg-red-500"
      } text-white z-50`}
    >
      {offlineMode ? (
        <>
          Running in offline mode (using cached data)
          {apiStatus.online && (
            <button
              onClick={handleModeToggle}
              className="ml-2 bg-white text-yellow-500 px-2 py-1 rounded text-xs"
            >
              Switch to Online Mode
            </button>
          )}
        </>
      ) : (
        <>
          Server connection failed
          <button
            onClick={handleModeToggle}
            className="ml-2 bg-white text-red-500 px-2 py-1 rounded text-xs"
          >
            Switch to Offline Mode
          </button>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
