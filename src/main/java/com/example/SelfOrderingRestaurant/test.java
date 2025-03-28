package com.example.SelfOrderingRestaurant;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class test {
    public static void main(String[] args) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        String rawPassword = "123456789"; // Nhập mật khẩu cần kiểm tra
        String hashedPassword = "$2a$12$44zMyBq0p1XegWFETbctbO2QNbOHNYasB4l3Zc1Pbkh57H9Y9mMrm"; // Mật khẩu đã băm

        boolean isMatch = passwordEncoder.matches(rawPassword, hashedPassword);
        System.out.println("Mật khẩu khớp: " + isMatch);
    }
}
