package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRegistrationDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftScheduleDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.UnauthorizedException;
import com.example.SelfOrderingRestaurant.Service.StaffShiftService;
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
@RequestMapping("/api/staff/shifts")
public class StaffController {

    private final StaffShiftService staffShiftService;

    // Get all available shifts
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableShifts() {
        List<Shift> shifts = staffShiftService.getAvailableShifts();
        return ResponseEntity.ok(shifts);
    }

    // Get staff's current schedule for the current week
    @GetMapping("/my-schedule")
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
    @PostMapping("/register")
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
    @DeleteMapping("/{staffShiftId}")
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
    @GetMapping("/available-week")
    public ResponseEntity<?> getAvailableShiftsForWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        Map<LocalDate, List<ShiftScheduleDTO>> availableShifts =
                staffShiftService.getAvailableShiftsForWeek(weekStart);
        return ResponseEntity.ok(availableShifts);
    }
}