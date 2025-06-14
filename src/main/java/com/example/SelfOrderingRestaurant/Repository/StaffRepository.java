package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {
    Staff findByUser(User user);
    List<Staff> findAllByStatus(UserStatus status);
    Optional<Staff> findById(Integer id);
    Optional<Staff> findByUserUsername(String username);
}
