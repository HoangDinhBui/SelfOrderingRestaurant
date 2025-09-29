package com.example.SelfOrderingRestaurant.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.apache.commons.net.util.SubnetUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.net.UnknownHostException;

@RestController
@RequestMapping("/api/captive")
public class CaptivePortalController {

    private static final Logger logger = LoggerFactory.getLogger(CaptivePortalController.class);

    @Value("${restaurant.network.cidr}")
    private String restaurantCidr;

    // Endpoint kiểm tra IP hiện tại của client
    @GetMapping("/check-ip")
    public ResponseEntity<?> checkIp(HttpServletRequest request,
                                     @RequestParam(value = "tableNumber", required = false) String tableNumber,
                                     HttpSession session) {
        try {
            // Kiểm tra xem người dùng đã đăng nhập chưa
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                logger.info("Người dùng đã đăng nhập, bỏ qua kiểm tra IP.");
                String redirectUrl = "/table/" + (tableNumber != null ? tableNumber : "1");
                return ResponseEntity.ok().body(
                        "{\"redirect\": \"" + redirectUrl + "\", \"ip\": \"\", \"tableNumber\": \"" + (tableNumber != null ? tableNumber : "1") + "\"}"
                );
            }

            String clientIp = getClientIp(request);
            logger.info("Kiểm tra IP: {} (X-Forwarded-For: {}, RemoteAddr: {}, Table: {})",
                    clientIp, request.getHeader("X-Forwarded-For"), request.getRemoteAddr(), tableNumber);

            // Kiểm tra trạng thái kết nối từ session
            Boolean isConnected = (Boolean) session.getAttribute("isConnected");
            if (isConnected != null && isConnected) {
                String savedTableNumber = (String) session.getAttribute("tableNumber");
                String redirectUrl = "/table/" + (savedTableNumber != null ? savedTableNumber : "1");
                logger.info("Người dùng đã kết nối, chuyển hướng đến: {}", redirectUrl);
                return ResponseEntity.ok().body(
                        "{\"redirect\": \"" + redirectUrl + "\", \"ip\": \"" + clientIp + "\", \"tableNumber\": \"" + (savedTableNumber != null ? savedTableNumber : "1") + "\"}"
                );
            }

            boolean isIPv4 = isIPv4(clientIp);
            boolean isValidIp = false;

            if (isIPv4) {
                try {
                    SubnetUtils utils = new SubnetUtils(restaurantCidr);
                    isValidIp = utils.getInfo().isInRange(clientIp);
                } catch (IllegalArgumentException e) {
                    logger.error("Lỗi khi phân tích CIDR {}: {}", restaurantCidr, e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("{\"error\": \"Cấu hình CIDR không hợp lệ: " + e.getMessage() + "\"}");
                }
            } else {
                logger.warn("IP {} là IPv6, không kiểm tra với dải IPv4 {}", clientIp, restaurantCidr);
                isValidIp = false;
            }

            String redirectUrl = isValidIp ? "/table/" + (tableNumber != null ? tableNumber : "1") : "/captive-portal?tableNumber=" + (tableNumber != null ? tableNumber : "1");
            logger.info("IP {} {} thuộc dải {}, redirect: {}", clientIp, isValidIp ? "có" : "không", restaurantCidr, redirectUrl);
            return ResponseEntity.ok().body(
                    "{\"redirect\": \"" + redirectUrl + "\", \"ip\": \"" + clientIp + "\", \"tableNumber\": \"" + (tableNumber != null ? tableNumber : "1") + "\"}"
            );
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra IP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Lỗi server khi kiểm tra IP: " + e.getMessage() + "\"}");
        }
    }

    // Xử lý yêu cầu kết nối mạng
    @PostMapping("/connect")
    public ResponseEntity<?> connectToNetwork(HttpServletRequest request,
                                              @RequestParam(value = "tableNumber", required = false) String tableNumber,
                                              HttpSession session) {
        try {
            String clientIp = getClientIp(request);
            logger.info("Yêu cầu kết nối mạng từ IP: {} (Table: {})", clientIp, tableNumber);

            // Lưu trạng thái kết nối vào session
            session.setAttribute("isConnected", true);
            session.setAttribute("tableNumber", tableNumber != null ? tableNumber : "1");

            String redirectUrl = "/table/" + (tableNumber != null ? tableNumber : "1");
            logger.info("Kết nối mạng thành công, chuyển hướng đến: {}", redirectUrl);
            return ResponseEntity.ok().body(
                    "{\"status\": \"connected\", \"redirect\": \"" + redirectUrl + "\", \"ip\": \"" + clientIp + "\", \"tableNumber\": \"" + (tableNumber != null ? tableNumber : "1") + "\"}"
            );
        } catch (Exception e) {
            logger.error("Lỗi khi kết nối mạng: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Lỗi server khi kết nối mạng: " + e.getMessage() + "\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getHeader("X-Forwarded-For");
        if (remoteAddr != null && !remoteAddr.isEmpty()) {
            return remoteAddr.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        if (ip == null || ip.isEmpty() || "0:0:0:0:0:0:0:1".equals(ip)) {
            logger.warn("IP localhost được phát hiện, giả lập IP trong dải mạng cho phát triển");
            return "172.20.10.9";
        }
        return ip;
    }

    private boolean isIPv4(String ip) {
        try {
            InetAddress inetAddress = InetAddress.getByName(ip);
            return inetAddress.getAddress().length == 4;
        } catch (UnknownHostException e) {
            logger.error("Không thể phân tích IP {}: {}", ip, e.getMessage());
            return false;
        }
    }
}