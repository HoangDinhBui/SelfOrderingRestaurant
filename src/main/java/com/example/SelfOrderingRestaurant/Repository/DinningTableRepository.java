package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface DinningTableRepository extends JpaRepository<DinningTable, Integer> {

    // Phương thức tìm bàn với khóa bi quan, sử dụng tableNumber thay vì tableId
    @Query("SELECT t FROM DinningTable t WHERE t.tableNumber = :tableNumber")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DinningTable> findByIdForUpdate(@Param("tableNumber") Integer tableNumber);

    // Phương thức cập nhật trạng thái bàn, sử dụng tableNumber thay vì tableId
    @Query("UPDATE DinningTable t SET t.tableStatus = :status WHERE t.tableNumber = :tableNumber")
    void updateTableStatus(@Param("tableNumber") Integer tableNumber, @Param("status") TableStatus status);
}