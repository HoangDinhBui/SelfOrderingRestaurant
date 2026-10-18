package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;

/** Gọi dịch vụ Python DeepFace để so khớp ảnh chụp với ảnh gốc của nhân viên. */
@Component
public class FaceVerificationClient {

    public record VerifyResult(boolean verified, boolean spoof, boolean noFace) {
    }

    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final RestTemplate restTemplate;
    private final String verifyUrl;

    @Autowired
    public FaceVerificationClient(RestTemplateBuilder builder,
                                  @Value("${deepface.api.url:http://localhost:5000/verify}") String verifyUrl) {
        this(builder.connectTimeout(TIMEOUT).readTimeout(TIMEOUT).build(), verifyUrl);
    }

    FaceVerificationClient(RestTemplate restTemplate, String verifyUrl) {
        this.restTemplate = restTemplate;
        this.verifyUrl = verifyUrl;
    }

    public VerifyResult verify(byte[] image, String referencePath) {
        byte[] reference = loadReference(referencePath);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", namedResource(image, "capture.jpg"));
        body.add("reference_image", namedResource(reference, "reference.jpg"));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            Map<?, ?> res = restTemplate.postForObject(verifyUrl, new HttpEntity<>(body, headers), Map.class);
            if (res == null) {
                throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
            }
            return new VerifyResult(isTrue(res.get("verified")), isTrue(res.get("spoof")), isTrue(res.get("no_face")));
        } catch (RestClientException e) {
            throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
        }
    }

    private byte[] loadReference(String referencePath) {
        if (referencePath == null || referencePath.isBlank()) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
        if (referencePath.startsWith("http")) {
            try {
                byte[] bytes = restTemplate.getForObject(referencePath, byte[].class);
                if (bytes == null || bytes.length == 0) {
                    throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
                }
                return bytes;
            } catch (RestClientException e) {
                throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
            }
        }
        Path path = Path.of(referencePath);
        if (!Files.exists(path)) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
    }

    private static ByteArrayResource namedResource(byte[] bytes, String filename) {
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }

    private static boolean isTrue(Object value) {
        return Boolean.TRUE.equals(value);
    }
}
