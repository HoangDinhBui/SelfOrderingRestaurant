package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.AssignStaffRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Service.AuthService;
import com.example.SelfOrderingRestaurant.Service.StaffService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/staff")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@PermitAll
public class AdminController {
    @Autowired
    StaffService staffService;

    @Autowired
    AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> registerStaff(@RequestBody RegisterRequestDto request) {
        authService.registerStaff(request);
        return ResponseEntity.ok("Staff registered successfully!");
    }

    @GetMapping
    public ResponseEntity<?> getAllStaff() {
        List<GetAllStaffResponseDTO> staff = staffService.getAllStaff();
        return ResponseEntity.ok(staff);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GetAllStaffResponseDTO> getStaffById(@PathVariable("id") Integer id) {
        GetAllStaffResponseDTO staff = staffService.getStaffById(id);
        return new ResponseEntity<>(staff, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable("id") Integer id,
                                                      @RequestBody UpdateStaffDTO staffUpdateDTO) {
        staffService.updateStaff(id, staffUpdateDTO);
        return ResponseEntity.ok("Staff updated successfully!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable("id") Integer id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok("Staff deleted successfully!");
    }

    @PostMapping
    public ResponseEntity<?> assignStaffShift(
                @RequestBody AssignStaffRequestDTO request) {
        staffService.assignStaffShift(request.getStaffId(), request.getShiftId(), request.getDate());
        return ResponseEntity.ok("Staff shift assigned successfully!");
    }
}
