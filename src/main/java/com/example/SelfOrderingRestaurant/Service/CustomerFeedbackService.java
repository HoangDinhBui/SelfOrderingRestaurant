package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO.CreateFeedbackRequest;
import com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO.CustomerFeedbackDTO;
import com.example.SelfOrderingRestaurant.Entity.Customer;
import com.example.SelfOrderingRestaurant.Entity.CustomerFeedback;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.FeedbackStatus;
import com.example.SelfOrderingRestaurant.Repository.CustomerFeedbackRepository;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerFeedbackService {
    @Autowired
    private CustomerFeedbackRepository feedbackRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Tạo mới đánh giá
    public CustomerFeedbackDTO createFeedback(CreateFeedbackRequest request) {
        CustomerFeedback feedback = new CustomerFeedback();

        // Tìm Customer và Order dựa trên ID
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + request.getCustomerId()));
        Order order = request.getOrderId() != null ?
                orderRepository.findById(request.getOrderId())
                        .orElseThrow(() -> new RuntimeException("Order not found with ID: " + request.getOrderId())) :
                null;

        feedback.setCustomer(customer);
        feedback.setOrder(order);
        feedback.setRating(request.getRating());
        String comment = request.getFeedback();
        if (!request.getSelectedTags().isEmpty()) {
            comment += "\nTags: " + String.join(", ", request.getSelectedTags());
        }
        feedback.setComment(comment);

        CustomerFeedback savedFeedback = feedbackRepository.save(feedback);
        return mapToDTO(savedFeedback);
    }

    // Xóa đánh giá
    public void deleteFeedback(Integer id) {
        feedbackRepository.deleteById(id);
    }

    // Đánh dấu đã đọc
    public CustomerFeedbackDTO markAsRead(Integer id) {
        CustomerFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with ID: " + id));
        feedback.setStatus(FeedbackStatus.REVIEWED);
        CustomerFeedback updatedFeedback = feedbackRepository.save(feedback);
        return mapToDTO(updatedFeedback);
    }

    // Lấy tất cả đánh giá với bộ lọc
    public List<CustomerFeedbackDTO> getAllFeedbacks(String search, String filterRating, String filterDate) {
        Integer rating = "All".equals(filterRating) ? null : Integer.parseInt(filterRating);
        String date = "All".equals(filterDate) ? null : filterDate;

        List<CustomerFeedback> feedbacks = feedbackRepository.findFeedbacksWithFilters(search, rating, date);
        return feedbacks.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Chuyển đổi từ Entity sang DTO
    private CustomerFeedbackDTO mapToDTO(CustomerFeedback feedback) {
        CustomerFeedbackDTO dto = new CustomerFeedbackDTO();
        dto.setId(feedback.getFeedbackId());
        dto.setCustomerName(feedback.getCustomer() != null ? feedback.getCustomer().getFullname() : "Unknown");
        dto.setOrderId(feedback.getOrder() != null ? feedback.getOrder().getOrderId() : null);
        dto.setRating(feedback.getRating());
        dto.setComment(feedback.getComment());
        dto.setTime(feedback.getFeedbackDate().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        dto.setDate(feedback.getFeedbackDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dto.setChecked(feedback.getStatus() == FeedbackStatus.REVIEWED || feedback.getStatus() == FeedbackStatus.RESOLVED);
        return dto;
    }
}
