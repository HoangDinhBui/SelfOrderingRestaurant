package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO.NotificationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DinningTableRepository dinningTableRepository;

    @Autowired
    private CustomerRepository customerRepository;

     @Transactional
    public List<NotificationResponseDTO> getNotificationsByUserId(Integer userId){
         List<Notification> notifications = notificationRepository.findByUserUserId(userId);
         return mapToResponseDTOs(notifications);
    }

    @Transactional
    public List<NotificationResponseDTO> getCurrentShiftNotifications() {
        List<Notification> notifications = notificationRepository.findCurrentShiftNotifications();
        return mapToResponseDTOs(notifications);
    }

    @Transactional
    public void markNotificationAsRead(Integer notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Transactional
    public void createNotification(NotificationRequestDTO requestDTO) {
        // Get the customer who created the notification
        Customer customer = customerRepository.findById(requestDTO.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Get the table information
        DinningTable table = dinningTableRepository.findById(requestDTO.getTableNumber())
                .orElseThrow(() -> new RuntimeException("Table not found"));

        // Get order information if available
        Order order = null;
        if (requestDTO.getOrderId() != null) {
            order = orderRepository.findById(requestDTO.getOrderId())
                    .orElse(null);
        }

        // Find staff currently on shift
        LocalDate today = LocalDate.now();
        LocalTime currentTime = LocalTime.now();

        List<Staff> onShiftStaff = staffShiftRepository.findStaffOnCurrentShift(today, currentTime);

        if (onShiftStaff.isEmpty()) {
            throw new RuntimeException("No staff are currently on shift");
        }

        // Create a notification for each staff member on shift
        for (Staff staff : onShiftStaff) {
            Notification notification = new Notification();
            notification.setUser(staff.getUser());

            // Set notification details based on type
            switch (requestDTO.getType()) {
                case NEW_ORDER:
                    notification.setTitle("New Order from Table " + table.getTableNumber());
                    notification.setContent("Customer " + customer.getFullname() +
                            " has placed a new order" +
                            (order != null ? " #" + order.getOrderId() : ""));
                    break;

                case CALL_STAFF:
                    notification.setTitle("Staff Requested at Table " + table.getTableNumber());
                    notification.setContent("Customer " + customer.getFullname() +
                            " is requesting assistance" +
                            (requestDTO.getAdditionalMessage() != null ? ": " +
                                    requestDTO.getAdditionalMessage() : ""));
                    break;

                case PAYMENT_REQUEST:
                    notification.setTitle("Payment Request from Table " + table.getTableNumber());
                    notification.setContent("Customer " + customer.getFullname() +
                            " would like to pay for " +
                            (order != null ? "order #" + order.getOrderId() : "their order"));
                    break;

                default:
                    notification.setTitle("Notification from Table " + table.getTableNumber());
                    notification.setContent(requestDTO.getAdditionalMessage());
                    break;
            }

            notification.setType(requestDTO.getType());
            notification.setCreateAt(LocalDateTime.now());
            notification.setIsRead(false);
            notification.setExpiryDate(LocalDateTime.now().plusDays(1)); // Expire after 1 day

            notificationRepository.save(notification);
        }
    }

    private List<NotificationResponseDTO> mapToResponseDTOs(List<Notification> notifications) {
        return notifications.stream()
                .map(n -> {
                    NotificationResponseDTO dto = new NotificationResponseDTO();
                    dto.setNotificationId(n.getNotificationId());
                    dto.setTitle(n.getTitle());
                    dto.setContent(n.getContent());
                    dto.setIsRead(n.getIsRead());
                    dto.setType(n.getType());
                    dto.setCreateAt(n.getCreateAt());

                    // Extract table number from title if possible
                    String title = n.getTitle();
                    if (title != null && title.contains("Table ")) {
                        try {
                            String tableStr = title.substring(title.indexOf("Table ") + 6).split(" ")[0];
                            dto.setTableNumber(Integer.parseInt(tableStr));
                        } catch (Exception e) {
                            // Unable to parse table number, leave as null
                        }
                    }

                    // Extract order ID from content if possible
                    String content = n.getContent();
                    if (content != null && content.contains("order #")) {
                        try {
                            String orderStr = content.substring(content.indexOf("order #") + 7).split(" ")[0];
                            dto.setOrderId(Integer.parseInt(orderStr));
                        } catch (Exception e) {
                            // Unable to parse order ID, leave as null
                        }
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Scheduled task to clean up old read notifications (runs daily at 2 AM)
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7); // Keep for 7 days
        notificationRepository.deleteOldReadNotifications(cutoffDate);
    }
}
