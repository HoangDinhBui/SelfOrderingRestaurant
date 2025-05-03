// Function to poll payment status
async function pollPaymentStatus(
  orderId,
  token,
  interval = 5000,
  maxAttempts = 60
) {
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/payment/payment/status/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Payment status for order ${orderId}: ${data.paymentStatus}`);

      // Stop polling if payment is PAID or max attempts reached
      if (data.paymentStatus === "PAID" || attempts >= maxAttempts) {
        clearInterval(pollingInterval);
        if (data.paymentStatus === "PAID") {
          console.log(`Payment for order ${orderId} is complete.`);
          // Trigger any UI updates or notifications
          updateUI(data);
        } else {
          console.warn(`Max polling attempts reached for order ${orderId}.`);
          // Handle max attempts reached (e.g., show error to user)
          handlePollingTimeout();
        }
      }

      attempts++;
    } catch (error) {
      console.error(
        `Error polling payment status for order ${orderId}:`,
        error
      );
      clearInterval(pollingInterval);
      // Handle error (e.g., show error message to user)
      handlePollingError(error);
    }
  };

  // Initial check
  await checkStatus();

  // Set up polling interval if still needed
  const pollingInterval = setInterval(checkStatus, interval);
}

// Example usage
const orderId = 189;
const jwtToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJST0xFX1NUQUZGIl0sInVzZXJUeXBlIjoiU1RBRkYiLCJ1c2VySWQiOjIsImVtYWlsIjoic3RhZmYxQHJlc3RhdXJhbnQuY29tIiwidXNlcm5hbWUiOiJzdGFmZjEiLCJzdWIiOiJzdGFmZjEiLCJpYXQiOjE3NDYyMTAxOTQsImV4cCI6MTc0NjIxMzc5NH0.6mzBjMZYM7IYNkPOcVxfnCQ349k07Mcr6A6Yglzqd0U";

// Helper functions for UI updates and error handling
function updateUI(data) {
  // Example: Update the UI with payment status
  const statusElement = document.getElementById("payment-status");
  if (statusElement) {
    statusElement.textContent = `Order ${data.orderId} Payment Status: ${data.paymentStatus}`;
  }
}

function handlePollingTimeout() {
  // Example: Show timeout message
  alert("Payment status check timed out. Please try again later.");
}

function handlePollingError(error) {
  // Example: Show error message
  alert(`Error checking payment status: ${error.message}`);
}

// Start polling
pollPaymentStatus(orderId, jwtToken);
