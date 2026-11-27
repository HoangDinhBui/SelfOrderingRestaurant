import axios from "axios";
import { BACKEND_URL } from "../config";

/**
 * Khách gửi đơn tại bàn: tạo đơn qua GraphQL, lưu thông tin để trang thanh toán dùng, báo cho nhân viên.
 * items: [{ dishId, quantity, notes }]. Trả về orderId.
 */
export const submitCustomerOrder = async ({ tableId, items, totalAmount }) => {
  const response = await fetch(`${BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      query: `
          mutation CreateOrder($input: OrderInput!) {
            createOrder(input: $input)
          }
        `,
      variables: {
        input: {
          tableId: tableId.toString(),
          customerName: "Guest",
          items: items.map((item) => ({
            dishId: item.dishId.toString(),
            quantity: item.quantity,
            notes: item.notes || "",
          })),
          notes: "",
        },
      },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message || "Error creating order");
  }

  const orderId = result.data.createOrder;
  if (!orderId) {
    throw new Error("Could not get orderId from response");
  }

  const paymentInfo = {
    orderId: orderId,
    amount: totalAmount,
    customerId: null,
    createdAt: new Date().toISOString(),
    isPaid: false,
  };
  localStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));
  sessionStorage.setItem("latestOrderInfo", JSON.stringify(paymentInfo));

  // Báo cho nhân viên; lỗi ở đây không làm hỏng đơn đã tạo
  try {
    await axios.post(`${BACKEND_URL}/api/notifications`, {
      tableNumber: Number(tableId),
      customerId: null,
      orderId: Number(orderId),
      type: "NEW_ORDER",
      additionalMessage: `New order placed for Table ${tableId}`,
    });
  } catch (notificationError) {
    console.error("Failed to send order notification:", notificationError);
  }

  return orderId;
};
