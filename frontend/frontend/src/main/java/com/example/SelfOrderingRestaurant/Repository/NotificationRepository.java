package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Notification;
import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer>{
    List<Notification> findByUserUserId(Integer userId);

    // Find unread notifications for a user
    List<Notification> findByUserUserIdAndIsReadFalse(Integer userId);

    // Find notifications by type
    List<Notification> findByType(String type);

    // Mark notification as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :notificationId")
    void markAsRead(Integer notificationId);

    // Find notifications for staff on current shift
    @Query("SELECT n FROM Notification n WHERE n.user.userId IN " +
            "(SELECT ss.staff.user.userId FROM StaffShift ss " +
            "WHERE ss.date = CURRENT_DATE " +
            "AND ss.status = 'ASSIGNED' " +
            "AND ((ss.shift.startTime <= ss.shift.endTime AND CURRENT_TIME BETWEEN ss.shift.startTime AND ss.shift.endTime) " +
            "OR (ss.shift.startTime > ss.shift.endTime AND (CURRENT_TIME >= ss.shift.startTime OR CURRENT_TIME <= ss.shift.endTime))))")
    List<Notification> findCurrentShiftNotifications();

    // Clear old notifications
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createAt < :cutoffDate AND n.isRead = true")
    void deleteOldReadNotifications(LocalDateTime cutoffDate);

    // Add this query to NotificationRepository
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.userId = :userId AND n.isRead = true")
    void deleteAllReadByUserId(@Param("userId") Integer userId);

    boolean existsByTypeAndContentContaining(NotificationType type, String contentPattern);

    // Find notifications by table number
    @Query("SELECT n FROM Notification n WHERE n.title LIKE %:tablePattern% ORDER BY n.createAt DESC")
    List<Notification> findByTableNumberOrderByCreateAtDesc(@Param("tablePattern") String tablePattern);

    // Alternative query using a custom implementation for table lookup
    default List<Notification> findByTableNumberOrderByCreateAtDesc(Integer tableNumber) {
        return findByTableNumberOrderByCreateAtDesc("Table " + tableNumber);
    }
}