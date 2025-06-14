package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {

    // Sửa phương thức để trả về List thay vì Optional
    List<Attendance> findByStaffIdAndCheckInTimeBetweenAndStatus(
            Integer staffId, LocalDateTime startOfDay, LocalDateTime endOfDay, Attendance.AttendanceStatus status);

    // Giữ các phương thức khác
    List<Attendance> findByStaffIdAndCheckInTimeBetween(
            Integer staffId, LocalDateTime startDateTime, LocalDateTime endDateTime);

    @Query("SELECT COALESCE(SUM(a.workingHours), 0.0) FROM Attendance a " +
            "WHERE a.staffId = :staffId AND a.checkInTime BETWEEN :startDateTime AND :endDateTime " +
            "AND a.status = 'CHECK_OUT'")
    Double sumWorkingHoursByStaffIdAndCheckInTimeBetween(
            Integer staffId, LocalDateTime startDateTime, LocalDateTime endDateTime);

    List<Attendance> findByCheckInTimeBetween(LocalDateTime startOfDay, LocalDateTime endOfDay);

    @Query("SELECT a FROM Attendance a WHERE a.staffId = :staffId AND DATE(a.checkInTime) = :date")
    List<Attendance> findByStaffIdAndDate(Integer staffId, LocalDate date);
}