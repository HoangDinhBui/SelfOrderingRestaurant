package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Config.VNPayConfig;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "vnpay.tmn-code=TESTCODE",
        "vnpay.hash-secret=test-secret",
        "vnpay.pay-url=https://pay.example.test/paymentv2/vpcpay.html",
        "vnpay.return-url=https://api.example.test/api/payment/vnpay_payment"
})
@Transactional
public class VNPayPaymentUrlIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DinningTableRepository tableRepository;

    private Order unpaidOrder() {
        DinningTable table = new DinningTable();
        table.setTableNumber(9);
        table.setTableStatus(TableStatus.OCCUPIED);
        table.setCapacity(4);
        tableRepository.save(table);

        Order order = new Order();
        order.setTables(table);
        order.setOrderDate(new Date());
        order.setTotalAmount(BigDecimal.valueOf(80000));
        order.setStatus(OrderStatus.COMPLETED);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        return orderRepository.save(order);
    }

    private static Map<String, String> params(String url) {
        Map<String, String> params = new LinkedHashMap<>();
        for (String pair : URI.create(url).getRawQuery().split("&")) {
            String[] kv = pair.split("=", 2);
            params.put(kv[0], URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
        }
        return params;
    }

    @Test
    public void paymentUrlUsesConfiguredTerminalAndHost() throws Exception {
        Order order = unpaidOrder();

        String url = paymentService.createVNPayOrder(0, "Payment for Order: " + order.getOrderId(), null);

        assertTrue(url.startsWith("https://pay.example.test/paymentv2/vpcpay.html?"), url);
        Map<String, String> params = params(url);
        assertEquals("TESTCODE", params.get("vnp_TmnCode"));
        assertEquals("8000000", params.get("vnp_Amount"));
        assertEquals("https://api.example.test/api/payment/vnpay_payment", params.get("vnp_ReturnUrl"));
    }

    @Test
    public void orderInfoAndTypeFollowVNPayFormat() throws Exception {
        Order order = unpaidOrder();

        Map<String, String> params = params(paymentService.createVNPayOrder(0, "Payment for Order: " + order.getOrderId(), null));

        // VNPay chỉ nhận chữ không dấu, không ký tự đặc biệt; mã loại hàng phải là mã hợp lệ
        assertEquals("Thanh toan don hang " + order.getOrderId(), params.get("vnp_OrderInfo"));
        assertEquals("other", params.get("vnp_OrderType"));
    }

    @Test
    public void blankReturnUrlFallsBackToConfiguredOne() throws Exception {
        Order order = unpaidOrder();

        Map<String, String> params = params(paymentService.createVNPayOrder(0, "Payment for Order: " + order.getOrderId(), "  "));

        assertEquals("https://api.example.test/api/payment/vnpay_payment", params.get("vnp_ReturnUrl"));
    }

    @Test
    public void signatureIsHmacOfSortedEncodedParams() throws Exception {
        Order order = unpaidOrder();

        String url = paymentService.createVNPayOrder(0, "Payment for Order: " + order.getOrderId(), null);

        String query = URI.create(url).getRawQuery();
        int hashAt = query.indexOf("&vnp_SecureHash=");
        String signed = query.substring(0, hashAt);
        String hash = query.substring(hashAt + "&vnp_SecureHash=".length());
        assertEquals(VNPayConfig.hmacSHA512("test-secret", signed), hash);
    }

    @Test
    public void missingSecretGivesClearError() {
        Order order = unpaidOrder();
        String secret = VNPayConfig.vnp_HashSecret;
        VNPayConfig.vnp_HashSecret = "";
        try {
            Exception e = assertThrows(IllegalStateException.class,
                    () -> paymentService.createVNPayOrder(0, "Payment for Order: " + order.getOrderId(), null));
            assertTrue(e.getMessage().contains("VNPAY_HASH_SECRET"), e.getMessage());
        } finally {
            VNPayConfig.vnp_HashSecret = secret;
        }
    }
}
