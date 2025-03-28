package com.example.SelfOrderingRestaurant;

import java.security.SecureRandom;
import java.util.Base64;

public class JwtSecretKeyGenerator {
    public static String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[64]; // 512 bits
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static void main(String[] args) {
        String secretKey = generateSecretKey();
        System.out.println("Generated Secret Key: " + secretKey);
    }
}
