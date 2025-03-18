package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.AssignStaffRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Service.StaffService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PermitAll
public class StaffController {
    @Autowired
    StaffService staffService;

    @GetMapping
    public ResponseEntity<?> getAllStaff() {
        List<GetAllStaffResponseDTO> staff = staffService.getAllStaff();
        return ResponseEntity.ok(staff);
    }

    @PostMapping
    public ResponseEntity<?> assignStaffShift(
                @RequestBody AssignStaffRequestDTO request) {
        staffService.assignStaffShift(request.getStaffId(), request.getShiftId(), request.getDate());
        return ResponseEntity.ok("Staff shift assigned successfully!");
    }
}
