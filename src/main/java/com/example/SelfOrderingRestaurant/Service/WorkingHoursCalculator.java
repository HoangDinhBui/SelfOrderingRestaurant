package com.example.SelfOrderingRestaurant.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Tính giờ công theo ca. Hàm thuần, không phụ thuộc Spring. */
public final class WorkingHoursCalculator {

    public static final Duration GRACE = Duration.ofMinutes(5);

    private WorkingHoursCalculator() {
    }

    public record ShiftWindow(String name, LocalDateTime start, LocalDateTime end) {
        public static ShiftWindow of(String name, LocalDate date, LocalTime start, LocalTime end) {
            LocalDateTime s = date.atTime(start);
            LocalDateTime e = date.atTime(end);
            if (!end.isAfter(start)) {
                e = e.plusDays(1); // ca qua đêm
            }
            return new ShiftWindow(name, s, e);
        }
    }

    public record Result(double workingHours, boolean late, boolean earlyLeave) {
    }

    public static boolean isLate(LocalDateTime checkIn, List<ShiftWindow> shifts) {
        return shifts.stream()
                .map(ShiftWindow::start)
                .min(Comparator.naturalOrder())
                .map(start -> checkIn.isAfter(start.plus(GRACE)))
                .orElse(false);
    }

    public static Result calculate(LocalDateTime checkIn, LocalDateTime checkOut, List<ShiftWindow> shifts) {
        if (shifts.isEmpty()) {
            return new Result(round(Duration.between(checkIn, checkOut)), false, false);
        }
        double hours = shifts.stream().mapToDouble(s -> overlapHoursRaw(checkIn, checkOut, s)).sum();
        LocalDateTime lastEnd = shifts.stream().map(ShiftWindow::end).max(Comparator.naturalOrder()).orElseThrow();
        boolean earlyLeave = checkOut.isBefore(lastEnd.minus(GRACE));
        return new Result(round(hours), isLate(checkIn, shifts), earlyLeave);
    }

    public static double overlapHours(LocalDateTime checkIn, LocalDateTime checkOut, ShiftWindow shift) {
        return round(overlapHoursRaw(checkIn, checkOut, shift));
    }

    public static Optional<ShiftWindow> displayShift(LocalDateTime at, List<ShiftWindow> shifts) {
        Optional<ShiftWindow> containing = shifts.stream()
                .filter(s -> !at.isBefore(s.start()) && at.isBefore(s.end()))
                .findFirst();
        if (containing.isPresent()) {
            return containing;
        }
        return shifts.stream()
                .min(Comparator.comparingLong(s -> Math.abs(Duration.between(at, s.start()).toMinutes())));
    }

    private static double overlapHoursRaw(LocalDateTime checkIn, LocalDateTime checkOut, ShiftWindow shift) {
        LocalDateTime from = checkIn.isAfter(shift.start()) ? checkIn : shift.start();
        LocalDateTime to = checkOut.isBefore(shift.end()) ? checkOut : shift.end();
        return to.isAfter(from) ? Duration.between(from, to).toMinutes() / 60.0 : 0.0;
    }

    private static double round(Duration d) {
        return round(d.toMinutes() / 60.0);
    }

    private static double round(double hours) {
        return Math.round(hours * 100) / 100.0;
    }
}
