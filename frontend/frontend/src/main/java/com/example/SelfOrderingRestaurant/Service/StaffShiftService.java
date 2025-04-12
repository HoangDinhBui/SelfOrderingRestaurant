package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRegistrationDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftScheduleDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.UnauthorizedException;
import com.example.SelfOrderingRestaurant.Repository.ShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IStaffShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StaffShiftService implements IStaffShiftService {

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    @Override
    public List<Shift> getAvailableShifts() {
        return shiftRepository.findAll();
    }

    @Transactional
    @Override
    public Map<LocalDate, List<ShiftScheduleDTO>> getStaffSchedule(Staff staff) {
        if (staff == null) {
            throw new UnauthorizedException("Staff not found");
        }

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        return getStaffScheduleForDateRange(staff, startOfWeek, endOfWeek);
    }

    @Transactional
    @Override
    public Map<LocalDate, List<ShiftScheduleDTO>> getStaffScheduleForDateRange(Staff staff, LocalDate startDate, LocalDate endDate) {
        List<StaffShift> staffShifts = staffShiftRepository.findByStaffAndDateBetween(
                staff, startDate, endDate);

        Map<LocalDate, List<ShiftScheduleDTO>> scheduleByDay = new LinkedHashMap<>();

        // Initialize all days of the period
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            scheduleByDay.put(currentDate, new ArrayList<>());
            currentDate = currentDate.plusDays(1);
        }

        // Fill in scheduled shifts
        for (StaffShift staffShift : staffShifts) {
            ShiftScheduleDTO dto = mapToShiftScheduleDTO(staffShift);
            scheduleByDay.get(staffShift.getDate()).add(dto);
        }

        return scheduleByDay;
    }

    @Transactional
    @Override
    public Map<String, Object> registerShifts(Staff staff, List<ShiftRegistrationDTO> registrations) {
        if (staff == null) {
            throw new UnauthorizedException("Staff not found");
        }

        List<StaffShift> newShifts = new ArrayList<>();
        StringBuilder errors = new StringBuilder();

        for (ShiftRegistrationDTO reg : registrations) {
            try {
                StaffShift staffShift = registerSingleShift(staff, reg);
                newShifts.add(staffShift);
            } catch (Exception e) {
                errors.append(e.getMessage()).append(" ");
            }
        }

        if (!newShifts.isEmpty()) {
            staffShiftRepository.saveAll(newShifts);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("registeredShifts", newShifts.size());
        if (errors.length() > 0) {
            response.put("errors", errors.toString());
        }

        return response;
    }

    @Transactional
    private StaffShift registerSingleShift(Staff staff, ShiftRegistrationDTO registration) {
        Shift shift = shiftRepository.findById(registration.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift with ID " + registration.getShiftId() + " not found"));

        // Check if staff already registered for this shift on this date
        StaffShift existingShift = staffShiftRepository.findByStaffAndShiftAndDate(
                staff, shift, registration.getDate());

        if (existingShift != null) {
            throw new BadRequestException("Already registered for shift " + shift.getName() + " on " + registration.getDate());
        }

        // Check for overlapping shifts on the same day
        List<StaffShift> shiftsOnSameDay = staffShiftRepository.findByStaffAndDate(staff, registration.getDate());
        boolean hasOverlap = shiftsOnSameDay.stream().anyMatch(ss -> {
            Shift existingShiftObj = ss.getShift();  // Renamed variable to avoid conflict

            return (shift.getStartTime().isBefore(existingShiftObj.getEndTime()) &&
                    shift.getEndTime().isAfter(existingShiftObj.getStartTime()));
        });

        if (hasOverlap) {
            throw new BadRequestException("Shift " + shift.getName() + " overlaps with an existing shift on " + registration.getDate());
        }

        StaffShift staffShift = new StaffShift();
        staffShift.setStaff(staff);
        staffShift.setShift(shift);
        staffShift.setDate(registration.getDate());
        staffShift.setStatus(StaffShiftStatus.ASSIGNED);

        return staffShift;
    }

    @Transactional
    @Override
    public void cancelShift(Staff staff, Integer staffShiftId) {
        if (staff == null) {
            throw new UnauthorizedException("Staff not found");
        }

        StaffShift staffShift = staffShiftRepository.findById(staffShiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift registration not found"));

        // Ensure staff can only cancel their own shifts
        if (!staffShift.getStaff().getStaffId().equals(staff.getStaffId())) {
            throw new UnauthorizedException("Not authorized to cancel this shift");
        }

        // Only allow cancellation if the shift is in the future and status is ASSIGNED
        if (staffShift.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot cancel past shifts");
        }

        if (staffShift.getStatus() != StaffShiftStatus.ASSIGNED) {
            throw new BadRequestException("Can only cancel shifts with ASSIGNED status");
        }

        staffShiftRepository.delete(staffShift);
    }

    @Transactional
    @Override
    public Map<LocalDate, List<ShiftScheduleDTO>> getAvailableShiftsForWeek(LocalDate weekStart) {
        // Adjust to make sure weekStart is a Monday
        LocalDate startOfWeek = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = startOfWeek.plusDays(6); // Sunday

        // Get all shifts
        List<Shift> allShifts = shiftRepository.findAll();

        // Create a map of available shifts for each day
        Map<LocalDate, List<ShiftScheduleDTO>> availableShiftsByDay = new LinkedHashMap<>();

        LocalDate currentDate = startOfWeek;
        while (!currentDate.isAfter(endOfWeek)) {
            List<ShiftScheduleDTO> availableShifts = allShifts.stream()
                    .map(this::mapToSimpleShiftScheduleDTO)
                    .collect(Collectors.toList());

            availableShiftsByDay.put(currentDate, availableShifts);
            currentDate = currentDate.plusDays(1);
        }

        return availableShiftsByDay;
    }

    @Transactional
    @Override
    public Staff getCurrentStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional == null) {
            return null;
        }

        return staffRepository.findByUser(userOptional.get());
    }

    private ShiftScheduleDTO mapToShiftScheduleDTO(StaffShift staffShift) {
        ShiftScheduleDTO dto = new ShiftScheduleDTO();
        dto.setStaffShiftId(staffShift.getStaffShiftKey());
        dto.setShiftId(staffShift.getShift().getShiftId());
        dto.setShiftName(staffShift.getShift().getName());
        dto.setStartTime(staffShift.getShift().getStartTime());
        dto.setEndTime(staffShift.getShift().getEndTime());
        dto.setStatus(staffShift.getStatus());
        return dto;
    }

    private ShiftScheduleDTO mapToSimpleShiftScheduleDTO(Shift shift) {
        ShiftScheduleDTO dto = new ShiftScheduleDTO();
        dto.setShiftId(shift.getShiftId());
        dto.setShiftName(shift.getName());
        dto.setStartTime(shift.getStartTime());
        dto.setEndTime(shift.getEndTime());
        return dto;
    }
}