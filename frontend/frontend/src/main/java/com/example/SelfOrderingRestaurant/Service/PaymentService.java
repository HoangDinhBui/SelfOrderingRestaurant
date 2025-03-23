package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Config.VNPayConfig;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PaymentService {
    final Logger log = LoggerFactory.getLogger(PaymentService.class);
    final OrderRepository orderRepository;
    final PaymentRepository paymentRepository;

    @Transactional
    public String createOrder(int total, String orderInfo, String urlReturn) throws Exception {
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

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setCustomer(order.getCustomer());
            payment.setAmount(order.getTotalAmount());
            payment.setPaymentMethod(PaymentMethod.ONLINE);
            payment.setStatus(PaymentStatus.UNPAID);
            payment.setTransactionId(vnp_TxnRef);
            payment.setPaymentDate(LocalDateTime.now());

            paymentRepository.save(payment);

            log.info("Created pending payment record with transaction ID: {}", vnp_TxnRef);
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
        vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_Returnurl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator itr = fieldNames.iterator();
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
    public int orderReturn(Map<String, String> queryParams) throws Exception {
        try {
            Map<String, String> fields = new HashMap<>(queryParams);

            // Remove hash from map before recalculating
            String vnp_SecureHash = fields.remove("vnp_SecureHash");
            fields.remove("vnp_SecureHashType");

            // Recalculate hash to compare - DO NOT decode vnp_OrderInfo
            String signValue = VNPayConfig.hashAllFields(fields);
//            log.info("Fields to hash: {}", fields);
//            log.info("Generated Hash: {}", signValue);
//            log.info("Received Hash: {}", vnp_SecureHash);

            if (signValue.equalsIgnoreCase(vnp_SecureHash)) {
                String txnRef = queryParams.get("vnp_TxnRef");
                String transactionStatus = queryParams.get("vnp_TransactionStatus");

                // Update payment status in database
                Payment payment = paymentRepository.findByTransactionId(txnRef);
                if (payment != null) {
                    boolean isSuccessful = "00".equals(transactionStatus);

                    // Update payment status
                    payment.setStatus(isSuccessful ? PaymentStatus.PAID : PaymentStatus.UNPAID);
                    paymentRepository.save(payment);

                    // If payment is successful, update order payment status too
                    if (isSuccessful && payment.getOrder() != null) {
                        Order order = payment.getOrder();
                        order.setPaymentStatus(PaymentStatus.PAID);
                        orderRepository.save(order);
                        log.info("Updated order {} payment status to COMPLETED", order.getOrderId());
                    }

                    log.info("Updated payment status for transaction {}: {}", txnRef,
                            isSuccessful ? "COMPLETED" : "FAILED");
                } else {
                    log.warn("Payment record not found for transaction ID: {}", txnRef);
                }

                return "00".equals(transactionStatus) ? 1 : 0;
            }
            return -1;
        } catch (Exception e) {
            log.error("Error processing VNPay response: ", e);
            return -1;
        }
    }
}