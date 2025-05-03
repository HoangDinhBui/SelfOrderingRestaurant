package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO.CreateFeedbackRequest;
import com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO.CustomerFeedbackDTO;
import com.example.SelfOrderingRestaurant.Service.CustomerFeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class CustomerFeedbackController {
    @Autowired
    private CustomerFeedbackService feedbackService;

    // Tạo mới đánh giá
    @PostMapping
    public ResponseEntity<CustomerFeedbackDTO> createFeedback(@RequestBody CreateFeedbackRequest request) {
        CustomerFeedbackDTO feedback = feedbackService.createFeedback(request);
        return ResponseEntity.status(201).body(feedback);
    }

    // Xóa đánh giá
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Integer id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }

    // Đánh dấu đã đọc
    @PutMapping("/{id}/mark-as-read")
    public ResponseEntity<CustomerFeedbackDTO> markAsRead(@PathVariable Integer id) {
        CustomerFeedbackDTO feedback = feedbackService.markAsRead(id);
        return ResponseEntity.ok(feedback);
    }

    // Lấy tất cả đánh giá với bộ lọc
    @GetMapping
    public ResponseEntity<List<CustomerFeedbackDTO>> getAllFeedbacks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "All") String filterRating,
            @RequestParam(required = false, defaultValue = "All") String filterDate) {
        List<CustomerFeedbackDTO> feedbacks = feedbackService.getAllFeedbacks(search, filterRating, filterDate);
        return ResponseEntity.ok(feedbacks);
    }
}
