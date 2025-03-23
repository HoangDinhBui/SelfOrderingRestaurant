package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.PaymentRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentResponseDTO;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/vnpay")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequestDTO request, HttpServletRequest httpRequest) {
        try {
//            log.info("🔹 Creating VNPay Payment: {}", request);

            // Make sure orderInfo contains order ID for reference
            if (!request.getOrderInfo().contains("Order:")) {
                request.setOrderInfo("Payment for Order: " + request.getOrderId());
            }

            String paymentUrl = paymentService.createOrder(request.getTotal(), request.getOrderInfo(), request.getReturnUrl());

            return ResponseEntity.ok(PaymentResponseDTO.builder()
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

            // Parse query string without decoding to preserve encoded values
            Map<String, String> params = parseQueryString(queryString);
            log.info("🔹 Parsed params: {}", params);

            int result = paymentService.orderReturn(params);

            if (result == 1) {
                return ResponseEntity.ok("Thanh toán thành công!");
            } else if (result == 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Giao dịch thất bại!");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai chữ ký hoặc giao dịch bị thay đổi!");
            }
        } catch (Exception e) {
            log.error("Lỗi xử lý VNPay: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi xử lý VNPay: " + e.getMessage());
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
                // DO NOT decode values - this is critical
                result.put(key, value);
            }
        }
        return result;
    }
}