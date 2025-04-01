package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Revenue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RevenueRepository extends JpaRepository<Revenue, Long> {
    Optional<Revenue> findByDate(LocalDate date);

    List<Revenue> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT r FROM Revenue r WHERE YEAR(r.date) = :year AND MONTH(r.date) = :month ORDER BY r.date")
    List<Revenue> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT r FROM Revenue r WHERE YEAR(r.date) = :year ORDER BY r.date")
    List<Revenue> findByYear(@Param("year") int year);

    @Query("SELECT DISTINCT YEAR(r.date) FROM Revenue r ORDER BY YEAR(r.date) DESC")
    List<Integer> findDistinctYears();

    @Query(value = "SELECT SUM(total_revenue) FROM revenue WHERE YEAR(date) = :year AND MONTH(date) = :month", nativeQuery = true)
    BigDecimal sumTotalRevenueByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query(value = "SELECT SUM(total_revenue) FROM revenue WHERE YEAR(date) = :year", nativeQuery = true)
    BigDecimal sumTotalRevenueByYear(@Param("year") int year);
}
