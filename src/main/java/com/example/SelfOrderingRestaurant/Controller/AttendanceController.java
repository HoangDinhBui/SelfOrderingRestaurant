package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO.AttendanceApprovalRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO.ManualAttendanceRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final IAttendanceService attendanceService;
    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttendanceResultDTO scan(@RequestParam("image") MultipartFile image,
                                    @RequestParam("type") Attendance.AttendanceStatus type,
                                    Authentication authentication) throws IOException {
        return attendanceService.scan(authentication.getName(), type, image.getBytes());
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/manual")
    public AttendanceResultDTO manual(@Valid @RequestBody ManualAttendanceRequestDTO request,
                                      Authentication authentication) {
        return attendanceService.manual(authentication.getName(), request.type(), request.reason().trim());
    }

    @PreAuthorize("hasRole('STAFF')")
    @GetMapping("/today")
    public AttendanceTodayDTO today(Authentication authentication) {
        return attendanceService.today(authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public List<PendingAttendanceDTO> pending() {
        return attendanceService.pending();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approval")
    public ResponseEntity<Void> review(@PathVariable Integer id,
                                       @Valid @RequestBody AttendanceApprovalRequestDTO request) {
        attendanceService.review(id, request.approved());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add-face")
    public ResponseEntity<?> addFace(@RequestParam("staffId") Integer staffId,
                                     @RequestParam("image") MultipartFile image) throws IOException {
        String uploadDir = "uploads/staff_faces/";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        String filePath = uploadDir + staffId + ".jpg";
        Files.write(Paths.get(filePath), image.getBytes());

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        staff.setFaceImagePath(filePath);
        staffRepository.save(staff);

        return ResponseEntity.ok(Map.of("message", "Face added successfully for staff ID " + staffId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public List<Attendance> getAttendanceHistory() {
        return attendanceRepository.findAll();
    }
}
