package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.VoiceOrderError;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderException;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

/** Gọi dịch vụ Python PhoWhisper (VoiceRecognition/) để chuyển giọng nói tiếng Việt thành chữ. */
@Component
public class SpeechToTextClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    // CPU inference of a ~15s clip takes a few seconds; leave room for a slow free-tier host
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60);

    private final RestTemplate restTemplate;
    private final String transcribeUrl;

    @Autowired
    public SpeechToTextClient(RestTemplateBuilder builder,
                              @Value("${voice.stt.url:http://localhost:7860/transcribe}") String transcribeUrl) {
        this(builder.connectTimeout(CONNECT_TIMEOUT).readTimeout(READ_TIMEOUT).build(), transcribeUrl);
    }

    SpeechToTextClient(RestTemplate restTemplate, String transcribeUrl) {
        this.restTemplate = restTemplate;
        this.transcribeUrl = transcribeUrl;
    }

    public String transcribe(byte[] audio, String filename) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("audio", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return filename == null || filename.isBlank() ? "voice.webm" : filename;
            }
        });
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            Map<?, ?> res = restTemplate.postForObject(transcribeUrl, new HttpEntity<>(body, headers), Map.class);
            if (res == null || !(res.get("text") instanceof String text)) {
                throw new VoiceOrderException(VoiceOrderError.STT_UNAVAILABLE);
            }
            return text.trim();
        } catch (HttpClientErrorException.BadRequest e) {
            // 400 = the service could not decode the clip: the guest should simply record again
            throw new VoiceOrderException(VoiceOrderError.AUDIO_UNREADABLE);
        } catch (RestClientException e) {
            throw new VoiceOrderException(VoiceOrderError.STT_UNAVAILABLE);
        }
    }
}
