package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.StaffMonthlySalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffMonthlySalaryRepository extends JpaRepository<StaffMonthlySalary, Integer> {
    List<StaffMonthlySalary> findByStaff_StaffIdAndMonthYear(Integer staffId, LocalDate monthYear);
    List<StaffMonthlySalary> findByMonthYear(LocalDate monthYear);
}