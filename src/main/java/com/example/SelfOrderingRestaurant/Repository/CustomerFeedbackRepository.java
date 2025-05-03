package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.CustomerFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Integer>{
    @Query("SELECT cf FROM CustomerFeedback cf " +
            "LEFT JOIN cf.customer c " +
            "WHERE (:search IS NULL OR LOWER(c.fullname) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:rating IS NULL OR cf.rating = :rating) " +
            "AND (:date IS NULL OR DATE_FORMAT(cf.feedbackDate, '%d/%m/%Y') = :date)")
    List<CustomerFeedback> findFeedbacksWithFilters(
            @Param("search") String search,
            @Param("rating") Integer rating,
            @Param("date") String date);
}
