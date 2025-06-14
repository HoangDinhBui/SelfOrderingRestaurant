package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRegistrationDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftScheduleDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.UnauthorizedException;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.StaffService;
import com.example.SelfOrderingRestaurant.Service.StaffShiftService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffShiftService staffShiftService;
    private final StaffService staffService;
    private final StaffRepository staffRepository;

    // Get all available shifts
    @GetMapping("/shifts/available")
    public ResponseEntity<?> getAvailableShifts() {
        List<Shift> shifts = staffShiftService.getAvailableShifts();
        return ResponseEntity.ok(shifts);
    }

    // Get staff's current schedule for the current week
    @GetMapping("/shifts/my-schedule")
    public ResponseEntity<?> getMySchedule() {
        try {
            Staff currentStaff = staffShiftService.getCurrentStaff();
            Map<LocalDate, List<ShiftScheduleDTO>> schedule = staffShiftService.getStaffSchedule(currentStaff);
            return ResponseEntity.ok(schedule);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    // Register for a single shift
    @PostMapping("/shifts/register")
    public ResponseEntity<?> registerShift(@RequestBody ShiftRegistrationDTO registration) {
        try {
            Staff currentStaff = staffShiftService.getCurrentStaff();
            Map<String, Object> result = staffShiftService.registerShift(currentStaff, registration);
            return ResponseEntity.ok(result);
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Cancel a shift registration
    @DeleteMapping("/shifts/{staffShiftId}")
    public ResponseEntity<?> cancelShift(@PathVariable Integer staffShiftId) {
        try {
            Staff currentStaff = staffShiftService.getCurrentStaff();
            staffShiftService.cancelShift(currentStaff, staffShiftId);
            return ResponseEntity.ok("Shift registration cancelled successfully");
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get shifts available for registration for a specific week
    @GetMapping("/shifts/available-week")
    public ResponseEntity<?> getAvailableShiftsForWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        Map<LocalDate, List<ShiftScheduleDTO>> availableShifts =
                staffShiftService.getAvailableShiftsForWeek(weekStart);
        return ResponseEntity.ok(availableShifts);
    }

    // Các endpoint mới để gọi StaffService
    @GetMapping
    public ResponseEntity<List<GetAllStaffResponseDTO>> getAllStaff() {
        try {
            List<GetAllStaffResponseDTO> staffList = staffService.getAllStaff();
            return ResponseEntity.ok(staffList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStaffById(@PathVariable Integer id) {
        try {
            GetAllStaffResponseDTO staff = staffService.getStaffById(id);
            return ResponseEntity.ok(staff);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/assign-shift")
    public ResponseEntity<?> assignStaffShift(
            @RequestParam Integer staffId,
            @RequestParam Integer shiftId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            staffService.assignStaffShift(staffId, shiftId, date);
            return ResponseEntity.ok("Shift assigned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable Integer id, @RequestBody UpdateStaffDTO staffUpdateDTO) {
        try {
            staffService.updateStaff(id, staffUpdateDTO);
            return ResponseEntity.ok("Staff updated successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Integer id) {
        try {
            staffService.deleteStaff(id);
            return ResponseEntity.ok("Staff deleted successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<Staff> getStaffByUsername(@PathVariable String username) {
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Staff not found for username: " + username));
        return ResponseEntity.ok(staff);
    }
}