package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.StaffShiftAssignmentDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Repository.ShiftRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.ShiftService;
import com.example.SelfOrderingRestaurant.Service.StaffShiftService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class StaffShiftScheduleIntegrationTest {

    @Autowired
    private StaffShiftService staffShiftService;

    @Autowired
    private ShiftService shiftService;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    private Shift morning;
    private Shift lateMorning;
    private LocalDate tomorrow;

    @BeforeEach
    public void setup() {
        morning = shift("Test sáng", "07:30", "12:30");
        lateMorning = shift("Test trưa", "10:00", "14:00");
        tomorrow = LocalDate.now().plusDays(1);
    }

    private Shift shift(String name, String start, String end) {
        Shift shift = new Shift();
        shift.setName(name);
        shift.setStartTime(LocalTime.parse(start));
        shift.setEndTime(LocalTime.parse(end));
        return shiftRepository.save(shift);
    }

    private Staff staff(String name) {
        Staff staff = new Staff();
        staff.setFullname(name);
        staff.setPosition("Waiter");
        staff.setStatus(UserStatus.ACTIVE);
        return staffRepository.save(staff);
    }

    @Test
    public void defaultShiftsAreSeededOnAnEmptyDatabase() {
        List<String> names = shiftRepository.findAll().stream().map(Shift::getName).toList();
        assertTrue(names.containsAll(List.of("Ca sáng", "Ca chiều", "Ca tối")), names.toString());
    }

    @Test
    public void severalStaffCanWorkTheSameShift() {
        Staff a = staff("A");
        Staff b = staff("B");

        staffShiftService.assignShiftByAdmin(a.getStaffId(), morning.getShiftId(), tomorrow);
        staffShiftService.assignShiftByAdmin(b.getStaffId(), morning.getShiftId(), tomorrow);

        assertEquals(2, staffShiftRepository.findByDateAndShift(tomorrow, morning).size());
    }

    @Test
    public void aShiftHoldsAtMostThreeStaff() {
        for (String name : List.of("A", "B", "C")) {
            staffShiftService.assignShiftByAdmin(staff(name).getStaffId(), morning.getShiftId(), tomorrow);
        }
        Integer fourth = staff("D").getStaffId();

        assertThrows(BadRequestException.class,
                () -> staffShiftService.assignShiftByAdmin(fourth, morning.getShiftId(), tomorrow));
    }

    @Test
    public void oneStaffCannotHoldOverlappingShifts() {
        Staff a = staff("A");
        staffShiftService.assignShiftByAdmin(a.getStaffId(), morning.getShiftId(), tomorrow);

        assertThrows(BadRequestException.class,
                () -> staffShiftService.assignShiftByAdmin(a.getStaffId(), lateMorning.getShiftId(), tomorrow));
    }

    @Test
    public void cannotAssignIntoThePast() {
        Integer a = staff("A").getStaffId();

        assertThrows(BadRequestException.class,
                () -> staffShiftService.assignShiftByAdmin(a, morning.getShiftId(), LocalDate.now().minusDays(1)));
    }

    @Test
    public void assignmentsAreListedWithStaffAndShiftDetails() {
        Staff a = staff("Nguyễn A");
        staffShiftService.assignShiftByAdmin(a.getStaffId(), morning.getShiftId(), tomorrow);
        staffShiftService.assignShiftByAdmin(a.getStaffId(), morning.getShiftId(), tomorrow.plusDays(10));

        List<StaffShiftAssignmentDTO> week = staffShiftService.getAssignments(tomorrow, tomorrow.plusDays(6));

        StaffShiftAssignmentDTO mine = week.stream()
                .filter(x -> x.getStaffId().equals(a.getStaffId())).findFirst().orElseThrow();
        assertEquals(1, week.stream().filter(x -> x.getStaffId().equals(a.getStaffId())).count());
        assertEquals("Nguyễn A", mine.getStaffName());
        assertEquals(morning.getShiftId(), mine.getShiftId());
        assertEquals(tomorrow, mine.getDate());
        assertEquals(LocalTime.of(7, 30), mine.getStartTime());
    }

    @Test
    public void adminCanRemoveAnUpcomingAssignment() {
        Staff a = staff("A");
        staffShiftService.assignShiftByAdmin(a.getStaffId(), morning.getShiftId(), tomorrow);
        Integer id = staffShiftRepository.findByStaffAndDate(a, tomorrow).get(0).getStaffShiftKey();

        staffShiftService.removeAssignmentByAdmin(id);

        assertTrue(staffShiftRepository.findById(id).isEmpty());
    }

    @Test
    public void pastAssignmentsAreKeptForAttendanceHistory() {
        StaffShift past = new StaffShift();
        past.setStaff(staff("A"));
        past.setShift(morning);
        past.setDate(LocalDate.now().minusDays(2));
        past.setStatus(StaffShiftStatus.ASSIGNED);
        Integer id = staffShiftRepository.save(past).getStaffShiftKey();

        assertThrows(BadRequestException.class, () -> staffShiftService.removeAssignmentByAdmin(id));
    }

    @Test
    public void aShiftInUseCannotBeDeleted() {
        staffShiftService.assignShiftByAdmin(staff("A").getStaffId(), morning.getShiftId(), tomorrow);

        assertThrows(BadRequestException.class, () -> shiftService.deleteShift(morning.getShiftId()));
    }
}
