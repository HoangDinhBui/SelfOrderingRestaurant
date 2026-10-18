package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Exception.GlobalExeptionHandler;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AttendanceControllerTest {

    private IAttendanceService service;
    private MockMvc mvc;
    private final UsernamePasswordAuthenticationToken staff =
            new UsernamePasswordAuthenticationToken("hoang", null);

    @BeforeEach
    void setUp() {
        service = mock(IAttendanceService.class);
        AttendanceController controller = new AttendanceController(service,
                mock(AttendanceRepository.class), mock(StaffRepository.class));
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExeptionHandler())
                .build();
    }

    @Test
    void scan_success_returnsResult() throws Exception {
        when(service.scan(eq("hoang"), eq(AttendanceStatus.CHECK_IN), any())).thenReturn(new AttendanceResultDTO(
                1, "CHECK_IN", "Hoàng", LocalDateTime.of(2026, 10, 18, 7, 58), null, false, false, null, false, "Check-in thành công"));
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .param("type", "CHECK_IN")
                        .principal(staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staffName").value("Hoàng"))
                .andExpect(jsonPath("$.type").value("CHECK_IN"));
    }

    @Test
    void scan_attendanceError_mapsStatusAndCode() throws Exception {
        when(service.scan(any(), any(), any())).thenThrow(new AttendanceException(AttendanceError.FACE_MISMATCH));
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .param("type", "CHECK_IN")
                        .principal(staff))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("FACE_MISMATCH"));
    }

    @Test
    void manual_blankReason_returns400() throws Exception {
        mvc.perform(post("/api/attendance/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHECK_IN\",\"reason\":\"  \"}")
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        String tooLong = "x".repeat(256);
        mvc.perform(post("/api/attendance/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHECK_IN\",\"reason\":\"" + tooLong + "\"}")
                        .principal(staff))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void approval_callsReview_returns204() throws Exception {
        mvc.perform(patch("/api/attendance/7/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true}"))
                .andExpect(status().isNoContent());
        verify(service).review(7, true);
    }

    @Test
    void scan_unknownType_returns400ValidationError() throws Exception {
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .param("type", "BOGUS")
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
        verifyNoInteractions(service);
    }

    @Test
    void scan_missingTypeOrImage_returns400ValidationError() throws Exception {
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(multipart("/api/attendance/scan")
                        .param("type", "CHECK_IN")
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        verifyNoInteractions(service);
    }

    @Test
    void manual_malformedJson_returns400ValidationError() throws Exception {
        mvc.perform(post("/api/attendance/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHECK_IN\",")
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }
}
