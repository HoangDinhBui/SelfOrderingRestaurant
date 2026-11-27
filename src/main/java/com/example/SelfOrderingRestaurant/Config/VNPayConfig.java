package com.example.SelfOrderingRestaurant.Config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Merchant settings come from the environment (VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAY_URL,
 * VNPAY_RETURN_URL, see application.yml) so a new or renewed terminal needs no code change and the
 * secret stays out of git.
 */
@Component
public class VNPayConfig {
    static Logger log = org.slf4j.LoggerFactory.getLogger(VNPayConfig.class);
    public static String vnp_TmnCode = "";
    public static String vnp_HashSecret = "";
    public static String vnp_PayUrl = "";
    public static String vnp_Returnurl = "";

    public VNPayConfig(@Value("${vnpay.tmn-code:}") String tmnCode,
                       @Value("${vnpay.hash-secret:}") String hashSecret,
                       @Value("${vnpay.pay-url:}") String payUrl,
                       @Value("${vnpay.return-url:}") String returnUrl) {
        vnp_TmnCode = tmnCode.trim();
        vnp_HashSecret = hashSecret.trim();
        vnp_PayUrl = payUrl.trim();
        vnp_Returnurl = returnUrl.trim();
        if (vnp_TmnCode.isEmpty() || vnp_HashSecret.isEmpty()) {
            log.warn("VNPay is not configured: set VNPAY_TMN_CODE and VNPAY_HASH_SECRET to enable online payment.");
        }
    }

    //Util for VNPAY
    public static String hashAllFields(Map<String, String> fields) throws Exception {
        List<String> fieldNames = new ArrayList(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder sb = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                sb.append(fieldName).append("=").append(fieldValue).append("&");
            }
        }
        if (sb.length() > 0) sb.setLength(sb.length() - 1);

        return hmacSHA512(vnp_HashSecret, sb.toString());
    }

    public static String hmacSHA512(final String key, final String data) {
        try {

            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes();
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();

        } catch (Exception ex) {
            return "";
        }
    }

    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}