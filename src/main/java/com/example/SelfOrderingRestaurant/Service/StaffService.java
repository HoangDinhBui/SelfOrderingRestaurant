package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Repository.ShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {
    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    public List<GetAllStaffResponseDTO> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(staff -> new GetAllStaffResponseDTO(
                        staff.getStaffId(),
                        staff.getFullname(),
                        staff.getPosition()
                ))
                .collect(Collectors.toList());
    }

    public void assignStaffShift(Integer staffId, Integer shiftId, LocalDate date) {
        if (date.isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot assign a shift to a past date.");
        }

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        boolean alreadyAssigned = staffShiftRepository.existsByStaffAndShiftAndDate(staff, shift, date);
        if (alreadyAssigned) {
            throw new RuntimeException("Staff is already assigned to this shift on this date.");
        }

        StaffShift staffShift = new StaffShift();
        staffShift.setStaff(staff);
        staffShift.setShift(shift);
        staffShift.setDate(date);
        staffShift.setStatus(StaffShiftStatus.ASSIGNED);

        staffShiftRepository.save(staffShift);
    }
}
