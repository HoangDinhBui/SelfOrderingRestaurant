package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Integer> {
    boolean existsByStaffAndShiftAndDate(Staff staff, Shift shift, LocalDate date);
    // An overnight shift (start > end) assigned on day D runs from D start until D+1 end, so after
    // midnight it is found through yesterday's assignment.
    @Query("SELECT DISTINCT ss.staff FROM StaffShift ss " +
            "WHERE ss.status = 'ASSIGNED' AND (" +
            " (ss.date = :date AND ss.shift.startTime <= ss.shift.endTime" +
            "   AND :currentTime BETWEEN ss.shift.startTime AND ss.shift.endTime)" +
            " OR (ss.date = :date AND ss.shift.startTime > ss.shift.endTime AND :currentTime >= ss.shift.startTime)" +
            " OR (ss.date = :yesterday AND ss.shift.startTime > ss.shift.endTime AND :currentTime <= ss.shift.endTime))")
    List<Staff> findStaffOnShiftAt(LocalDate date, LocalDate yesterday, LocalTime currentTime);

    default List<Staff> findStaffOnCurrentShift(LocalDate date, LocalTime currentTime) {
        return findStaffOnShiftAt(date, date.minusDays(1), currentTime);
    }

    List<StaffShift> findByStaffStaffId(Integer staffId);

    StaffShift findByStaffAndShiftAndDate(Staff staff, Shift shift, LocalDate date);

    List<StaffShift> findByStaffAndDate(Staff staff, LocalDate date);

    List<StaffShift> findByStaffAndDateBetween(Staff staff, LocalDate startDate, LocalDate endDate);

    @Query("SELECT ss FROM StaffShift ss WHERE ss.date = :date")
    List<StaffShift> findByDate(LocalDate date);

    List<StaffShift> findByDateAndShift(LocalDate date, Shift shift);

    List<StaffShift> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);

    boolean existsByShift(Shift shift);
}
