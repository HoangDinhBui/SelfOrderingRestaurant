package com.example.SelfOrderingRestaurant.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset OTP");

            // String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            message.setText(
                    "You have requested to reset your password.\n\n" +
                            "Your OTP is: " + otp + "\n\n" +
                            "Please use this OTP to reset your password.\n" +
                            "This OTP will expire in 10 minutes.\n" +
                            "If you did not request a password reset, please ignore this email."
            );

            javaMailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
}