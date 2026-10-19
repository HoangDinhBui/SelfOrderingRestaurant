package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {
    Staff findByUser(User user);
    List<Staff> findAllByStatus(UserStatus status);
    Optional<Staff> findById(Integer id);
    Optional<Staff> findByUserUsername(String username);

    /** SELECT ... FOR UPDATE: tuần tự hoá các lần chấm công đồng thời của cùng một nhân viên. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Staff s WHERE s.staffId = :staffId")
    Optional<Staff> findWithLockByStaffId(@Param("staffId") Integer staffId);
}
