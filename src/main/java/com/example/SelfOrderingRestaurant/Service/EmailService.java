package com.example.SelfOrderingRestaurant.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends mail over HTTPS APIs, since Render's free tier blocks outbound SMTP.
 * Brevo (BREVO_API_KEY + BREVO_SENDER_EMAIL, a sender verified in Brevo) reaches any address and is used
 * when configured; otherwise Resend (RESEND_API_KEY), which without a verified domain only delivers to the
 * Resend account owner's address.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String resendFromEmail;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:Self Ordering Restaurant}")
    private String brevoSenderName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private RestTemplate restTemplate = new RestTemplate();

    private void sendEmail(String toEmail, String subject, String content) {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendEmailViaBrevo(toEmail, subject, content);
        } else if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendEmailViaResend(toEmail, subject, content);
        } else {
            throw new IllegalStateException("No email provider configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL (or RESEND_API_KEY)");
        }
    }

    private void sendEmailViaBrevo(String toEmail, String subject, String content) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of("email", brevoSenderEmail, "name", brevoSenderName));
            body.put("to", List.of(Map.of("email", toEmail)));
            body.put("subject", subject);
            body.put("textContent", content);

            restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            System.err.println("Failed to send email via Brevo: " + e.getMessage());
            throw new RuntimeException("Failed to send email via Brevo", e);
        }
    }

    private void sendEmailViaResend(String toEmail, String subject, String content) {
        try {
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
        sendEmail(toEmail, subject, content);
    }

    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        String subject = "Account Registration OTP";
        String content = "Welcome to our Restaurant!\n\n" +
                "To complete your registration, please verify your email address.\n" +
                "Your OTP is: " + otp + "\n\n" +
                "This OTP will expire in 10 minutes.\n" +
                "If you did not initiate this request, please ignore this email.";
        sendEmail(toEmail, subject, content);
    }
}