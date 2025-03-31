package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.AssignStaffRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Service.AuthService;
import com.example.SelfOrderingRestaurant.Service.ShiftService;
import com.example.SelfOrderingRestaurant.Service.StaffService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@PermitAll
public class AdminController {
    @Autowired
    private StaffService staffService;

    @Autowired
    private AuthService authService;

    @Autowired
    private ShiftService shiftService;

    // Staff Management Endpoints
    @PostMapping("/api/admin/staff/register")
    public ResponseEntity<?> registerStaff(@RequestBody RegisterRequestDto request) {
        authService.registerStaff(request);
        return ResponseEntity.ok("Staff registered successfully!");
    }

    @GetMapping("/api/admin/staff")
    public ResponseEntity<?> getAllStaff() {
        List<GetAllStaffResponseDTO> staff = staffService.getAllStaff();
        return ResponseEntity.ok(staff);
    }

    @GetMapping("/api/admin/staff/{id}")
    public ResponseEntity<GetAllStaffResponseDTO> getStaffById(@PathVariable("id") Integer id) {
        GetAllStaffResponseDTO staff = staffService.getStaffById(id);
        return new ResponseEntity<>(staff, HttpStatus.OK);
    }

    @PutMapping("/api/admin/staff/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable("id") Integer id,
                                         @RequestBody UpdateStaffDTO staffUpdateDTO) {
        staffService.updateStaff(id, staffUpdateDTO);
        return ResponseEntity.ok("Staff updated successfully!");
    }

    @DeleteMapping("/api/admin/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable("id") Integer id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok("Staff deleted successfully!");
    }

    @PostMapping("/api/admin/staff")
    public ResponseEntity<?> assignStaffShift(@RequestBody AssignStaffRequestDTO request) {
        staffService.assignStaffShift(request.getStaffId(), request.getShiftId(), request.getDate());
        return ResponseEntity.ok("Staff shift assigned successfully!");
    }

    // Shift Management Endpoints
    @GetMapping("/api/admin/shifts")
    public ResponseEntity<List<ShiftResponseDTO>> getAllShifts() {
        List<ShiftResponseDTO> shifts = shiftService.getAllShifts();
        return ResponseEntity.ok(shifts);
    }

    @GetMapping("/api/admin/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> getShiftById(@PathVariable Integer id) {
        ShiftResponseDTO shift = shiftService.getShiftById(id);
        return shift != null ? ResponseEntity.ok(shift) : ResponseEntity.notFound().build();
    }

    @PostMapping("/api/admin/shifts")
    public ResponseEntity<ShiftResponseDTO> createShift(@RequestBody ShiftRequestDTO shiftRequestDTO) {
        return ResponseEntity.ok(shiftService.createShift(shiftRequestDTO));
    }

    @PutMapping("/api/admin/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> updateShift(@PathVariable Integer id, @RequestBody ShiftRequestDTO shiftRequestDTO) {
        ShiftResponseDTO updatedShift = shiftService.updateShift(id, shiftRequestDTO);
        return updatedShift != null ? ResponseEntity.ok(updatedShift) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/api/admin/shifts/{id}")
    public ResponseEntity<Map<String, String>> deleteShift(@PathVariable Integer id) {
        shiftService.deleteShift(id);
        return ResponseEntity.ok(Map.of("message", "Shift deleted successfully"));
    }
}