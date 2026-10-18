package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.FaceVerificationClient.VerifyResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AttendanceServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate D = LocalDate.of(2026, 10, 18);
    private static final byte[] IMG = {1};

    private AttendanceRepository attendanceRepository;
    private StaffRepository staffRepository;
    private StaffShiftRepository staffShiftRepository;
    private FaceVerificationClient faceClient;
    private AttendanceService service;
    private Staff staff;
    private final List<Attendance> records = new ArrayList<>();
    private final List<StaffShift> shifts = new ArrayList<>();

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRepository.class);
        staffRepository = mock(StaffRepository.class);
        staffShiftRepository = mock(StaffShiftRepository.class);
        faceClient = mock(FaceVerificationClient.class);
        service = new AttendanceService(attendanceRepository, staffRepository, staffShiftRepository, faceClient);

        staff = new Staff();
        staff.setStaffId(1);
        staff.setFullname("Bùi Đình Hoàng");
        staff.setFaceImagePath("ref.jpg");
        staff.setTotalWorkingHours(10.0);

        when(staffRepository.findByUserUsername("hoang")).thenReturn(Optional.of(staff));
        when(attendanceRepository.findByStaffIdAndCheckInTimeBetween(eq(1), any(), any())).thenReturn(records);
        when(attendanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(staffShiftRepository.findByStaffAndDate(eq(staff), any())).thenReturn(shifts);
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(true, false, false));
    }

    private void now(LocalDateTime t) {
        service.setClock(Clock.fixed(t.atZone(ZONE).toInstant(), ZONE));
    }

    private void morningShift() {
        Shift shift = new Shift();
        shift.setName("Ca sáng");
        shift.setStartTime(LocalTime.of(8, 0));
        shift.setEndTime(LocalTime.of(14, 0));
        StaffShift ss = new StaffShift();
        ss.setShift(shift);
        ss.setStaff(staff);
        ss.setDate(D);
        ss.setStatus(StaffShiftStatus.ASSIGNED);
        shifts.add(ss);
    }

    private Attendance openRecord(LocalDateTime checkIn) {
        Attendance a = new Attendance();
        a.setAttendanceId(7);
        a.setStaffId(1);
        a.setCheckInTime(checkIn);
        a.setStatus(AttendanceStatus.CHECK_IN);
        records.add(a);
        return a;
    }

    @Test
    void checkIn_success_returnsShiftAndSavesRecord() {
        morningShift();
        now(D.atTime(7, 58));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_IN, IMG);
        assertEquals("CHECK_IN", r.type());
        assertEquals("Bùi Đình Hoàng", r.staffName());
        assertEquals("Ca sáng", r.shift().name());
        assertEquals("08:00", r.shift().start());
        assertFalse(r.late());
        assertFalse(r.manual());
        verify(attendanceRepository).save(argThat(a -> a.getCheckInTime().equals(D.atTime(7, 58))
                && a.getStatus() == AttendanceStatus.CHECK_IN && !Boolean.TRUE.equals(a.getManual())));
    }

    @Test
    void checkIn_late_isFlagged() {
        morningShift();
        now(D.atTime(8, 20));
        assertTrue(service.scan("hoang", AttendanceStatus.CHECK_IN, IMG).late());
    }

    @Test
    void checkIn_twice_throwsAlreadyCheckedIn_withoutCallingFaceService() {
        openRecord(D.atTime(7, 58));
        now(D.atTime(9, 0));
        AttendanceException ex = assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG));
        assertEquals(AttendanceError.ALREADY_CHECKED_IN, ex.getError());
        verifyNoInteractions(faceClient);
    }

    @Test
    void checkOut_withoutCheckIn_throwsNotCheckedIn() {
        now(D.atTime(14, 0));
        assertEquals(AttendanceError.NOT_CHECKED_IN, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG)).getError());
    }

    @Test
    void checkOut_twice_throwsAlreadyCheckedOut() {
        Attendance a = openRecord(D.atTime(7, 58));
        a.setCheckOutTime(D.atTime(14, 0));
        a.setStatus(AttendanceStatus.CHECK_OUT);
        now(D.atTime(15, 0));
        assertEquals(AttendanceError.ALREADY_CHECKED_OUT, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG)).getError());
    }

    @Test
    void checkOut_success_computesHoursAddsToStaffAndCompletesShift() {
        morningShift();
        openRecord(D.atTime(7, 58));
        now(D.atTime(14, 5));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(6.0, r.workingHours());
        assertFalse(r.earlyLeave());
        assertEquals(16.0, staff.getTotalWorkingHours());
        verify(staffRepository).save(staff);
        assertEquals(StaffShiftStatus.COMPLETED, shifts.get(0).getStatus());
        verify(staffShiftRepository).save(shifts.get(0));
    }

    @Test
    void checkOut_afterMidnight_findsOpenRecordFromYesterday() {
        openRecord(D.atTime(22, 0));
        now(D.plusDays(1).atTime(6, 0));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(8.0, r.workingHours());
    }

    @Test
    void scan_mismatch_throwsFaceMismatch() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, false, false));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.FACE_MISMATCH, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void scan_spoof_throwsSpoofDetected() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, true, false));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.SPOOF_DETECTED, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void scan_noFace_throwsNoFace() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, false, true));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.NO_FACE, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void scan_serviceDown_propagatesUnavailable() {
        when(faceClient.verify(any(), any())).thenThrow(new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void manualCheckOut_doesNotAddHoursUntilApproved() {
        Attendance a = openRecord(D.atTime(8, 0));
        now(D.atTime(12, 0));
        AttendanceResultDTO r = service.manual("hoang", AttendanceStatus.CHECK_OUT, "Camera hỏng");
        assertTrue(r.manual());
        assertEquals(10.0, staff.getTotalWorkingHours());
        assertNull(a.getApproved());
        assertEquals("Camera hỏng", a.getManualReason());
        verifyNoInteractions(faceClient);

        when(attendanceRepository.findById(7)).thenReturn(Optional.of(a));
        when(staffRepository.findById(1)).thenReturn(Optional.of(staff));
        service.review(7, true);
        assertTrue(a.getApproved());
        assertEquals(14.0, staff.getTotalWorkingHours());
    }

    @Test
    void review_reject_doesNotAddHours_andSecondReviewFails() {
        Attendance a = openRecord(D.atTime(8, 0));
        now(D.atTime(12, 0));
        service.manual("hoang", AttendanceStatus.CHECK_OUT, "Camera hỏng");
        when(attendanceRepository.findById(7)).thenReturn(Optional.of(a));
        service.review(7, false);
        assertFalse(a.getApproved());
        assertEquals(10.0, staff.getTotalWorkingHours());
        assertEquals(AttendanceError.ALREADY_REVIEWED,
                assertThrows(AttendanceException.class, () -> service.review(7, true)).getError());
    }

    @Test
    void faceCheckOut_afterPendingManualCheckIn_defersHours() {
        Attendance a = openRecord(D.atTime(8, 0));
        a.setManual(true);
        now(D.atTime(12, 0));
        service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(10.0, staff.getTotalWorkingHours());
        verify(staffRepository, never()).save(any());
    }

    @Test
    void manualCheckInThenCheckOut_keepsBothMaxLengthReasons() {
        String inReason = "a".repeat(255);
        String outReason = "b".repeat(255);
        when(attendanceRepository.save(any())).thenAnswer(inv -> {
            Attendance saved = inv.getArgument(0);
            if (!records.contains(saved)) {
                records.add(saved);
            }
            return saved;
        });
        now(D.atTime(8, 0));
        service.manual("hoang", AttendanceStatus.CHECK_IN, inReason);
        now(D.atTime(12, 0));
        service.manual("hoang", AttendanceStatus.CHECK_OUT, outReason);

        String stored = records.get(0).getManualReason();
        assertTrue(stored.contains(inReason));
        assertTrue(stored.contains(outReason));
        assertTrue(stored.length() <= 520);
    }

    @Test
    void today_reportsStatus() {
        now(D.atTime(7, 0));
        assertEquals("NONE", service.today("hoang").status());
        Attendance a = openRecord(D.atTime(7, 58));
        now(D.atTime(9, 0));
        AttendanceTodayDTO t = service.today("hoang");
        assertEquals("CHECKED_IN", t.status());
        assertEquals(7, t.attendance().attendanceId());
        a.setCheckOutTime(D.atTime(14, 0));
        assertEquals("CHECKED_OUT", service.today("hoang").status());
    }
}
