package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.ShiftInfoDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.FaceVerificationClient.VerifyResult;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.ShiftWindow;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService implements IAttendanceService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final FaceVerificationClient faceClient;
    private final Clock clock;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             StaffRepository staffRepository,
                             StaffShiftRepository staffShiftRepository,
                             FaceVerificationClient faceClient,
                             Clock clock) {
        this.attendanceRepository = attendanceRepository;
        this.staffRepository = staffRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.faceClient = faceClient;
        this.clock = clock;
    }

    @Override
    @Transactional
    public AttendanceResultDTO scan(String username, AttendanceStatus type, byte[] image) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        validateTransition(type, recs);

        VerifyResult result = faceClient.verify(image, staff.getFaceImagePath());
        if (result.noFace()) {
            throw new AttendanceException(AttendanceError.NO_FACE);
        }
        if (result.spoof()) {
            throw new AttendanceException(AttendanceError.SPOOF_DETECTED);
        }
        if (!result.verified()) {
            throw new AttendanceException(AttendanceError.FACE_MISMATCH);
        }
        return record(staff, type, recs, now, null);
    }

    @Override
    @Transactional
    public AttendanceResultDTO manual(String username, AttendanceStatus type, String reason) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        validateTransition(type, recs);
        return record(staff, type, recs, now, reason);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceTodayDTO today(String username) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        Attendance current = recs.open() != null ? recs.open() : recs.today();
        String status = recs.open() != null ? "CHECKED_IN" : recs.today() != null ? "CHECKED_OUT" : "NONE";
        LocalDate shiftDate = current != null ? current.getCheckInTime().toLocalDate() : now.toLocalDate();
        List<ShiftWindow> windows = shiftWindows(staff, shiftDate);
        LocalDateTime anchor = current != null ? current.getCheckInTime() : now;
        ShiftInfoDTO shift = WorkingHoursCalculator.displayShift(anchor, windows).map(AttendanceService::toShiftInfo).orElse(null);
        AttendanceResultDTO attendance = current == null ? null : toResult(staff, current, shift, null);
        return new AttendanceTodayDTO(status, attendance, shift);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PendingAttendanceDTO> pending() {
        return attendanceRepository.findByManualTrueAndApprovedIsNullOrderByCheckInTimeDesc().stream()
                .map(a -> new PendingAttendanceDTO(
                        a.getAttendanceId(),
                        a.getStaffId(),
                        staffRepository.findById(a.getStaffId()).map(Staff::getFullname).orElse("#" + a.getStaffId()),
                        a.getCheckInTime(),
                        a.getCheckOutTime(),
                        a.getWorkingHours(),
                        a.getManualReason()))
                .toList();
    }

    @Override
    @Transactional
    public void review(Integer attendanceId, boolean approved) {
        Attendance a = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi chấm công " + attendanceId));
        if (!Boolean.TRUE.equals(a.getManual()) || a.getApproved() != null) {
            throw new AttendanceException(AttendanceError.ALREADY_REVIEWED);
        }
        a.setApproved(approved);
        a.setUpdatedAt(LocalDateTime.now(clock));
        attendanceRepository.save(a);
        if (approved && a.getCheckOutTime() != null && a.getWorkingHours() != null) {
            staffRepository.findById(a.getStaffId()).ifPresent(staff -> addHours(staff, a.getWorkingHours()));
        }
    }

    // ---------- helpers ----------

    private record Records(Attendance open, Attendance today) {
    }

    private Staff findStaff(String username) {
        return staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + username));
    }

    private Records loadRecords(Staff staff, LocalDateTime now) {
        List<Attendance> recent = attendanceRepository.findByStaffIdAndCheckInTimeBetween(
                staff.getStaffId(), now.minusHours(24), now);
        Comparator<Attendance> byCheckIn = Comparator.comparing(Attendance::getCheckInTime);
        Attendance open = recent.stream()
                .filter(a -> a.getCheckInTime() != null && a.getCheckOutTime() == null)
                .max(byCheckIn).orElse(null);
        Attendance today = recent.stream()
                .filter(a -> a.getCheckInTime() != null && a.getCheckInTime().toLocalDate().equals(now.toLocalDate()))
                .max(byCheckIn).orElse(null);
        return new Records(open, today);
    }

    private void validateTransition(AttendanceStatus type, Records recs) {
        if (type == AttendanceStatus.CHECK_IN && (recs.open() != null || recs.today() != null)) {
            throw new AttendanceException(AttendanceError.ALREADY_CHECKED_IN);
        }
        if (type == AttendanceStatus.CHECK_OUT && recs.open() == null) {
            throw new AttendanceException(recs.today() != null
                    ? AttendanceError.ALREADY_CHECKED_OUT
                    : AttendanceError.NOT_CHECKED_IN);
        }
    }

    /** reason == null nghĩa là chấm công bằng khuôn mặt; khác null là chấm công thủ công. */
    private AttendanceResultDTO record(Staff staff, AttendanceStatus type, Records recs, LocalDateTime now, String reason) {
        boolean manual = reason != null;
        Attendance a;
        List<ShiftWindow> windows;
        if (type == AttendanceStatus.CHECK_IN) {
            windows = shiftWindows(staff, now.toLocalDate());
            a = new Attendance();
            a.setStaffId(staff.getStaffId());
            a.setCheckInTime(now);
            a.setStatus(AttendanceStatus.CHECK_IN);
            a.setCreatedAt(now);
            a.setLate(WorkingHoursCalculator.isLate(now, windows));
        } else {
            a = recs.open();
            windows = shiftWindows(staff, a.getCheckInTime().toLocalDate());
            WorkingHoursCalculator.Result r = WorkingHoursCalculator.calculate(a.getCheckInTime(), now, windows);
            a.setCheckOutTime(now);
            a.setStatus(AttendanceStatus.CHECK_OUT);
            a.setWorkingHours(r.workingHours());
            a.setLate(r.late());
            a.setEarlyLeave(r.earlyLeave());
        }
        a.setUpdatedAt(now);
        if (manual) {
            a.setManual(true);
            a.setApproved(null);
            a.setManualReason(a.getManualReason() == null ? reason : a.getManualReason() + " | " + reason);
        }
        attendanceRepository.save(a);

        if (type == AttendanceStatus.CHECK_OUT) {
            completeShifts(staff, a, windows);
            if (!Boolean.TRUE.equals(a.getManual()) || Boolean.TRUE.equals(a.getApproved())) {
                addHours(staff, a.getWorkingHours());
            }
        }
        ShiftInfoDTO shift = WorkingHoursCalculator.displayShift(a.getCheckInTime(), windows)
                .map(AttendanceService::toShiftInfo).orElse(null);
        return toResult(staff, a, shift, message(type, manual));
    }

    private List<ShiftWindow> shiftWindows(Staff staff, LocalDate date) {
        return activeShifts(staff, date).stream()
                .map(ss -> ShiftWindow.of(ss.getShift().getName(), date, ss.getShift().getStartTime(), ss.getShift().getEndTime()))
                .toList();
    }

    private List<StaffShift> activeShifts(Staff staff, LocalDate date) {
        return staffShiftRepository.findByStaffAndDate(staff, date).stream()
                .filter(ss -> ss.getShift() != null && ss.getStatus() != StaffShiftStatus.ABSENT)
                .toList();
    }

    private void completeShifts(Staff staff, Attendance a, List<ShiftWindow> windows) {
        LocalDate date = a.getCheckInTime().toLocalDate();
        for (StaffShift ss : activeShifts(staff, date)) {
            ShiftWindow w = ShiftWindow.of(ss.getShift().getName(), date, ss.getShift().getStartTime(), ss.getShift().getEndTime());
            if (WorkingHoursCalculator.overlapHours(a.getCheckInTime(), a.getCheckOutTime(), w) > 0) {
                ss.setStatus(StaffShiftStatus.COMPLETED);
                staffShiftRepository.save(ss);
            }
        }
    }

    private void addHours(Staff staff, Double hours) {
        double current = staff.getTotalWorkingHours() == null ? 0.0 : staff.getTotalWorkingHours();
        staff.setTotalWorkingHours(Math.round((current + hours) * 100) / 100.0);
        staffRepository.save(staff);
    }

    private static String message(AttendanceStatus type, boolean manual) {
        if (manual) {
            return "Đã ghi nhận chấm công thủ công, chờ quản lý duyệt";
        }
        return type == AttendanceStatus.CHECK_IN ? "Check-in thành công" : "Check-out thành công";
    }

    private static ShiftInfoDTO toShiftInfo(ShiftWindow w) {
        return new ShiftInfoDTO(w.name(), w.start().format(HH_MM), w.end().format(HH_MM));
    }

    private static AttendanceResultDTO toResult(Staff staff, Attendance a, ShiftInfoDTO shift, String message) {
        boolean checkedOut = a.getCheckOutTime() != null;
        return new AttendanceResultDTO(
                a.getAttendanceId(),
                checkedOut ? "CHECK_OUT" : "CHECK_IN",
                staff.getFullname(),
                checkedOut ? a.getCheckOutTime() : a.getCheckInTime(),
                shift,
                Boolean.TRUE.equals(a.getLate()),
                Boolean.TRUE.equals(a.getEarlyLeave()),
                a.getWorkingHours(),
                Boolean.TRUE.equals(a.getManual()),
                message);
    }
}
