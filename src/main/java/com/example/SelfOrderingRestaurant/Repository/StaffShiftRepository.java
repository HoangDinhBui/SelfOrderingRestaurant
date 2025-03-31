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
    @Query("SELECT ss.staff FROM StaffShift ss " +
            "WHERE ss.date = :date " +
            "AND ss.status = 'ASSIGNED' " +
            "AND ((ss.shift.startTime <= ss.shift.endTime AND :currentTime BETWEEN ss.shift.startTime AND ss.shift.endTime) " +
            "OR (ss.shift.startTime > ss.shift.endTime AND (:currentTime >= ss.shift.startTime OR :currentTime <= ss.shift.endTime)))")
    List<Staff> findStaffOnCurrentShift(LocalDate date, LocalTime currentTime);

    List<StaffShift> findByStaffStaffId(Integer staffId);
}
