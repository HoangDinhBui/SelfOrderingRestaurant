package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.PaymentVNPayRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.ProcessPaymentRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentVNPayResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Repository.PaymentRepository;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import com.example.SelfOrderingRestaurant.Service.WebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final DinningTableRepository tableRepository;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @PostMapping("/vnpay")
    public ResponseEntity<?> createPayment(@RequestBody PaymentVNPayRequestDTO request, HttpServletRequest httpRequest) {
        try {
            if (!request.getOrderInfo().contains("Order:")) {
                request.setOrderInfo("Payment for Order: " + request.getOrderId());
            }

            String paymentUrl = paymentService.createVNPayOrder(request.getTotal(), request.getOrderInfo(), request.getReturnUrl());

            return ResponseEntity.ok(PaymentVNPayResponseDTO.builder()
                    .paymentUrl(paymentUrl)
                    .message("VNPay payment URL generated successfully.")
                    .build());
        } catch (Exception e) {
            log.error("Error creating payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi tạo thanh toán: " + e.getMessage());
        }
    }

    @GetMapping("/vnpay_payment")
    public ResponseEntity<?> handleVNPayReturn(HttpServletRequest request) {
        try {
            String queryString = request.getQueryString();
            log.info("🔹 Original query string: {}", queryString);

            Map<String, String> params = parseQueryString(queryString);
            log.info("🔹 Parsed params: {}", params);

            Map<String, Object> result = paymentService.orderReturn(params);
            int status = (int) result.get("status");
            String transactionStatus = (String) result.get("transactionStatus");
            String responseCode = (String) result.get("responseCode");

            log.info("🔹 Payment Result - Status: {}, Transaction Status: {}, Response Code: {}",
                    status, transactionStatus, responseCode);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("transactionStatus", transactionStatus);
            responseBody.put("responseCode", responseCode);

            if (status == 1) {
                // Additional check to ensure table status is updated
                String txnRef = params.get("vnp_TxnRef");
                Payment payment = paymentRepository.findByTransactionId(txnRef);
                if (payment != null && payment.getOrder() != null) {
                    DinningTable table = payment.getOrder().getTables();
                    if (table != null && table.getTableStatus() != TableStatus.AVAILABLE) {
                        table.setTableStatus(TableStatus.AVAILABLE);
                        tableRepository.save(table);
                        log.warn("Table {} status was not updated correctly by service layer. Corrected to AVAILABLE for order {}",
                                table.getTableNumber(), payment.getOrder().getOrderId());
                    }
                }

                responseBody.put("message", "Thanh toán thành công!");
                return ResponseEntity.ok(responseBody);
            } else if (status == 0) {
                responseBody.put("message", "Giao dịch thất bại!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
            } else {
                responseBody.put("message", "Sai chữ ký hoặc giao dịch bị thay đổi!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
            }
        } catch (Exception e) {
            log.error("Lỗi xử lý VNPay: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi xử lý VNPay: " + e.getMessage());
        }
    }

    private Map<String, String> parseQueryString(String queryString) {
        Map<String, String> result = new HashMap<>();
        if (queryString == null || queryString.isEmpty()) {
            return result;
        }

        String[] pairs = queryString.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0) {
                String key = pair.substring(0, idx);
                String value = idx < pair.length() - 1 ? pair.substring(idx + 1) : "";
                result.put(key, value);
            }
        }
        return result;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody ProcessPaymentRequestDTO request) {
        try {
            log.info("Processing payment for order ID: {}, with payment method: {}",
                    request.getOrderId(), request.getPaymentMethod());

            if (request.getOrderId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Order ID cannot be null"
                ));
            }

            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + request.getOrderId()));

            // Kiểm tra trạng thái đơn hàng
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "success", false,
                        "message", "Order has already been paid"
                ));
            }

            // Kiểm tra các giao dịch PENDING hoặc UNPAID hiện có
            List<Payment> existingPayments = paymentRepository.findByOrderAndStatusIn(
                    order, Arrays.asList(PaymentStatus.PENDING, PaymentStatus.UNPAID));
            Payment payment = null;
            for (Payment pendingPayment : existingPayments) {
                LocalDateTime paymentDate = pendingPayment.getPaymentDate();
                LocalDateTime expiryTime = paymentDate.plusMinutes(15);
                log.info("Found existing payment for order {}: transactionId={}, status={}, paymentDate={}",
                        request.getOrderId(), pendingPayment.getTransactionId(), pendingPayment.getStatus(), pendingPayment.getPaymentDate());

                if (LocalDateTime.now().isBefore(expiryTime)) {
                    // Giao dịch vẫn hợp lệ
                    payment = pendingPayment;
                    break;
                } else {
                    // Hủy giao dịch hết hạn
                    pendingPayment.setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(pendingPayment);
                    log.info("Cancelled expired {} payment for order {} with transaction ID: {}",
                            pendingPayment.getStatus(), request.getOrderId(), pendingPayment.getTransactionId());
                }
            }

            PaymentMethod method;
            try {
                method = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
            } catch (IllegalArgumentException e) {
                method = PaymentMethod.CASH;
            }

            boolean confirmPayment = request.isConfirmPayment();

            // Nếu không có giao dịch hợp lệ, tạo mới
            if (payment == null) {
                String txnRef = generateTransactionId();
                payment = new Payment();
                payment.setOrder(order);
                payment.setCustomer(order.getCustomer());
                if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Order total amount must be greater than zero");
                }
                payment.setAmount(order.getTotalAmount());
                payment.setPaymentMethod(method);
                payment.setStatus(confirmPayment ? PaymentStatus.PAID : PaymentStatus.UNPAID);
                payment.setTransactionId(txnRef);
                payment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(payment);
                log.info("Created new payment for order {}: transactionId={}, status={}, method={}",
                        request.getOrderId(), txnRef, payment.getStatus(), method);
            } else {
                // Cập nhật giao dịch hiện có nếu cần
                payment.setPaymentMethod(method);
                payment.setStatus(confirmPayment ? PaymentStatus.PAID : payment.getStatus());
                payment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(payment);
                log.info("Updated existing payment for order {}: transactionId={}, status={}, method={}",
                        request.getOrderId(), payment.getTransactionId(), payment.getStatus(), method);
            }

            if (confirmPayment) {
                order.setPaymentStatus(PaymentStatus.PAID);
                orderRepository.save(order);

                DinningTable table = order.getTables();
                if (table != null) {
                    boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                            table.getTableNumber(), PaymentStatus.UNPAID);
                    table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
                    tableRepository.save(table);
                    log.info("Table {} status updated to {} after payment for order {}",
                            table.getTableNumber(), table.getTableStatus(), order.getOrderId());
                }

                sendPaymentStatusUpdatedMessage(order);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", confirmPayment ? "Payment processed successfully" : "Payment initiated, awaiting confirmation");
            response.put("transactionId", payment.getTransactionId());
            response.put("paymentStatus", payment.getStatus().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing payment for order {}: {}", request.getOrderId(), e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reset/{orderId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetPaymentStatus(@PathVariable Integer orderId) {
        try {
            log.info("Resetting payment status for order ID: {}", orderId);

            // Tìm đơn hàng
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

            // Kiểm tra và hủy các giao dịch PENDING hoặc UNPAID
            List<Payment> existingPayments = paymentRepository.findByOrderAndStatusIn(
                    order, Arrays.asList(PaymentStatus.PENDING, PaymentStatus.UNPAID));
            int cancelledCount = 0;
            for (Payment payment : existingPayments) {
                payment.setStatus(PaymentStatus.CANCELLED);
                paymentRepository.save(payment);
                log.info("Cancelled payment for order {}: transactionId={}, previous status={}",
                        orderId, payment.getTransactionId(), payment.getStatus());
                cancelledCount++;
            }

            // Ghi log nếu có nhiều giao dịch bị hủy
            if (cancelledCount > 1) {
                log.warn("Multiple payments (count={}) were cancelled for order ID: {}", cancelledCount, orderId);
            } else if (cancelledCount == 0) {
                log.info("No PENDING or UNPAID payments found for order ID: {}", orderId);
            }

            // Đặt lại paymentStatus của đơn hàng về UNPAID
            if (order.getPaymentStatus() != PaymentStatus.UNPAID) {
                order.setPaymentStatus(PaymentStatus.UNPAID);
                orderRepository.save(order);
                log.info("Reset paymentStatus to UNPAID for order ID: {}", orderId);
            }

            // Kiểm tra và cập nhật trạng thái bàn ăn
            DinningTable table = order.getTables();
            if (table != null) {
                boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                        table.getTableNumber(), PaymentStatus.UNPAID);
                table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
                tableRepository.save(table);
                log.info("Reset table {} status to {} for order ID: {}",
                        table.getTableNumber(), table.getTableStatus(), orderId);
            } else {
                log.warn("No table associated with order ID: {}", orderId);
            }

            // Gửi thông báo WebSocket
            sendPaymentStatusResetMessage(order);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment status reset successfully for order ID: " + orderId);
            response.put("cancelledPayments", cancelledCount);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Error resetting payment status for order {}: {}", orderId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            log.error("Unexpected error resetting payment status for order {}: {}", orderId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to reset payment status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private void sendPaymentStatusResetMessage(Order order) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "PAYMENT_STATUS_RESET");
        message.put("orderId", order.getOrderId());
        message.put("paymentStatus", order.getPaymentStatus().name());

        DinningTable table = order.getTables();
        if (table != null) {
            message.put("tableNumber", table.getTableNumber());
            message.put("tableStatus", table.getTableStatus().name());
        } else {
            log.warn("No table associated with order {}", order.getOrderId());
        }

        NotificationResponseDTO notification = NotificationResponseDTO.builder()
                .orderId(order.getOrderId())
                .tableNumber(table != null ? table.getTableNumber() : null)
                .title("Payment Status Reset")
                .content("Payment status reset for order " + order.getOrderId())
                .isRead(false)
                .type(NotificationType.PAYMENT_REQUEST) // Giả định NotificationType.PAYMENT_REQUEST phù hợp
                .createAt(LocalDateTime.now())
                .customPayload(message)
                .build();

        try {
            String messageJson = objectMapper.writeValueAsString(notification);
            log.info("Sending WebSocket message for reset: {}", messageJson);
            webSocketService.sendNotificationToActiveStaff(notification);
            log.info("Sent PAYMENT_STATUS_RESET for orderId: {}, tableNumber: {}, tableStatus: {}",
                    order.getOrderId(),
                    table != null ? table.getTableNumber() : "N/A",
                    table != null ? table.getTableStatus().name() : "N/A");
        } catch (Exception e) {
            log.error("Failed to send PAYMENT_STATUS_RESET for orderId: {}: {}",
                    order.getOrderId(), e.getMessage(), e);
        }
    }

    @Transactional
    public void confirmPayment(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        Optional<Payment> paymentOptional = paymentRepository.findTopByOrderAndStatusInOrderByPaymentDateDesc(
                order, Arrays.asList(PaymentStatus.UNPAID, PaymentStatus.PENDING));

        if (paymentOptional.isEmpty()) {
            log.error("No UNPAID or PENDING payment found for order ID: {}", orderId);
            throw new IllegalArgumentException("No pending payment found for order ID: " + orderId);
        }

        Payment payment = paymentOptional.get();
        log.info("Found payment for order {}: transactionId={}, status={}, method={}",
                orderId, payment.getTransactionId(), payment.getStatus(), payment.getPaymentMethod());

        if (payment.getStatus() == PaymentStatus.PENDING) {
            LocalDateTime paymentDate = payment.getPaymentDate();
            LocalDateTime expiryTime = paymentDate.plusMinutes(15);
            if (LocalDateTime.now().isAfter(expiryTime)) {
                payment.setStatus(PaymentStatus.CANCELLED);
                paymentRepository.save(payment);
                log.info("Cancelled expired PENDING payment for order {}: transactionId={}",
                        orderId, payment.getTransactionId());
                throw new IllegalArgumentException("Pending payment has expired for order ID: " + orderId);
            }
            throw new IllegalStateException("Cannot confirm payment: Payment is still PENDING for order ID: " + orderId);
        }

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        DinningTable table = order.getTables();
        if (table != null) {
            log.info("Before update: Table {} status is {} for order {}",
                    table.getTableNumber(), table.getTableStatus(), orderId);
            table.setTableStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
            log.info("After update: Table {} status updated to AVAILABLE for order {}",
                    table.getTableNumber(), orderId);
        } else {
            log.warn("No table associated with order {}", orderId);
        }

        log.info("Payment confirmed successfully for order ID: {}", orderId);
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, Integer> request) {
        Integer orderId = request.get("orderId");
        log.info("Confirming payment for order ID: {}", orderId);

        // Tìm bản ghi thanh toán mới nhất với trạng thái PENDING hoặc UNPAID
        Optional<Payment> paymentOptional = paymentRepository.findTopByOrder_OrderIdAndStatusInOrderByPaymentDateDesc(
                orderId, Arrays.asList(PaymentStatus.PENDING, PaymentStatus.UNPAID));

        if (paymentOptional.isEmpty()) {
            log.error("No UNPAID or PENDING payment found for order ID: {}", orderId);
            throw new IllegalArgumentException("No pending payment found for order ID: " + orderId);
        }

        Payment payment = paymentOptional.get();
        log.info("Found payment for order {}: transactionId={}, status={}, method={}",
                orderId, payment.getTransactionId(), payment.getStatus(), payment.getPaymentMethod());

        // Kiểm tra nếu giao dịch PENDING và còn hiệu lực
        if (payment.getStatus() == PaymentStatus.PENDING) {
            LocalDateTime paymentDate = payment.getPaymentDate();
            LocalDateTime expiryTime = paymentDate.plusMinutes(15);
            if (LocalDateTime.now().isAfter(expiryTime)) {
                payment.setStatus(PaymentStatus.CANCELLED);
                paymentRepository.save(payment);
                log.info("Cancelled expired PENDING payment for order {}: transactionId={}",
                        orderId, payment.getTransactionId());
                throw new IllegalStateException("Pending payment has expired for order ID: " + orderId);
            }
            throw new IllegalStateException("Cannot confirm payment: Payment is still PENDING for order ID: " + orderId);
        }

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        DinningTable table = order.getTables();
        if (table != null) {
            log.info("Before update: Table {} status is {} for order {}",
                    table.getTableNumber(), table.getTableStatus(), orderId);
            boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                    table.getTableNumber(), PaymentStatus.UNPAID);
            table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
            tableRepository.save(table);
            log.info("After update: Table {} status updated to {} for order {}",
                    table.getTableNumber(), table.getTableStatus(), orderId);
        }

        // Gửi thông báo WebSocket
        sendPaymentStatusUpdatedMessage(order);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Payment confirmed successfully");
        response.put("transactionId", payment.getTransactionId());
        log.info("Payment confirmed successfully for order ID: {}", orderId);
        return ResponseEntity.ok(response);
    }

    private void sendPaymentStatusUpdatedMessage(Order order) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "PAYMENT_STATUS_UPDATED");
        message.put("orderId", order.getOrderId());
        message.put("paymentStatus", order.getPaymentStatus().name());

        DinningTable table = order.getTables();
        if (table != null) {
            message.put("tableNumber", table.getTableNumber());
            message.put("tableStatus", table.getTableStatus().name());
        } else {
            log.warn("No table associated with order {}", order.getOrderId());
        }

        NotificationResponseDTO notification = NotificationResponseDTO.builder()
                .orderId(order.getOrderId())
                .tableNumber(table != null ? table.getTableNumber() : null)
                .title("Payment Update")
                .content("Payment status updated for order " + order.getOrderId())
                .isRead(false)
                .type(NotificationType.PAYMENT_REQUEST) // Ensure NotificationType.PAYMENT exists
                .createAt(LocalDateTime.now())
                .customPayload(message)
                .build();

        try {
            String messageJson = objectMapper.writeValueAsString(notification);
            log.info("Sending WebSocket message: {}", messageJson);
            webSocketService.sendNotificationToActiveStaff(notification);
            log.info("Sent PAYMENT_STATUS_UPDATED for orderId: {}, tableNumber: {}, tableStatus: {}",
                    order.getOrderId(),
                    table != null ? table.getTableNumber() : "N/A",
                    table != null ? table.getTableStatus().name() : "N/A");
        } catch (Exception e) {
            log.error("Failed to send PAYMENT_STATUS_UPDATED for orderId: {}: {}",
                    order.getOrderId(), e.getMessage(), e);
        }
    }

    private String generateTransactionId() {
        Random rand = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(rand.nextInt(10));
        }
        return sb.toString();
    }

    @GetMapping("/payment/status/{orderId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Integer orderId) {
        try {
            OrderPaymentDetailsDTO paymentDetails = paymentService.getOrderPaymentDetails(orderId);
            return ResponseEntity.ok(paymentDetails);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Payment not found for order ID: " + orderId);
        } catch (Exception e) {
            log.error("Error fetching payment status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve payment status: " + e.getMessage());
        }
    }

    @PostMapping("/payment/cash/{orderId}")
    public ResponseEntity<?> processCashPayment(@PathVariable Integer orderId) {
        try {
            paymentService.processCashPayment(orderId);
            return ResponseEntity.ok("Cash payment processed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Order not found with ID: " + orderId);
        } catch (Exception e) {
            log.error("Error processing cash payment for order {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process cash payment: " + e.getMessage());
        }
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<?> getPaymentById(@PathVariable Integer paymentId) {
        try {
            PaymentResponseDTO payment = paymentService.getPaymentById(paymentId);
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Payment not found with ID: " + paymentId);
        } catch (Exception e) {
            log.error("Error fetching payment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve payment: " + e.getMessage());
        }
    }
}