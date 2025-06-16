package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Repository.ShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IStaffService;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
@Slf4j
public class StaffService implements IStaffService {

    private final StaffRepository staffRepository;

    private final StaffShiftRepository staffShiftRepository;

    private final ShiftRepository shiftRepository;

    @Transactional
    @Override
    public List<GetAllStaffResponseDTO> getAllStaff() {
        return staffRepository.findAllByStatus(UserStatus.ACTIVE).stream()
                .map(staff -> new GetAllStaffResponseDTO(
                        staff.getStaffId(),
                        staff.getFullname(),
                        staff.getPosition(),
                        staff.getStatus(),
                        staff.getPosition(),
                        staff.getUser().getEmail(),
                        staff.getUser().getPhone(),
                        staff.getSalary()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void assignStaffShift(Integer staffId, Integer shiftId, LocalDate date) {
        if (date.isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot assign a shift to a past date.");
        }

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        if (staffShiftRepository.existsByStaffAndShiftAndDate(staff, shift, date)) {
            throw new RuntimeException("Staff is already assigned to this shift on this date");
        }

        StaffShift staffShift = new StaffShift();
        staffShift.setStaff(staff);
        staffShift.setShift(shift);
        staffShift.setDate(date);
        staffShift.setStatus(StaffShiftStatus.ASSIGNED);

        staffShiftRepository.save(staffShift);
    }

    @Transactional
    @Override
    public GetAllStaffResponseDTO getStaffById(Integer id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + id));
        return new GetAllStaffResponseDTO(
                staff.getStaffId(),
                staff.getFullname(),
                staff.getPosition(),
                staff.getStatus(),
                staff.getPosition(),
                staff.getUser().getEmail(),
                staff.getUser().getPhone(),
                staff.getSalary()
        );
    }

    @Transactional
    @Override
    public void updateStaff(Integer id, UpdateStaffDTO staffUpdateDTO) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Staff not found with id: " + id));

        if (staffUpdateDTO.getPosition() == null || staffUpdateDTO.getPosition().trim().isEmpty()) {
            throw new IllegalArgumentException("Position cannot be empty");
        }
        if (staffUpdateDTO.getSalary() == null || staffUpdateDTO.getSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Salary must be positive");
        }
        if (staffUpdateDTO.getStatus() == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }

        staff.setPosition(staffUpdateDTO.getPosition());
        staff.setSalary(staffUpdateDTO.getSalary());
        staff.setStatus(staffUpdateDTO.getStatus());

        if (staff.getHireDate() == null) {
            log.warn("hireDate is null for staff ID {}. Setting to current time.", id);
            staff.setHireDate(LocalDate.now());
        }

        staffRepository.save(staff);
    }

    @Transactional
    @Override
    public void deleteStaff(Integer id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Staff not found with id: " + id));

        if (staff.getHireDate() == null) {
            log.warn("hireDate is null for staff ID {}. Setting to current time.", id);
            staff.setHireDate(LocalDate.now());
        }

        // Soft delete by setting status to INACTIVE
        staff.setStatus(UserStatus.INACTIVE);
        staffRepository.save(staff);
    }
}
