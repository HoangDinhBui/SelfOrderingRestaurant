package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Config.VNPayConfig;
import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.ProcessPaymentRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentNotificationStatusDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PaymentService {
    final Logger log = LoggerFactory.getLogger(PaymentService.class);
    final OrderRepository orderRepository;
    final OrderItemRepository orderItemRepository;
    final PaymentRepository paymentRepository;
    final NotificationRepository notificationRepository;
    final DinningTableRepository tableRepository;
    final WebSocketService webSocketService;

    @Transactional
    public PaymentResponseDTO processPayment(ProcessPaymentRequestDTO request) {
        // Validate input data
        if (request.getOrderId() == null || request.getOrderId() <= 0) {
            throw new IllegalArgumentException("Order ID is required and must be a positive integer");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount is required and must be a positive number");
        }

        if (request.getPaymentMethod() == null || request.getPaymentMethod().isEmpty()) {
            throw new IllegalArgumentException("Payment method is required");
        }

        // Validate payment method
        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid payment method. Valid options are: " +
                    Arrays.toString(PaymentMethod.values()));
        }

        // Check if order exists
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new EntityNotFoundException("Order not found with ID: " + request.getOrderId()));

        // Check order payment status
        if (order.getPaymentStatus() != null && order.getPaymentStatus() != PaymentStatus.UNPAID) {
            throw new IllegalStateException("Order has already been paid or cancelled");
        }

        // Process payment based on method
        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setOrderId(order.getOrderId());
        response.setAmount(request.getAmount());
        response.setPaymentMethod(paymentMethod.name());

        if (paymentMethod == PaymentMethod.CASH) {
            return processCashPaymentInternal(order, request.getAmount());
        } else if (paymentMethod == PaymentMethod.ONLINE) {
            return processOnlinePaymentInternal(order, request.getAmount());
        } else if (paymentMethod == PaymentMethod.CARD) {
            return processCardPaymentInternal(order, request.getAmount());
        } else {
            throw new UnsupportedOperationException("Payment method not supported: " + paymentMethod);
        }
    }

    @Transactional
    public PaymentResponseDTO processCashPaymentInternal(Order order, BigDecimal amount) {
        String transactionId = generateTransactionId();

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setCustomer(order.getCustomer());
        payment.setAmount(amount);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(transactionId);
        payment.setPaymentDate(LocalDateTime.now());

        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        DinningTable table = order.getTables();
        if (table != null) {
            log.info("Before update: Table {} status is {} for order {}",
                    table.getTableNumber(), table.getTableStatus(), order.getOrderId());
            boolean hasUnpaidOrders = hasUnpaidOrdersForTable(table.getTableNumber());
            table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
            tableRepository.saveAndFlush(table);
            log.info("After update: Table {} status updated to {} for order {}",
                    table.getTableNumber(), table.getTableStatus(), order.getOrderId());
        } else {
            log.warn("No table associated with order {}", order.getOrderId());
        }

        // Send PAYMENT_STATUS_UPDATED WebSocket message
        sendPaymentStatusUpdatedMessage(order);

        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setPaymentId(payment.getPaymentId());
        response.setOrderId(order.getOrderId());
        response.setAmount(amount);
        response.setPaymentMethod(PaymentMethod.CASH.name());
        response.setPaymentDate(payment.getPaymentDate().toString());
        response.setStatus(PaymentStatus.PAID.name());
        response.setTransactionId(transactionId);
        response.setMessage("Cash payment processed successfully");

        return response;
    }

    private PaymentResponseDTO processCardPaymentInternal(Order order, BigDecimal amount) {
        String transactionId = generateTransactionId();

        try {
            Thread.sleep(1000);

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(amount);
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PAID);
            payment.setTransactionId(transactionId);
            payment.setPaymentDate(LocalDateTime.now());

            paymentRepository.save(payment);

            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);

            DinningTable table = order.getTables();
            if (table != null) {
                boolean hasUnpaidOrders = hasUnpaidOrdersForTable(table.getTableNumber());
                table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
                tableRepository.save(table);
                log.info("Table {} status updated to {} after card payment for order {}",
                        table.getTableNumber(), table.getTableStatus(), order.getOrderId());
            }

            // Send PAYMENT_STATUS_UPDATED WebSocket message
            sendPaymentStatusUpdatedMessage(order);

            PaymentResponseDTO response = new PaymentResponseDTO();
            response.setPaymentId(payment.getPaymentId());
            response.setOrderId(order.getOrderId());
            response.setAmount(amount);
            response.setPaymentMethod(PaymentMethod.CARD.name());
            response.setPaymentDate(payment.getPaymentDate().toString());
            response.setStatus(PaymentStatus.PAID.name());
            response.setTransactionId(transactionId);
            response.setMessage("Card payment processed successfully");

            return response;
        } catch (Exception e) {
            log.error("Error processing card payment", e);
            throw new PaymentProcessingException("Failed to process card payment: " + e.getMessage());
        }
    }

    private PaymentResponseDTO processOnlinePaymentInternal(Order order, BigDecimal amount) {
        // Create pending payment record
        String transactionId = generateTransactionId();

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setCustomer(order.getCustomer());
        payment.setAmount(amount);
        payment.setPaymentMethod(PaymentMethod.ONLINE);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionId(transactionId);
        payment.setPaymentDate(LocalDateTime.now());

        paymentRepository.save(payment);

        // Generate payment URL for redirection
        String paymentUrl;
        try {
            paymentUrl = createVNPayOrder(amount.intValue(), "Payment for Order: " + order.getOrderId(), null);
        } catch (Exception e) {
            log.error("Error creating VNPay payment", e);
            throw new PaymentProcessingException("Failed to create online payment: " + e.getMessage());
        }

        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setPaymentId(payment.getPaymentId());
        response.setOrderId(order.getOrderId());
        response.setAmount(amount);
        response.setPaymentMethod(PaymentMethod.ONLINE.name());
        response.setPaymentDate(payment.getPaymentDate().toString());
        response.setStatus(PaymentStatus.PENDING.name());
        response.setTransactionId(transactionId);
        response.setPaymentUrl(paymentUrl);
        response.setMessage("Online payment initiated");

        return response;
    }

    private String generateTransactionId() {
        Random rand = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(rand.nextInt(10));
        }
        return sb.toString();
    }

    @Transactional
    public String createVNPayOrder(int total, String orderInfo, String urlReturn) throws Exception {
        if (total <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        // Parse the order ID from orderInfo
        Integer orderId = extractOrderIdFromOrderInfo(orderInfo);

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
        String vnp_IpAddr = "127.0.0.1";
        String vnp_TmnCode = VNPayConfig.vnp_TmnCode;
        String orderType = "order-type";

        // Create a pending payment record in database
        if (orderId != null) {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

            // Check if the order is already paid
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                throw new IllegalStateException("Order is already paid");
            }

            // Check for existing pending payments
            List<Payment> existingPayments = paymentRepository.findByOrderAndStatus(order, PaymentStatus.PENDING);
            if (!existingPayments.isEmpty()) {
                Payment pendingPayment = existingPayments.get(0);
                LocalDateTime paymentDate = pendingPayment.getPaymentDate();
                LocalDateTime expiryTime = paymentDate.plusMinutes(15); // VNPay transactions expire after 15 minutes

                if (LocalDateTime.now().isBefore(expiryTime)) {
                    // Pending payment is still valid
                    log.info("Found valid pending payment for order {}. Using existing transaction ID: {}", orderId, pendingPayment.getTransactionId());
                    throw new IllegalStateException("A pending payment transaction exists for order " + orderId + ". Please wait for it to complete or expire.");
                } else {
                    // Cancel expired pending payment
                    pendingPayment.setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(pendingPayment);
                    log.info("Cancelled expired pending payment for order {} with transaction ID: {}", orderId, pendingPayment.getTransactionId());
                }
            }

            // Create new pending payment
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(BigDecimal.valueOf(total));
            payment.setPaymentMethod(PaymentMethod.ONLINE);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setTransactionId(vnp_TxnRef);
            payment.setPaymentDate(LocalDateTime.now());

            paymentRepository.save(payment);
            log.info("Created new pending payment record with transaction ID: {} for order {}", vnp_TxnRef, orderId);
        }

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(total * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);

        String vnp_OrderInfo = new String(orderInfo.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);

        vnp_Params.put("vnp_OrderType", orderType);
        String locate = "vn";
        vnp_Params.put("vnp_Locale", locate);
        vnp_Params.put("vnp_ReturnUrl", urlReturn != null ? urlReturn : VNPayConfig.vnp_Returnurl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                query.append('&');
                hashData.append('&');
            }
        }
        query.setLength(query.length() - 1); // Remove last &
        hashData.setLength(hashData.length() - 1);

        // Hash data for security
        String vnp_SecureHash = VNPayConfig.hmacSHA512(VNPayConfig.vnp_HashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        return VNPayConfig.vnp_PayUrl + "?" + query;
    }

    private Integer extractOrderIdFromOrderInfo(String orderInfo) {
        try {
            // Assuming order info is in format "Payment for Order: {orderId}"
            if (orderInfo != null && orderInfo.contains("Order:")) {
                String orderIdStr = orderInfo.substring(orderInfo.indexOf("Order:") + 7).trim();
                return Integer.parseInt(orderIdStr);
            }
        } catch (Exception e) {
            log.error("Error extracting order ID from order info: {}", e.getMessage());
        }
        return null;
    }

    @Transactional
    public Map<String, Object> orderReturn(Map<String, String> queryParams) throws Exception {
        Map<String, Object> result = new HashMap<>();
        result.put("status", -1);
        result.put("transactionStatus", "FAILED");
        result.put("responseCode", null);
        result.put("message", "Giao dịch thất bại!");

        try {
            Map<String, String> fields = new HashMap<>(queryParams);
            String vnp_SecureHash = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            List<String> fieldNames = new ArrayList<>(fields.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            for (String fieldName : fieldNames) {
                String fieldValue = fields.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append("=").append(fieldValue);
                    if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                        hashData.append("&");
                    }
                }
            }

            String calculatedHash = VNPayConfig.hmacSHA512(VNPayConfig.vnp_HashSecret, hashData.toString());
            if (calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
                String txnRef = queryParams.get("vnp_TxnRef");
                String amount = queryParams.get("vnp_Amount");
                String responseCode = queryParams.get("vnp_ResponseCode");

                Payment payment = paymentRepository.findByTransactionId(txnRef);
                if (payment == null) {
                    log.error("No payment found for transaction ID: {}", txnRef);
                    return result;
                }

                boolean isSuccessful = payment.getAmount().multiply(BigDecimal.valueOf(100))
                        .compareTo(new BigDecimal(amount)) == 0 &&
                        txnRef.equals(payment.getTransactionId()) &&
                        "00".equals(responseCode);

                payment.setStatus(isSuccessful ? PaymentStatus.PAID : PaymentStatus.CANCELLED);
                paymentRepository.save(payment);

                if (isSuccessful && payment.getOrder() != null) {
                    Order order = payment.getOrder();
                    order.setPaymentStatus(PaymentStatus.PAID);
                    orderRepository.save(order);

                    DinningTable table = order.getTables();
                    if (table != null) {
                        boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                                table.getTableNumber(), PaymentStatus.UNPAID);
                        table.setTableStatus(hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE);
                        tableRepository.save(table);
                        log.info("Table {} status updated to {} after online payment for order {}",
                                table.getTableNumber(), table.getTableStatus(), order.getOrderId());
                    }

                    sendPaymentStatusUpdatedMessage(order);
                } else {
                    log.info("VNPay transaction failed for order {}: responseCode={}", payment.getOrder().getOrderId(), responseCode);
                }

                result.put("status", isSuccessful ? 1 : 0);
                result.put("transactionStatus", isSuccessful ? "SUCCESS" : "FAILED");
                result.put("responseCode", responseCode);
                result.put("message", isSuccessful ? "Thanh toán thành công!" : "Giao dịch thất bại!");
            } else {
                log.error("Signature verification FAILED for transaction");
            }

            return result;
        } catch (Exception e) {
            log.error("Comprehensive Error in VNPay Response Processing", e);
            return result;
        }
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
                .customPayload(message)
                .build();

        try {
            log.info("Sending WebSocket message: {}", new ObjectMapper().writeValueAsString(notification));
            webSocketService.sendNotificationToActiveStaff(notification);
            log.info("Sent PAYMENT_STATUS_UPDATED for orderId: {}, tableNumber: {}, tableStatus: {}",
                    order.getOrderId(),
                    table != null ? table.getTableNumber() : "N/A",
                    table != null ? table.getTableStatus().name() : "N/A");
        } catch (Exception e) {
            log.error("Failed to send PAYMENT_STATUS_UPDATED for orderId: {}: {}", order.getOrderId(), e.getMessage(), e);
        }
    }

    private boolean hasUnpaidOrdersForTable(Integer tableNumber) {
        return orderRepository.existsByTablesTableNumberAndPaymentStatus(tableNumber, PaymentStatus.UNPAID);
    }

    public OrderPaymentDetailsDTO getOrderPaymentDetails(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

        List<PaymentItemDTO> paymentItems = orderItems.stream()
                .map(item -> {
                    PaymentItemDTO dto = new PaymentItemDTO();
                    dto.setDishId(item.getDish().getDishId());
                    dto.setDishName(item.getDish().getName());
                    dto.setPrice(item.getDish().getPrice());
                    dto.setQuantity(item.getQuantity());
                    dto.setNotes(item.getNotes());
                    return dto;
                })
                .collect(Collectors.toList());

        OrderPaymentDetailsDTO paymentDetails = new OrderPaymentDetailsDTO();
        paymentDetails.setOrderId(order.getOrderId());
        paymentDetails.setTableId(order.getTables().getTableNumber());
        paymentDetails.setOrderDate(order.getOrderDate());
        paymentDetails.setPaymentStatus(order.getPaymentStatus());
        paymentDetails.setItems(paymentItems);
        paymentDetails.setDiscount(order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO);
        paymentDetails.setTotalAmount(order.getTotalAmount());

        // Add transaction status
        Optional<Payment> latestPayment = paymentRepository.findTopByOrderAndStatusNotOrderByPaymentDateDesc(order, PaymentStatus.CANCELLED);
        if (latestPayment.isPresent()) {
            paymentDetails.setTransactionStatus(latestPayment.get().getStatus().toString());
        }

        return paymentDetails;
    }

    @Transactional
    public void processCashPayment(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        // Verify the order is in UNPAID status
        if (order.getPaymentStatus() != PaymentStatus.UNPAID) {
            throw new IllegalStateException("Cannot process payment for order that is not in UNPAID status");
        }

        // Check if payment record already exists for the order
        Payment payment = paymentRepository.findByOrder_OrderId(orderId);

        if (payment == null) {
            // Create new payment record for cash payment
            payment = new Payment();
            payment.setOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(order.getTotalAmount());
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setPaymentDate(LocalDateTime.now());
            // Start with UNPAID status - this is the key change
            payment.setStatus(PaymentStatus.UNPAID);
        } else {
            // Update existing payment record if needed
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setPaymentDate(LocalDateTime.now());
            // Ensure status is UNPAID
            payment.setStatus(PaymentStatus.UNPAID);
        }

        paymentRepository.save(payment);

        // Keep order status as UNPAID at this stage
        // The status will be updated to PAID when the payment is confirmed

        log.info("Cash payment request processed successfully for order ID: {}", orderId);
    }

    public PaymentResponseDTO getPaymentById(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found with ID: " + paymentId));

        PaymentResponseDTO responseDTO = new PaymentResponseDTO();
        responseDTO.setPaymentId(payment.getPaymentId());
        responseDTO.setOrderId(payment.getOrder().getOrderId());
        responseDTO.setAmount(payment.getAmount());
        responseDTO.setPaymentMethod(payment.getPaymentMethod().name());
        responseDTO.setPaymentDate(payment.getPaymentDate().toString());
        responseDTO.setStatus(payment.getStatus().name());
        responseDTO.setTransactionId(payment.getTransactionId());

        return responseDTO;
    }

    public PaymentNotificationStatusDTO checkPaymentNotificationStatus(Integer orderId) {
        // Check if there's a payment notification for this order
        boolean hasPaymentNotification = notificationRepository
                .existsByTypeAndContentContaining(
                        NotificationType.PAYMENT_REQUEST,
                        "order #" + orderId
                );

        PaymentNotificationStatusDTO statusDTO = new PaymentNotificationStatusDTO();
        statusDTO.setOrderId(orderId);
        statusDTO.setPaymentNotificationReceived(hasPaymentNotification);

        return statusDTO;
    }

    public static class PaymentProcessingException extends RuntimeException {
        public PaymentProcessingException(String message) {
            super(message);
        }
    }
}