package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.PendingDishUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PendingDishUpdateRepository extends JpaRepository<PendingDishUpdate, Integer> {
    Optional<PendingDishUpdate> findByDishIdAndEffectiveDateTimeAfter(Integer dishId, LocalDateTime now);
    List<PendingDishUpdate> findByEffectiveDateTimeBefore(LocalDateTime now);
}
