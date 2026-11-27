package com.example.SelfOrderingRestaurant.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

class EmailServiceTest {

    private EmailService emailService;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(emailService, "resendApiKey", "");
        ReflectionTestUtils.setField(emailService, "resendFromEmail", "onboarding@resend.dev");
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "");
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", "");
        ReflectionTestUtils.setField(emailService, "senderName", "Self Ordering Restaurant");
        ReflectionTestUtils.setField(emailService, "mailjetApiKey", "");
        ReflectionTestUtils.setField(emailService, "mailjetSecretKey", "");
        ReflectionTestUtils.setField(emailService, "mailjetSenderEmail", "");
    }

    @Test
    void sendsThroughMailjetWhenItsKeysAreSet() {
        ReflectionTestUtils.setField(emailService, "mailjetApiKey", "mj-public");
        ReflectionTestUtils.setField(emailService, "mailjetSecretKey", "mj-secret");
        ReflectionTestUtils.setField(emailService, "mailjetSenderEmail", "owner@gmail.com");
        String basic = "Basic " + java.util.Base64.getEncoder()
                .encodeToString("mj-public:mj-secret".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        server.expect(requestTo("https://api.mailjet.com/v3.1/send"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", basic))
                .andExpect(jsonPath("$.Messages[0].From.Email").value("owner@gmail.com"))
                .andExpect(jsonPath("$.Messages[0].From.Name").value("Self Ordering Restaurant"))
                .andExpect(jsonPath("$.Messages[0].To[0].Email").value("guest@example.com"))
                .andExpect(jsonPath("$.Messages[0].Subject").value("Password Reset OTP"))
                .andExpect(jsonPath("$.Messages[0].TextPart").value(org.hamcrest.Matchers.containsString("654321")))
                .andRespond(withSuccess("{\"Messages\":[{\"Status\":\"success\"}]}", MediaType.APPLICATION_JSON));

        emailService.sendPasswordResetEmail("guest@example.com", "654321");

        server.verify();
    }

    @Test
    void mailjetErrorIsReported() {
        ReflectionTestUtils.setField(emailService, "mailjetApiKey", "mj-public");
        ReflectionTestUtils.setField(emailService, "mailjetSecretKey", "wrong");
        ReflectionTestUtils.setField(emailService, "mailjetSenderEmail", "owner@gmail.com");
        server.expect(requestTo("https://api.mailjet.com/v3.1/send")).andRespond(withStatus(UNAUTHORIZED));

        assertThrows(RuntimeException.class, () -> emailService.sendPasswordResetEmail("guest@example.com", "654321"));
    }

    @Test
    void missingProviderMessageMentionsMailjet() {
        RuntimeException e = assertThrows(RuntimeException.class,
                () -> emailService.sendRegistrationOtpEmail("guest@example.com", "111222"));
        assertTrue(e.getMessage().contains("MAILJET_API_KEY"), e.getMessage());
    }

    @Test
    void sendsThroughBrevoWhenItsKeyIsSet() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "brevo-key");
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", "owner@gmail.com");
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "brevo-key"))
                .andExpect(jsonPath("$.sender.email").value("owner@gmail.com"))
                .andExpect(jsonPath("$.sender.name").value("Self Ordering Restaurant"))
                .andExpect(jsonPath("$.to[0].email").value("guest@example.com"))
                .andExpect(jsonPath("$.subject").value("Password Reset OTP"))
                .andExpect(jsonPath("$.textContent").value(org.hamcrest.Matchers.containsString("654321")))
                .andRespond(withSuccess("{\"messageId\":\"x\"}", MediaType.APPLICATION_JSON));

        emailService.sendPasswordResetEmail("guest@example.com", "654321");

        server.verify();
    }

    @Test
    void fallsBackToResendWhenOnlyResendIsConfigured() {
        ReflectionTestUtils.setField(emailService, "resendApiKey", "re_key");
        server.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(header("Authorization", "Bearer re_key"))
                .andExpect(jsonPath("$.to[0]").value("guest@example.com"))
                .andRespond(withSuccess("{\"id\":\"x\"}", MediaType.APPLICATION_JSON));

        emailService.sendRegistrationOtpEmail("guest@example.com", "111222");

        server.verify();
    }

    @Test
    void failsWithoutCallingOutWhenNoProviderIsConfigured() {
        RuntimeException e = assertThrows(RuntimeException.class,
                () -> emailService.sendPasswordResetEmail("guest@example.com", "654321"));
        assertTrue(e.getMessage().contains("BREVO_API_KEY"), e.getMessage());
        server.verify();
    }

    @Test
    void brevoErrorIsReported() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "bad-key");
        ReflectionTestUtils.setField(emailService, "brevoSenderEmail", "owner@gmail.com");
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email")).andRespond(withStatus(UNAUTHORIZED));

        assertThrows(RuntimeException.class, () -> emailService.sendPasswordResetEmail("guest@example.com", "654321"));
    }
}
