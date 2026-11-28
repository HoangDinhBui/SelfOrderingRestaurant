package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO.NotificationRequestDTO;
import com.example.SelfOrderingRestaurant.Exception.NoStaffOnShiftException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class NotificationControllerTest {

    private final NotificationService service = mock(NotificationService.class);
    private final NotificationController controller = new NotificationController(service);

    @SuppressWarnings("unchecked")
    private Map<String, Object> body(ResponseEntity<?> response) {
        return (Map<String, Object>) response.getBody();
    }

    @Test
    void noStaffOnShiftIsAConflictWithAPlainMessageAndCode() {
        doThrow(new NoStaffOnShiftException("Hiện không có nhân viên trong ca, vui lòng thử lại sau"))
                .when(service).createNotification(any());

        ResponseEntity<?> response = controller.createNotification(new NotificationRequestDTO());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(NoStaffOnShiftException.CODE, body(response).get("code"));
        assertEquals("Hiện không có nhân viên trong ca, vui lòng thử lại sau", body(response).get("message"));
    }

    @Test
    void validationErrorIsABadRequestWithoutEnglishPrefix() {
        doThrow(new ValidationException("Thiếu số bàn")).when(service).createNotification(any());

        ResponseEntity<?> response = controller.createNotification(new NotificationRequestDTO());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Thiếu số bàn", body(response).get("error"));
    }

    @Test
    void unexpectedErrorDoesNotLeakInternals() {
        doThrow(new RuntimeException("NPE at line 42")).when(service).createNotification(any());

        ResponseEntity<?> response = controller.createNotification(new NotificationRequestDTO());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Không gửi được yêu cầu tới nhân viên, vui lòng thử lại", body(response).get("message"));
    }
}
