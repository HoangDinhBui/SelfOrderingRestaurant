package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.Result;
import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.ShiftWindow;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WorkingHoursCalculatorTest {

    private static final LocalDate D = LocalDate.of(2026, 10, 18);
    private static final ShiftWindow MORNING = ShiftWindow.of("Ca sáng", D, LocalTime.of(8, 0), LocalTime.of(14, 0));

    private static LocalDateTime at(int h, int m) {
        return D.atTime(h, m);
    }

    @Test
    void onTime_countsOnlyShiftHours() {
        Result r = WorkingHoursCalculator.calculate(at(7, 58), at(14, 5), List.of(MORNING));
        assertEquals(6.0, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
    }

    @Test
    void lateWithinGrace_isNotLate() {
        Result r = WorkingHoursCalculator.calculate(at(8, 4), at(14, 0), List.of(MORNING));
        assertFalse(r.late());
        assertEquals(5.93, r.workingHours());
    }

    @Test
    void lateBeyondGrace_isLate() {
        assertTrue(WorkingHoursCalculator.isLate(at(8, 6), List.of(MORNING)));
        assertTrue(WorkingHoursCalculator.calculate(at(8, 6), at(14, 0), List.of(MORNING)).late());
    }

    @Test
    void earlyLeave_beyondGraceOnly() {
        assertTrue(WorkingHoursCalculator.calculate(at(8, 0), at(13, 50), List.of(MORNING)).earlyLeave());
        assertFalse(WorkingHoursCalculator.calculate(at(8, 0), at(13, 56), List.of(MORNING)).earlyLeave());
    }

    @Test
    void twoShifts_sumsOverlaps_ignoresGap() {
        ShiftWindow a = ShiftWindow.of("Sáng", D, LocalTime.of(8, 0), LocalTime.of(11, 0));
        ShiftWindow b = ShiftWindow.of("Tối", D, LocalTime.of(17, 0), LocalTime.of(22, 0));
        Result r = WorkingHoursCalculator.calculate(at(7, 55), at(22, 10), List.of(b, a));
        assertEquals(8.0, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
    }

    @Test
    void overnightShift_endsNextDay() {
        ShiftWindow night = ShiftWindow.of("Ca đêm", D, LocalTime.of(22, 0), LocalTime.of(6, 0));
        assertEquals(D.plusDays(1).atTime(6, 0), night.end());
        Result r = WorkingHoursCalculator.calculate(at(21, 58), D.plusDays(1).atTime(6, 3), List.of(night));
        assertEquals(8.0, r.workingHours());
        assertFalse(r.earlyLeave());
    }

    @Test
    void noShift_countsActualHours() {
        Result r = WorkingHoursCalculator.calculate(at(9, 0), at(12, 30), List.of());
        assertEquals(3.5, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
        assertFalse(WorkingHoursCalculator.isLate(at(23, 0), List.of()));
    }

    @Test
    void workedEntirelyOutsideShift_isZero() {
        Result r = WorkingHoursCalculator.calculate(at(5, 0), at(7, 0), List.of(MORNING));
        assertEquals(0.0, r.workingHours());
        assertTrue(r.earlyLeave());
    }

    @Test
    void displayShift_prefersContainingThenNearest() {
        ShiftWindow evening = ShiftWindow.of("Tối", D, LocalTime.of(17, 0), LocalTime.of(22, 0));
        assertEquals("Ca sáng", WorkingHoursCalculator.displayShift(at(9, 0), List.of(evening, MORNING)).orElseThrow().name());
        assertEquals("Tối", WorkingHoursCalculator.displayShift(at(16, 30), List.of(MORNING, evening)).orElseThrow().name());
        assertTrue(WorkingHoursCalculator.displayShift(at(9, 0), List.of()).isEmpty());
    }
}
