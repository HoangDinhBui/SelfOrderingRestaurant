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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class StaffService implements IStaffService {

    private final StaffRepository staffRepository;


    private final StaffShiftRepository staffShiftRepository;


    private final ShiftRepository shiftRepository;

    @Transactional
    @Override
    public List<GetAllStaffResponseDTO> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(staff -> new GetAllStaffResponseDTO(
                        staff.getStaffId(),
                        staff.getFullname(),
                        staff.getPosition()
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
                staff.getPosition()
        );
    }

    @Transactional
    @Override
    public void updateStaff(Integer id, UpdateStaffDTO staffUpdateDTO) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + id));

        // Update staff information
        if (staffUpdateDTO.getPosition() != null) {
            staff.setPosition(staffUpdateDTO.getPosition());
        }

        if (staffUpdateDTO.getSalary() != null) {
            staff.setSalary(staffUpdateDTO.getSalary());
        }

        if (staffUpdateDTO.getStatus() != null) {
            staff.setStatus(staffUpdateDTO.getStatus());
        }

        Staff updatedStaff = staffRepository.save(staff);
    }

    @Transactional
    @Override
    public void deleteStaff(Integer id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found with id: " + id));

        // Instead of completely deleting, we can set the status to INACTIVE
        staff.setStatus(UserStatus.INACTIVE);
        staffRepository.save(staff);
    }
}
