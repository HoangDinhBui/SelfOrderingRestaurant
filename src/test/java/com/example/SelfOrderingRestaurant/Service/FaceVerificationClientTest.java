package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class FaceVerificationClientTest {

    private static final String URL = "http://face/verify";
    private RestTemplate restTemplate;
    private MockRestServiceServer server;
    private FaceVerificationClient client;
    @TempDir
    Path tmp;
    private String refPath;

    @BeforeEach
    void setUp() throws Exception {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new FaceVerificationClient(restTemplate, URL);
        Path ref = tmp.resolve("ref.jpg");
        Files.write(ref, new byte[]{1, 2, 3});
        refPath = ref.toString();
    }

    @Test
    void verify_verified() {
        server.expect(requestTo(URL)).andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"verified\":true,\"distance\":0.4}", MediaType.APPLICATION_JSON));
        FaceVerificationClient.VerifyResult r = client.verify(new byte[]{9}, refPath);
        assertTrue(r.verified());
        assertFalse(r.spoof());
        assertFalse(r.noFace());
    }

    @Test
    void verify_spoofAndNoFaceFlags() {
        server.expect(requestTo(URL))
                .andRespond(withSuccess("{\"verified\":false,\"spoof\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, refPath).spoof());
        server.reset();
        server.expect(requestTo(URL))
                .andRespond(withSuccess("{\"verified\":false,\"no_face\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, refPath).noFace());
    }

    @Test
    void verify_unreadableImage_isNoFaceNotOutage() {
        // face service answers 400 "Invalid uploaded image" for a corrupt capture: the user should retry
        server.expect(requestTo(URL)).andRespond(withBadRequest()
                .body("{\"error\":\"Invalid uploaded image\"}").contentType(MediaType.APPLICATION_JSON));
        FaceVerificationClient.VerifyResult r = client.verify(new byte[]{9}, refPath);
        assertTrue(r.noFace());
        assertFalse(r.verified());
    }

    @Test
    void verify_serviceError_throwsUnavailable() {
        server.expect(requestTo(URL)).andRespond(withServerError());
        AttendanceException ex = assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, refPath));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, ex.getError());
    }

    @Test
    void verify_noReference_throwsNoReferenceFace() {
        assertEquals(AttendanceError.NO_REFERENCE_FACE,
                assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, null)).getError());
        assertEquals(AttendanceError.NO_REFERENCE_FACE,
                assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, tmp.resolve("missing.jpg").toString())).getError());
    }

    @Test
    void verify_referenceUrlFails_throwsUnavailable() {
        server.expect(requestTo("http://cdn/ref.jpg")).andRespond(withServerError());
        AttendanceException ex = assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, "http://cdn/ref.jpg"));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, ex.getError());
    }

    @Test
    void verify_referenceUrl_downloadsThenVerifies() {
        server.expect(requestTo("http://cdn/ref.jpg")).andRespond(withSuccess(new byte[]{1}, MediaType.IMAGE_JPEG));
        server.expect(requestTo(URL)).andRespond(withSuccess("{\"verified\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, "http://cdn/ref.jpg").verified());
        server.verify();
    }
}
