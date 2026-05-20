// src/components/modals/PaymentModal.jsx

import React, { useState } from "react";
import PaymentService from "../../services/PaymentService";

const PaymentModal = ({
  isOpen,
  onClose,
  tableData,
  onPaymentSuccess,
  setIsSuccessModalOpen,
  setIsProcessing,
  setError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showChangeAmount, setShowChangeAmount] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  // Calculate totals
  const totalAmount = PaymentService.calculateTotalAmount(
    tableData?.dishes || []
  );
  const discountValue = parseFloat(discountAmount) || 0;
  const finalAmount = totalAmount - discountValue;
  const changeAmount = parseFloat(receivedAmount) - finalAmount;

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Process payment through service
      await PaymentService.processPayment(tableData);

      // Close modal and show success
      onClose();
      onPaymentSuccess();
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Payment processing error:", err);
      setError("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      const receiptBlob = await PaymentService.generateReceipt(tableData);
      PaymentService.downloadReceipt(receiptBlob, tableData.id);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Failed to generate receipt. Please try again.");
    }
  };

  if (!isOpen || !tableData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-lg shadow-xl p-6 w-2/3 relative z-50">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            450 Le Van Viel Street, Tang Nhon Phu A Word, District 9
          </p>
          <p className="text-sm text-gray-600">Phone: 0987654321</p>
          <h3 className="font-bold mt-2 text-xl text-blue-800">Payment Slip</h3>
        </div>

        {/* Table Info */}
        <div className="flex justify-between border-b pb-2 mb-4">
          <span className="font-bold text-gray-700">Table {tableData.id}</span>
          <span className="font-bold text-gray-700">
            {new Date().toLocaleDateString()} |{" "}
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Items Table */}
        <div className="max-h-96 overflow-y-auto mb-4">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-700">
                  Dish name
                </th>
                <th className="text-left py-2 font-medium text-gray-700">
                  Qty
                </th>
                <th className="text-left py-2 font-medium text-gray-700">
                  Unit price
                </th>
                <th className="text-left py-2 font-medium text-gray-700">
                  Total amount
                </th>
                <th className="text-left py-2 font-medium text-gray-700">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.dishes.map((dish, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 text-gray-800">{dish.name}</td>
                  <td className="py-3">{dish.quantity}</td>
                  <td className="py-3">
                    {dish.price ? dish.price.toLocaleString() : "-"}
                  </td>
                  <td className="py-3 font-medium">
                    {dish.price
                      ? (dish.price * dish.quantity).toLocaleString()
                      : "-"}
                  </td>
                  <td className="py-3 text-gray-500">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Method */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Payment Method</h4>
          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg ${
                paymentMethod === "cash"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              Cash
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                paymentMethod === "card"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              Card
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                paymentMethod === "banking"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setPaymentMethod("banking")}
            >
              Banking
            </button>
          </div>

          {/* Cash payment options */}
          {paymentMethod === "cash" && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Discount:</label>
                <input
                  type="number"
                  className="border border-gray-300 rounded px-3 py-1 w-48"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Amount received:</label>
                <input
                  type="number"
                  className="border border-gray-300 rounded px-3 py-1 w-48"
                  placeholder="Enter amount"
                  value={receivedAmount}
                  onChange={(e) => {
                    setReceivedAmount(e.target.value);
                    setShowChangeAmount(true);
                  }}
                />
              </div>
              {showChangeAmount &&
                parseFloat(receivedAmount) >= finalAmount && (
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Change:</label>
                    <span className="font-medium">
                      {changeAmount.toLocaleString()} VND
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="flex justify-between mt-4 border-t pt-4">
          <span className="font-bold text-gray-700">Staff: 1</span>
          <div className="text-right">
            <div className="flex justify-end space-x-4">
              <span className="font-medium">Subtotal:</span>
              <span className="font-medium">
                {totalAmount.toLocaleString()} VND
              </span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-end space-x-4">
                <span className="font-medium">Discount:</span>
                <span className="font-medium text-red-500">
                  - {discountValue.toLocaleString()} VND
                </span>
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-2">
              <span className="font-bold text-lg">Total Amount:</span>
              <span className="font-bold text-lg text-blue-800">
                {finalAmount.toLocaleString()} VND
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
            onClick={handlePrintReceipt}
          >
            Print Receipt
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            onClick={handlePaymentSubmit}
            disabled={
              paymentMethod === "cash" &&
              parseFloat(receivedAmount) < finalAmount
            }
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
