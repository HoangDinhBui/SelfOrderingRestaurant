package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRegistrationDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftScheduleDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.StaffShiftAssignmentDTO;
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
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class StaffShiftService implements IStaffShiftService {

    private final ShiftRepository shiftRepository;
    private final StaffRepository staffRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final UserRepository userRepository;

    private static final int MAX_STAFF_PER_SHIFT = 3;

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

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            scheduleByDay.put(currentDate, new ArrayList<>());
            currentDate = currentDate.plusDays(1);
        }

        for (StaffShift staffShift : staffShifts) {
            ShiftScheduleDTO dto = mapToShiftScheduleDTO(staffShift);
            scheduleByDay.get(staffShift.getDate()).add(dto);
        }

        return scheduleByDay;
    }

    @Transactional
    public Map<String, Object> registerShift(Staff staff, ShiftRegistrationDTO registration) {
        if (staff == null) {
            throw new UnauthorizedException("Staff not found");
        }

        LocalDate today = LocalDate.now();
        LocalDate restrictionStart = today.minusDays(7);
        List<StaffShift> recentShifts = staffShiftRepository.findByStaffAndDateBetween(staff, restrictionStart, today);
        if (!recentShifts.isEmpty() && registration.getDate().isEqual(today)) {
            throw new BadRequestException("Cannot register new shift. You must wait 7 days since your last shift registration.");
        }

        Shift shift = shiftRepository.findById(registration.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift with ID " + registration.getShiftId() + " not found"));

        Map<String, Object> response = new HashMap<>();
        List<Integer> registeredShiftIds = new ArrayList<>();

        LocalDate startDate = registration.getDate();
        for (int i = 0; i < 7; i++) {
            LocalDate currentDate = startDate.plusDays(i);

            // Kiểm tra xem nhân viên đã đăng ký ca trong ngày chưa
            StaffShift existingShift = staffShiftRepository.findByStaffAndShiftAndDate(staff, shift, currentDate);
            if (existingShift != null) {
                continue;
            }

            // Kiểm tra số lượng nhân viên trong ca
            List<StaffShift> shiftRegistrations = staffShiftRepository.findByDateAndShift(currentDate, shift);
            if (shiftRegistrations.size() >= MAX_STAFF_PER_SHIFT) {
                continue;
            }

            if (overlapsOwnShifts(staff, shift, currentDate)) {
                continue;
            }

            // Đăng ký ca
            StaffShift staffShift = new StaffShift();
            staffShift.setStaff(staff);
            staffShift.setShift(shift);
            staffShift.setDate(currentDate);
            staffShift.setStatus(StaffShiftStatus.ASSIGNED);

            try {
                staffShift = staffShiftRepository.save(staffShift);
                registeredShiftIds.add(staffShift.getStaffShiftKey());
            } catch (Exception e) {
                throw new BadRequestException("Failed to register shift for date " + currentDate + ": " + e.getMessage());
            }
        }

        if (registeredShiftIds.isEmpty()) {
            throw new BadRequestException("No shifts were registered: they are full, already yours, or overlap your other shifts.");
        }

        response.put("registeredShiftIds", registeredShiftIds);
        return response;
    }

    @Transactional
    private StaffShift registerSingleShift(Staff staff, ShiftRegistrationDTO registration) {
        Shift shift = shiftRepository.findById(registration.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift with ID " + registration.getShiftId() + " not found"));

        StaffShift existingShift = staffShiftRepository.findByStaffAndShiftAndDate(
                staff, shift, registration.getDate());
        if (existingShift != null) {
            throw new BadRequestException("Already registered for shift " + shift.getName() + " on " + registration.getDate());
        }

        List<StaffShift> shiftsOnSameDay = staffShiftRepository.findByStaffAndDate(staff, registration.getDate());
        boolean hasOverlap = shiftsOnSameDay.stream().anyMatch(ss -> {
            Shift existingShiftObj = ss.getShift();
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

        if (!staffShift.getStaff().getStaffId().equals(staff.getStaffId())) {
            throw new UnauthorizedException("Not authorized to cancel this shift");
        }

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
        LocalDate startOfWeek = weekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        List<Shift> allShifts = shiftRepository.findAll();

        Map<LocalDate, List<ShiftScheduleDTO>> availableShiftsByDay = new LinkedHashMap<>();

        LocalDate currentDate = startOfWeek;
        while (!currentDate.isAfter(endOfWeek)) {
            List<StaffShift> shiftRegistrations = staffShiftRepository.findByDate(currentDate);
            Map<Integer, Long> shiftCounts = shiftRegistrations.stream()
                    .collect(Collectors.groupingBy(
                            ss -> ss.getShift().getShiftId(),
                            Collectors.counting()
                    ));

            List<ShiftScheduleDTO> availableShifts = allShifts.stream()
                    .filter(shift -> shiftCounts.getOrDefault(shift.getShiftId(), 0L) < MAX_STAFF_PER_SHIFT)
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

        if (userOptional.isEmpty()) {
            return null;
        }

        return staffRepository.findByUser(userOptional.get());
    }

    @Transactional
    public void assignShiftByAdmin(Integer staffId, Integer shiftId, LocalDate date) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff with ID " + staffId + " not found"));
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift with ID " + shiftId + " not found"));

        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot assign a shift in the past (" + date + ")");
        }

        // Kiểm tra số lượng nhân viên trong ca
        List<StaffShift> shiftRegistrations = staffShiftRepository.findByDateAndShift(date, shift);
        if (shiftRegistrations.size() >= MAX_STAFF_PER_SHIFT) {
            throw new BadRequestException("Shift " + shift.getName() + " on " + date + " is already full (maximum " + MAX_STAFF_PER_SHIFT + " staff).");
        }

        // Kiểm tra xem nhân viên đã được gán ca trong ngày chưa
        StaffShift existingShift = staffShiftRepository.findByStaffAndShiftAndDate(staff, shift, date);
        if (existingShift != null) {
            throw new BadRequestException("Staff already assigned to shift " + shift.getName() + " on " + date);
        }

        // Only this staff member's own shifts can clash; colleagues share a shift up to the cap
        if (overlapsOwnShifts(staff, shift, date)) {
            throw new BadRequestException("Shift " + shift.getName() + " overlaps with another shift of this staff on " + date);
        }

        // Gán ca
        StaffShift staffShift = new StaffShift();
        staffShift.setStaff(staff);
        staffShift.setShift(shift);
        staffShift.setDate(date);
        staffShift.setStatus(StaffShiftStatus.ASSIGNED);

        staffShiftRepository.save(staffShift);
    }

    private boolean overlapsOwnShifts(Staff staff, Shift shift, LocalDate date) {
        return staffShiftRepository.findByStaffAndDate(staff, date).stream().anyMatch(ss -> {
            Shift other = ss.getShift();
            return shift.getStartTime().isBefore(other.getEndTime())
                    && shift.getEndTime().isAfter(other.getStartTime());
        });
    }

    @Transactional
    public List<StaffShiftAssignmentDTO> getAssignments(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BadRequestException("'to' must not be before 'from'");
        }
        return staffShiftRepository.findByDateBetweenOrderByDateAsc(from, to).stream()
                .map(ss -> {
                    StaffShiftAssignmentDTO dto = new StaffShiftAssignmentDTO();
                    dto.setStaffShiftId(ss.getStaffShiftKey());
                    dto.setDate(ss.getDate());
                    dto.setStaffId(ss.getStaff().getStaffId());
                    dto.setStaffName(ss.getStaff().getFullname());
                    dto.setShiftId(ss.getShift().getShiftId());
                    dto.setShiftName(ss.getShift().getName());
                    dto.setStartTime(ss.getShift().getStartTime());
                    dto.setEndTime(ss.getShift().getEndTime());
                    dto.setStatus(ss.getStatus());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /** Past assignments stay: attendance and salary are computed from them. */
    @Transactional
    public void removeAssignmentByAdmin(Integer staffShiftId) {
        StaffShift staffShift = staffShiftRepository.findById(staffShiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift assignment " + staffShiftId + " not found"));
        if (staffShift.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot remove a past shift assignment");
        }
        staffShiftRepository.delete(staffShift);
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