package com.example.SelfOrderingRestaurant.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String resendFromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private void sendEmailViaResend(String toEmail, String subject, String content) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", resendFromEmail);
            body.put("to", new String[]{toEmail});
            body.put("subject", subject);
            body.put("text", content);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send email via Resend: " + e.getMessage());
            throw new RuntimeException("Failed to send email via Resend", e);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String otp) {
        String subject = "Password Reset OTP";
        String content = "You have requested to reset your password.\n\n" +
                "Your OTP is: " + otp + "\n\n" +
                "Please use this OTP to reset your password.\n" +
                "This OTP will expire in 10 minutes.\n" +
                "If you did not request a password reset, please ignore this email.";
        sendEmailViaResend(toEmail, subject, content);
    }

    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        String subject = "Account Registration OTP";
        String content = "Welcome to our Restaurant!\n\n" +
                "To complete your registration, please verify your email address.\n" +
                "Your OTP is: " + otp + "\n\n" +
                "This OTP will expire in 10 minutes.\n" +
                "If you did not initiate this request, please ignore this email.";
        sendEmailViaResend(toEmail, subject, content);
    }
}