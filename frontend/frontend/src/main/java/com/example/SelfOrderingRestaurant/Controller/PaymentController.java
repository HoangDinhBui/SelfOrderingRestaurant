package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.PaymentVNPayRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.ProcessPaymentRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentVNPayResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Repository.PaymentRepository;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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

            List<Payment> existingPayments = paymentRepository.findByOrderAndStatus(order, PaymentStatus.PENDING);
            if (!existingPayments.isEmpty()) {
                Payment pendingPayment = existingPayments.get(0);
                LocalDateTime paymentDate = pendingPayment.getPaymentDate();
                LocalDateTime expiryTime = paymentDate.plusMinutes(15);

                if (LocalDateTime.now().isBefore(expiryTime)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                            "success", false,
                            "message", "A pending payment transaction exists for order " + request.getOrderId() + ". Please wait for it to complete or expire."
                    ));
                } else {
                    pendingPayment.setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(pendingPayment);
                    log.info("Cancelled expired pending payment for order {} with transaction ID: {}",
                            request.getOrderId(), pendingPayment.getTransactionId());
                }
            }

            PaymentMethod method;
            try {
                method = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
            } catch (IllegalArgumentException e) {
                method = PaymentMethod.CASH;
            }

            String txnRef = generateTransactionId();

            boolean confirmPayment = request.isConfirmPayment();

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(order.getTotalAmount());
            payment.setPaymentMethod(method);
            payment.setStatus(confirmPayment ? PaymentStatus.PAID : PaymentStatus.UNPAID);
            payment.setTransactionId(txnRef);
            payment.setPaymentDate(LocalDateTime.now());

            paymentRepository.save(payment);

            if (confirmPayment) {
                order.setPaymentStatus(PaymentStatus.PAID);
                orderRepository.save(order);

                // Update table status to AVAILABLE
                DinningTable table = order.getTables();
                if (table != null) {
                    table.setTableStatus(TableStatus.AVAILABLE);
                    tableRepository.save(table);
                    log.info("Table {} status updated to AVAILABLE after payment for order {}",
                            table.getTableNumber(), order.getOrderId());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", confirmPayment ? "Payment processed successfully" : "Payment initiated, awaiting confirmation");
            response.put("transactionId", txnRef);
            response.put("paymentStatus", payment.getStatus().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing payment: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @Transactional
    public void confirmPayment(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        Payment payment = paymentRepository.findTopByOrderAndStatusOrderByPaymentDateDesc(order, PaymentStatus.UNPAID)
                .orElseThrow(() -> new IllegalArgumentException("No pending payment found for order ID: " + orderId));

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order);

        DinningTable table = order.getTables();
        if (table != null) {
            table.setTableStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
            log.info("Table {} status updated to AVAILABLE after payment for order {}",
                    table.getTableNumber(), order.getOrderId());
        }

        log.info("Payment confirmed successfully for order ID: {}", orderId);
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> request) {
        try {
            Integer orderId = (Integer) request.get("orderId");

            if (orderId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Order ID cannot be null"
                ));
            }

            confirmPayment(orderId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment confirmed successfully");

            Optional<Payment> paymentOptional = paymentRepository.findTopByOrder_OrderIdAndStatusOrderByPaymentDateDesc(orderId, PaymentStatus.PAID);

            Payment planning = paymentOptional.orElse(null);

            if (planning != null) {
                response.put("transactionId", planning.getTransactionId());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error confirming payment: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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